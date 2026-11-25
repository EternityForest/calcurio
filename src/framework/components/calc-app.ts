import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { BookmarkStore, browserLocalStorage } from '../bookmarks.js';
import type {
  CalculatorApp,
  CategoryHandle,
  RegisteredCalculator,
} from '../app.js';
import { errorMessage } from '../errors.js';
import { CalculatorRuntime } from '../runtime.js';
import type { CalculatorDefinition, CategoryManifest } from '../types.js';
import './calculator-view.js';
import './table-view.js';

/** A cached runtime together with the definition it was built from. */
interface CachedRuntime {
  readonly definition: CalculatorDefinition;
  readonly runtime: CalculatorRuntime;
}

type View =
  | { readonly kind: 'categories' }
  | { readonly kind: 'category'; readonly categoryId: string }
  | {
      readonly kind: 'calculator';
      readonly categoryId: string;
      readonly calculatorId: string;
    }
  | {
      readonly kind: 'table';
      readonly categoryId: string;
      readonly tableId: string;
    };

/**
 * Embeddable widget root. Shows the category list, lazily loads a category
 * when it is opened, then shows its calculators.
 */
export class CalcApp extends LitElement {
  static override properties = {
    app: { attribute: false },
  };

  declare app: CalculatorApp<CategoryManifest> | undefined;

