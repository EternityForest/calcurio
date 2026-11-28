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
import { TableRowStore, applyTableRows } from '../table-rows.js';
import type {
  CalculatorDefinition,
  CategoryManifest,
  TableDefinition,
  TableResolver,
} from '../types.js';
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

/** Parses a hash fragment into a View, or returns null if the format is unrecognised. */
function parseHash(hash: string): View | null {
  if (hash.startsWith('#')) hash = hash.slice(1);
  if (hash === '' || hash === '/') return { kind: 'categories' };

  if(hash.startsWith("/")) {
    hash= hash.slice(1);
  }
  const parts = hash.split('/');
  if (parts.length < 2) return null;
  switch (parts[0]) {
    case 'category':
      return { kind: 'category', categoryId: parts[1] ?? '' };
    case 'calculator':
      if (parts.length >= 3) {
        return { kind: 'calculator', categoryId: parts[1] ?? '', calculatorId: parts[2] ?? '' };
      }
      return null;
    case 'table':
      if (parts.length >= 3) {
        return { kind: 'table', categoryId: parts[1] ?? '', tableId: parts[2] ?? '' };
      }
      return null;
    default:
      return null;
  }
}

/** Serialises a View into a hash fragment. */
function viewToHash(view: View): string {
  switch (view.kind) {
    case 'categories':
      return '#';
    case 'category':
      return `#/category/${view.categoryId}`;
    case 'calculator':
      return `#/calculator/${view.categoryId}/${view.calculatorId}`;
    case 'table':
      return `#/table/${view.categoryId}/${view.tableId}`;
  }
}

/**
 * Embeddable widget root. Shows the category list, lazily loads a category
 * when it is opened, then shows its calculators. Uses a navigation stack
 * backed by the browser history so the back button works naturally.
 */
export class CalcApp extends LitElement {
  static override properties = {
    app: { attribute: false },
  };

  declare app: CalculatorApp<CategoryManifest> | undefined;

