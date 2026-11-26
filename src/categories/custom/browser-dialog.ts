import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../../framework/errors.js';
import type {
  CatalogCategory,
  CatalogEntry,
  CalculatorCatalog,
} from '../../custom/catalog.js';

let nextDialogId = 0;

type BrowserStage = 'categories' | 'calculators';

/**
 * Browses the calculators a custom may embed, in two steps: pick a category,
 * then pick one of its calculators. Categories load lazily, so choosing one
 * shows a brief loading state while its module is imported. Any calculator can
 * be added more than once, so no entry is ever excluded.
 */
export class CalculatorBrowserDialog extends LitElement {
  static override properties = {
    catalog: { attribute: false },
    onChosen: { attribute: false },
  };

  declare catalog: CalculatorCatalog | undefined;
  declare onChosen: ((ref: string) => void) | undefined;

  private stage: BrowserStage = 'categories';
  private categoryId: string | null = null;
  private loading = false;
  private loadError = '';
  private filter = '';
  private readonly titleId = `calc-calculator-browser-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Opens the modal at the category list, with an empty filter. */
  open(): void {
    this.reset();
    this.requestUpdate();
    void this.updateComplete.then(() => this.showDialog());
  }

  close(): void {
    const dialog = this.dialogElement;
    if (dialog === null) {
      return;
    }
    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  override render(): TemplateResult {
    return html`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Add a subcalculator</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          ${
            this.stage === 'categories'
              ? this.renderCategories()
              : this.renderCalculators()
          }
        </div>
      </dialog>
    `;
  }

  private renderCategories(): TemplateResult {
    const categories = this.visibleCategories();
    return html`
      <p class="help">Choose a category.</p>
      ${this.renderFilter()}
      <div class="calc-tiles calc-custom-browser">
        ${categories.map((category) => this.renderCategory(category))}
      </div>
      ${
        categories.length === 0
          ? html`<p class="help">No categories match this filter.</p>`
          : nothing
      }
    `;
  }

  private renderCalculators(): TemplateResult {
    const category = this.catalog
      ?.categories()
      .find((candidate) => candidate.id === this.categoryId);
    return html`
      <div class="calc-actions">
        <button
          class="button"
          type="button"
          data-testid="browser-back"
          @click=${this.backToCategories}
        >
          ← Categories
        </button>
        ${
          category === undefined
            ? nothing
            : html`<strong>${category.title}</strong>`
        }
      </div>
      ${this.renderFilter()} ${this.renderCalculatorBody()}
    `;
  }

  private renderCalculatorBody(): TemplateResult {
    if (this.loading) {
      return html`<p class="help" data-testid="browser-loading">Loading…</p>`;
    }
    if (this.loadError !== '') {
      return html`<p class="alert danger" role="alert">${this.loadError}</p>`;
    }
    const entries = this.visibleEntries();
    return html`
      <div class="calc-tiles calc-custom-browser">
        ${entries.map((entry) => this.renderEntry(entry))}
      </div>
      ${
        entries.length === 0
          ? html`<p class="help">Nothing here can be added to a custom.</p>`
          : nothing
      }
    `;
  }

  private renderFilter(): TemplateResult {
    return html`
      <label class="calc-custom-filter">
        <span class="calc-field-label">Filter</span>
        <input
          class="form-control"
          type="search"
          autocomplete="off"
          placeholder="Filter by name"
          data-testid="browser-filter"
          .value=${this.filter}
          @input=${this.handleFilter}
        />
      </label>
    `;
  }

  private renderCategory(category: CatalogCategory): TemplateResult {
    const description = category.description;
    return html`
      <button
        class="card calc-tile"
        type="button"
        data-testid=${`choose-category-${category.id}`}
        @click=${() => this.chooseCategory(category.id)}
      >
        <strong>${category.title}</strong>
        ${
          description === ''
            ? nothing
            : html`<span class="help">${description}</span>`
        }
      </button>
    `;
  }

  private renderEntry(entry: CatalogEntry): TemplateResult {
    const description = entry.definition.description ?? '';
    return html`
      <button
        class="card calc-tile"
        type="button"
        data-testid=${`choose-${entry.definition.id}`}
        @click=${() => this.choose(entry.ref)}
      >
        <strong>${entry.definition.title}</strong>
        ${
          description === ''
            ? nothing
            : html`<span class="help">${description}</span>`
        }
      </button>
    `;
  }

  private visibleCategories(): readonly CatalogCategory[] {
    const categories = this.catalog?.categories() ?? [];
    const needle = this.filter.trim().toLowerCase();
    if (needle === '') {
      return categories;
    }
    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(needle) ||
        category.id.toLowerCase().includes(needle),
    );
  }

  private visibleEntries(): readonly CatalogEntry[] {
    const categoryId = this.categoryId;
    const entries =
      categoryId === null ? [] : (this.catalog?.entries(categoryId) ?? []);
    const needle = this.filter.trim().toLowerCase();
    if (needle === '') {
      return entries;
    }
    return entries.filter(
      (entry) =>
        entry.definition.title.toLowerCase().includes(needle) ||
        entry.definition.id.toLowerCase().includes(needle),
    );
  }

  private chooseCategory(categoryId: string): void {
    this.categoryId = categoryId;
    this.stage = 'calculators';
    this.filter = '';
    this.loadError = '';
    this.loading = !(this.catalog?.isLoaded(categoryId) ?? false);
    this.requestUpdate();
    void this.loadCategory(categoryId);
  }

  private async loadCategory(categoryId: string): Promise<void> {
    const catalog = this.catalog;
    if (catalog === undefined) {
      this.loading = false;
      this.requestUpdate();
      return;
    }
    try {
      await catalog.load(categoryId);
    } catch (error) {
      this.loadError = errorMessage(error);
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  private readonly backToCategories = (): void => {
    this.stage = 'categories';
    this.categoryId = null;
    this.loadError = '';
    this.loading = false;
    this.filter = '';
    this.requestUpdate();
  };

  private readonly handleFilter = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.filter = target.value;
      this.requestUpdate();
    }
  };

  private choose(ref: string): void {
    this.onChosen?.(ref);
    this.close();
  }

  private readonly handleClose = (): void => {
    this.reset();
    this.requestUpdate();
  };

  private reset(): void {
    this.stage = 'categories';
    this.categoryId = null;
    this.loading = false;
    this.loadError = '';
    this.filter = '';
  }

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-dialog');
  }

  private showDialog(): void {
    const dialog = this.dialogElement;
    if (dialog === null || dialog.open) {
      return;
    }
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      return;
    }
    dialog.setAttribute('open', '');
  }
}

customElements.define('calc-calculator-browser', CalculatorBrowserDialog);