  private view: View = { kind: 'categories' };
  private loadingCategoryId: string | null = null;
  private loadError = '';
  private bookmarkStore: BookmarkStore | null = null;
  private bookmarksInitialized = false;
  private readonly runtimes = new Map<string, CachedRuntime>();

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.bookmarksInitialized) {
      this.bookmarksInitialized = true;
      const storage = browserLocalStorage();
      this.bookmarkStore = storage === null ? null : new BookmarkStore(storage);
    }
  }

  override render(): TemplateResult | typeof nothing {
    const app = this.app;
    if (app === undefined) {
      return nothing;
    }

    return html`
      <section class="window calc-widget">
        <header class="tool-bar calc-header">
          ${this.renderBackButton()} ${this.renderHeading(app)}
          <span class="spacer"></span>
          <span class="calc-brand">Calcurio</span>
        </header>
        <div class="calc-body">${this.renderBody(app)}</div>
      </section>
    `;
  }

  private renderHeading(app: CalculatorApp<CategoryManifest>): string {
    if (this.view.kind === 'categories') {
      return 'Calculators';
    }
    const handle = app.categories[this.view.categoryId];
    return handle?.title ?? 'Calculators';
  }

  private renderBackButton(): TemplateResult | typeof nothing {
    if (this.view.kind === 'categories') {
      return nothing;
    }
    const label = this.view.kind === 'category' ? 'All categories' : 'Back';
    const target: View =
      this.view.kind === 'category'
        ? { kind: 'categories' }
        : { kind: 'category', categoryId: this.view.categoryId };
    return html`
      <button
        class="button"
        type="button"
        data-testid="back"
        @click=${() => this.showView(target)}
      >
        ← ${label}
      </button>
    `;
  }

  private renderBody(
    app: CalculatorApp<CategoryManifest>,
  ): TemplateResult | typeof nothing {
    switch (this.view.kind) {
      case 'categories':
        return this.renderCategories(app);
      case 'category':
        return this.renderCategory(app, this.view.categoryId);
      case 'calculator':
        return this.renderCalculator(
          app,
          this.view.categoryId,
          this.view.calculatorId,
        );
      case 'table':
        return this.renderTable(app, this.view.categoryId, this.view.tableId);
    }
  }

  private renderCategories(
    app: CalculatorApp<CategoryManifest>,
  ): TemplateResult {
    const tiles = app.categoryIds.map((categoryId) => {
      const entry = app.manifest[categoryId];
      if (entry === undefined) {
        return nothing;
      }
      return html`
        <button
          class="card calc-tile"
          type="button"
          data-testid="category-${categoryId}"
          @click=${() => this.openCategory(categoryId)}
        >
          <strong>${entry.title}</strong>
          <span class="help">${entry.description}</span>
        </button>
      `;
    });

    return html`
      <p class="help">Choose a category to browse its calculators.</p>
      <div class="calc-tiles">${tiles}</div>
    `;
  }

  private renderCategory(
    app: CalculatorApp<CategoryManifest>,
    categoryId: string,
  ): TemplateResult {
    const handle = app.categories[categoryId];
    if (handle === undefined) {
      return html`
        <p class="alert danger">That category is not available.</p>
      `;
    }

    if (this.loadingCategoryId === categoryId) {
      return html`
        <p class="help" data-testid="category-loading">Loading…</p>
      `;
    }

    if (!handle.isLoaded) {
      return html`
        <div class="alert danger" role="alert">
          <p>${this.loadError || 'This category has not loaded yet.'}</p>
          <button
            class="button"
            type="button"
            @click=${() => void this.loadCategory(categoryId)}
          >
            Retry
          </button>
        </div>
      `;
    }

    const hubTag = app.manifest[categoryId]?.hub;
    if (hubTag !== undefined) {
      return html`<p class="help">${handle.description}</p>
        ${this.renderHub(handle, hubTag)}`;
    }

    if (handle.calculators.length === 0 && handle.tables.length === 0) {
      return html` <p class="help">Nothing in this category yet.</p> `;
    }

    return html`
      <p class="help">${handle.description}</p>
      ${this.renderCalculatorTiles(handle)} ${this.renderTableTiles(handle)}
    `;
  }

  /**
   * Renders a category's hub element. The manifest names the tag; it is
   * defined by the category module, which has loaded by the time we get here.
   * A hub owns its own list and asks the app to re-render through `onChanged`.
   */
  private renderHub(handle: CategoryHandle, tag: string): TemplateResult {
    const element = unsafeStatic(tag);
    return staticHtml`
      <${element}
        .handle=${handle}
        .openCalculator=${(calculatorId: string) =>
          this.openCalculator(handle.id, calculatorId)}
        .onChanged=${() => this.requestUpdate()}
      ></${element}>
    `;
  }

  private renderCalculatorTiles(
    handle: CategoryHandle,
  ): TemplateResult | typeof nothing {
    if (handle.calculators.length === 0) {
      return nothing;
    }
    return html`
      <div class="calc-tiles">
        ${handle.calculators.map((registered) => {
          const description = registered.definition.description ?? '';
          return html`
            <button
              class="card calc-tile"
              type="button"
              data-testid="calculator-${registered.definition.id}"
              @click=${() =>
                this.openCalculator(handle.id, registered.definition.id)}
            >
              <strong>${registered.definition.title}</strong>
              ${
                description === ''
                  ? nothing
                  : html`<span class="help">${description}</span>`
              }
            </button>
          `;
        })}
      </div>
    `;
  }

  private renderTableTiles(
    handle: CategoryHandle,
  ): TemplateResult | typeof nothing {
    if (handle.tables.length === 0) {
      return nothing;
    }
    return html`
      <h3 class="calc-section-title">Reference tables</h3>
      <div class="calc-tiles">
        ${handle.tables.map(
          (table) => html`
            <button
              class="card calc-tile"
              type="button"
              data-testid="table-${table.id}"
              @click=${() => this.openTable(handle.id, table.id)}
            >
              <strong>${table.title}</strong>
              ${
                table.description === undefined
                  ? nothing
                  : html`<span class="help">${table.description}</span>`
              }
            </button>
          `,
        )}
      </div>
    `;
  }

  private renderCalculator(
    app: CalculatorApp<CategoryManifest>,
    categoryId: string,
    calculatorId: string,
  ): TemplateResult {
    const handle = app.categories[categoryId];
    const registered = handle?.get(calculatorId);
    if (handle === undefined || registered === undefined) {
      return html`
        <p class="alert danger">That calculator is not available.</p>
      `;
    }

    let runtime: CalculatorRuntime;
    try {
      runtime = this.runtimeFor(handle, registered);
    } catch (error) {
      return html`
        <p class="alert danger calc-errors" role="alert">
          ${registered.definition.title} could not be loaded:
          ${errorMessage(error)}
        </p>
      `;
    }

    return html`
      <calc-calculator
        .runtime=${runtime}
        .globalId=${registered.globalId}
        .bookmarks=${this.bookmarkStore}
      ></calc-calculator>
    `;
  }

  private renderTable(
    app: CalculatorApp<CategoryManifest>,
    categoryId: string,
    tableId: string,
  ): TemplateResult {
    const table = app.categories[categoryId]?.getTable(tableId);
    if (table === undefined) {
      return html` <p class="alert danger">That table is not available.</p> `;
    }
    return html` <calc-table-view .table=${table}></calc-table-view> `;
  }

  /**
   * One runtime per calculator, shared across visits so values survive
   * navigation. Construction problems become a visible error instead of
   * breaking the widget. A runtime is rebuilt only when the definition it
   * was built from is replaced, so editing one custom leaves the others'
   * values untouched.
   */
  private runtimeFor(
    handle: CategoryHandle,
    registered: RegisteredCalculator,
  ): CalculatorRuntime {
    const existing = this.runtimes.get(registered.globalId);
    if (
      existing !== undefined &&
      existing.definition === registered.definition
    ) {
      return existing.runtime;
    }
    const runtime = new CalculatorRuntime(registered.definition, handle);
    this.runtimes.set(registered.globalId, {
      definition: registered.definition,
      runtime,
    });
    return runtime;
  }

  private openCategory(categoryId: string): void {
    this.view = { kind: 'category', categoryId };
    this.loadError = '';
    this.requestUpdate();
    void this.loadCategory(categoryId);
  }

  private openCalculator(categoryId: string, calculatorId: string): void {
    this.view = { kind: 'calculator', categoryId, calculatorId };
    this.requestUpdate();
  }

  private openTable(categoryId: string, tableId: string): void {
    this.view = { kind: 'table', categoryId, tableId };
    this.requestUpdate();
  }

  private showView(view: View): void {
    this.view = view;
    this.loadError = '';
    this.requestUpdate();
  }

  private async loadCategory(categoryId: string): Promise<void> {
    const handle = this.app?.categories[categoryId];
    if (handle === undefined || handle.isLoaded) {
      return;
    }
    if (this.loadingCategoryId === categoryId) {
      return;
    }

    this.loadingCategoryId = categoryId;
    this.loadError = '';
    this.requestUpdate();
    try {
      await handle.load();
    } catch (error) {
      this.loadError = `Could not load ${handle.title}: ${errorMessage(error)}`;
    } finally {
      if (this.loadingCategoryId === categoryId) {
        this.loadingCategoryId = null;
      }
      this.requestUpdate();
    }
  }
}

customElements.define('calc-app', CalcApp);