  /** Navigation history stack. The top is always the current view. */
  private history: View[] = [];
  private loadingCategoryId: string | null = null;
  private loadError = '';
  private bookmarkStore: BookmarkStore | null = null;
  private tableRowStore: TableRowStore | null = null;
  private bookmarksInitialized = false;
  private readonly runtimes = new Map<string, CachedRuntime>();
  private popStateHandler: (() => void) | null = null;
  private pendingCategoryId: string | null = null;
  private view: View = { kind: 'categories' };

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.bookmarksInitialized) {
      this.bookmarksInitialized = true;
      const storage = browserLocalStorage();
      this.bookmarkStore = storage === null ? null : new BookmarkStore(storage);
      this.tableRowStore = storage === null ? null : new TableRowStore(storage);
    }
    // Initialise history from the current hash.
    const initialView = parseHash(window.location.hash);
    if (initialView !== null && initialView.kind !== 'categories') {
      // Landing on a deep link — push categories as the base so the back
      // button is visible and usable.
      this.history.push({ kind: 'categories' });
      this.history.push(initialView);
      this.view = initialView;
      // Trigger lazy loading for the category behind a deep-linked view.
      const categoryId =
        initialView.kind === 'category'
          ? initialView.categoryId
          : initialView.categoryId;
      if (this.app !== undefined) {
        void this.loadCategory(categoryId);
      } else {
        this.pendingCategoryId = categoryId;
      }
    } else {
      this.history.push(initialView ?? { kind: 'categories' });
      this.view = this.history[0]!;
    }
    // Listen for browser back/forward buttons.
    this.popStateHandler = () => {
      const newView = parseHash(window.location.hash);
      if (newView !== null && newView.kind !== this.view.kind) {
        // Browser navigated — pop our stack to match and restore the target view.
        const top = this.history[this.history.length - 1]!;
        while (this.history.length > 1 && top.kind !== newView.kind) {
          this.history.pop();
        }
        this.view = this.history[this.history.length - 1]!;
        this.requestUpdate();
      }
    };
    window.addEventListener('popstate', this.popStateHandler);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.popStateHandler !== null) {
      window.removeEventListener('popstate', this.popStateHandler);
      this.popStateHandler = null;
    }
  }

  override updated(): void {
    if (this.pendingCategoryId !== null && this.app !== undefined) {
      const categoryId = this.pendingCategoryId;
      this.pendingCategoryId = null;
      void this.loadCategory(categoryId);
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
    if (this.history.length <= 1) {
      return nothing;
    }
    const label = this.view.kind === 'category' ? 'All categories' : 'Back';
    return html`
      <button
        class="button"
        type="button"
        data-testid="back"
        @click=${() => this.popView()}
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
      <p class="help">
      <span class="warning">This is a new project made with LLM assistance in the proof of concept stage, do your own diligence before trusting accuracy.</span>
      </p>
      <p><a href="https://github.com/EternityForest/calcurio">Source Code under MIT License</a></p>
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
        ${this.renderHub(app, handle, hubTag)}`;
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
  private renderHub(
    app: CalculatorApp<CategoryManifest>,
    handle: CategoryHandle,
    tag: string,
  ): TemplateResult {
    const element = unsafeStatic(tag);
    return staticHtml`
      <${element}
        .app=${app}
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
    return html`
      <calc-table-view
        .table=${table}
        .store=${this.tableRowStore}
        .onChanged=${this.handleTableRowsChanged}
      ></calc-table-view>
    `;
  }

  /**
   * Re-resolves the tables behind every cached calculator after custom rows
   * change, then re-renders so the table view shows the new overlay. Values
   * already entered in the calculators are preserved.
   */
  private readonly handleTableRowsChanged = (): void => {
    for (const cached of this.runtimes.values()) {
      try {
        cached.runtime.refreshTables();
      } catch {
        // A table that can no longer be resolved is left as it was; the
        // store validates rows on save, so this should not happen.
      }
    }
    this.requestUpdate();
  };

  /**
   * Resolver handed to a runtime. It layers the user's custom rows onto each
   * built-in table so a calculator sees overrides and additions, while the
   * table view keeps showing the pristine built-in rows.
   */
  private resolverFor(handle: CategoryHandle): TableResolver {
    const store = this.tableRowStore;
    if (store === null) {
      return handle;
    }
    return {
      getTable: (id: string): TableDefinition | undefined => {
        const base = handle.getTable(id);
        if (base === undefined) {
          return undefined;
        }
        try {
          return applyTableRows(base, store.list(id));
        } catch {
          return base;
        }
      },
    };
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
    const runtime = new CalculatorRuntime(
      registered.definition,
      this.resolverFor(handle),
    );
    this.runtimes.set(registered.globalId, {
      definition: registered.definition,
      runtime,
    });
    return runtime;
  }

  /** Push a new view onto the stack and update the URL. */
  private pushView(view: View): void {
    this.history.push(view);
    this.view = view;
    window.location.hash = viewToHash(view);
    this.requestUpdate();
  }

  /** Pop the top view and restore the previous one, updating the URL. */
  private popView(): void {
    if (this.history.length <= 1) return;
    this.history.pop();
    const previous = this.history[this.history.length - 1]!;
    this.view = previous;
    window.location.hash = viewToHash(previous);
    this.requestUpdate();
  }

  private openCategory(categoryId: string): void {
    this.pushView({ kind: 'category', categoryId });
    this.loadError = '';
    this.requestUpdate();
    void this.loadCategory(categoryId);
  }

  private openCalculator(categoryId: string, calculatorId: string): void {
    this.pushView({ kind: 'calculator', categoryId, calculatorId });
    this.requestUpdate();
  }

  private openTable(categoryId: string, tableId: string): void {
    this.pushView({ kind: 'table', categoryId, tableId });
    this.requestUpdate();
  }

  private async loadCategory(categoryId: string): Promise<void> {
    if (this.app === undefined) {
      this.pendingCategoryId = categoryId;
      return;
    }
    const handle = this.app.categories[categoryId];
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
      console.error(error)
    } finally {
      if (this.loadingCategoryId === categoryId) {
        this.loadingCategoryId = null;
      }
      this.requestUpdate();
    }
  }
}

customElements.define('calc-app', CalcApp);
