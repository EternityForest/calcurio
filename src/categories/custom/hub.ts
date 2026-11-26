import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { CalculatorApp, CategoryHandle } from '../../framework/app.js';
import { browserLocalStorage } from '../../framework/bookmarks.js';
import type { CategoryManifest } from '../../framework/types.js';
import { CalculatorCatalog } from '../../custom/catalog.js';
import { CustomStore } from '../../custom/store.js';
import type { CustomDefinition } from '../../custom/types.js';
import { CustomLibrary } from './library.js';
import type { LibraryEntry } from './library.js';
import type { CustomEditorDialog } from './editor.js';
import type { CustomImportDialog } from './import-dialog.js';
import type { CustomExportDialog } from './export-dialog.js';
import './editor.js';
import './import-dialog.js';
import './export-dialog.js';

/**
 * The Custom category's hub. It lists every saved custom, offers the creator
 * and the importer, and keeps the category's registered calculators in step
 * with storage. Opening a custom just asks the app to show it like any other
 * calculator.
 */
export class CustomHub extends LitElement {
  static override properties = {
    app: { attribute: false },
    handle: { attribute: false },
    store: { attribute: false },
    openCalculator: { attribute: false },
    onChanged: { attribute: false },
  };

  declare app: CalculatorApp<CategoryManifest> | undefined;
  declare handle: CategoryHandle | undefined;
  /**
   * Storage override. When left unset the hub uses the browser's
   * localStorage; tests set it to a store backed by memory.
   */
  declare store: CustomStore | null | undefined;
  declare openCalculator: ((calculatorId: string) => void) | undefined;
  declare onChanged: (() => void) | undefined;

  private library: CustomLibrary | null = null;
  private catalog: CalculatorCatalog | null = null;
  private prepared = false;
  private pendingDelete: string | null = null;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.ensureLibrary();
  }

  override render(): TemplateResult {
    this.ensureLibrary();
    const library = this.library;
    if (library === null || !this.prepared) {
      return html`<p class="help" data-testid="custom-preparing">
        Preparing the Custom category…
      </p>`;
    }
    return html`
      <div class="calc-actions calc-custom-toolbar">
        <button
          class="button"
          type="button"
          data-testid="new-custom"
          @click=${this.openEditor}
        >
          New custom
        </button>
        <button
          class="button"
          type="button"
          data-testid="import-custom"
          @click=${this.openImport}
        >
          Import
        </button>
      </div>
      ${this.renderError(library)} ${this.renderEntries(library)}
      <calc-custom-editor
        .catalog=${this.catalog}
        .library=${library}
        .onSaved=${this.handleSaved}
        .onDeleted=${this.handleDeleted}
      ></calc-custom-editor>
      <calc-custom-import
        .library=${library}
        .onImported=${this.handleImported}
      ></calc-custom-import>
      <calc-custom-export></calc-custom-export>
    `;
  }

  private renderError(library: CustomLibrary): TemplateResult | typeof nothing {
    const error = library.error;
    if (error === null) {
      return nothing;
    }
    return html`
      <p class="alert danger" role="alert" data-testid="custom-read-error">
        ${error}
      </p>
    `;
  }

  private renderEntries(
    library: CustomLibrary,
  ): TemplateResult | typeof nothing {
    const entries = library.entries();
    if (entries.length === 0) {
      return html`
        <p class="help" data-testid="custom-empty">
          You have no saved customs yet. Create one, or import one shared with
          you.
        </p>
      `;
    }
    return html`
      <div class="calc-custom-list">
        ${entries.map((entry) => this.renderEntry(entry))}
      </div>
    `;
  }

  private renderEntry(entry: LibraryEntry): TemplateResult {
    const custom = entry.custom;
    const summary = `${custom.steps.length} step${
      custom.steps.length === 1 ? '' : 's'
    }`;
    return html`
      <div class="calc-custom-entry" data-testid=${`custom-${custom.id}`}>
        <div class="calc-custom-entry-main">
          <strong>${custom.title}</strong>
          <span class="help">${summary}</span>
          ${
            custom.description === undefined || custom.description.trim() === ''
              ? nothing
              : html`<span class="help">${custom.description}</span>`
          }
        </div>
        ${
          entry.problem === null
            ? nothing
            : html`
                <p
                  class="alert danger"
                  role="alert"
                  data-testid=${`custom-problem-${custom.id}`}
                >
                  ${entry.problem}
                </p>
              `
        }
        <div class="calc-actions">
          <button
            class="button"
            type="button"
            data-testid=${`custom-open-${custom.id}`}
            ?disabled=${entry.problem !== null}
            @click=${() => this.openCalculator?.(custom.id)}
          >
            Open
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`custom-edit-${custom.id}`}
            @click=${() => this.edit(custom.id)}
          >
            Edit
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`custom-export-${custom.id}`}
            @click=${() => this.exportDialog?.open(custom)}
          >
            Export
          </button>
          <button
            class="button danger"
            type="button"
            data-testid=${`custom-delete-${custom.id}`}
            @click=${() => this.removeCustom(custom.id)}
          >
            ${this.pendingDelete === custom.id ? 'Confirm delete' : 'Delete'}
          </button>
        </div>
      </div>
    `;
  }

  private ensureLibrary(): void {
    const app = this.app;
    if (
      this.library !== null ||
      this.handle === undefined ||
      app === undefined
    ) {
      return;
    }
    this.catalog = new CalculatorCatalog(app);
    this.library = new CustomLibrary(
      this.handle,
      this.resolveStore(),
      this.catalog,
    );
    void this.library.refresh().then(() => {
      this.prepared = true;
      this.requestUpdate();
    });
  }

  private resolveStore(): CustomStore | null {
    if (this.store !== undefined) {
      return this.store;
    }
    const storage = browserLocalStorage();
    return storage === null ? null : new CustomStore(storage);
  }

  private readonly openEditor = (): void => {
    this.editorDialog?.open(null);
  };

  private edit(id: string): void {
    const custom = this.library?.get(id);
    if (custom !== undefined) {
      this.editorDialog?.open(custom);
    }
  }

  private readonly openImport = (): void => {
    this.importDialog?.open();
  };

  private removeCustom(id: string): void {
    const library = this.library;
    if (library === null) {
      return;
    }
    if (this.pendingDelete !== id) {
      this.pendingDelete = id;
      this.requestUpdate();
      return;
    }
    this.pendingDelete = null;
    void library.remove(id).then(
      () => this.finishChange(),
      () => this.finishChange(),
    );
  }

  private finishChange(): void {
    this.onChanged?.();
    this.requestUpdate();
  }

  private readonly handleSaved = (custom: CustomDefinition): void => {
    this.onChanged?.();
    this.requestUpdate();
    this.openCalculator?.(custom.id);
  };

  private readonly handleDeleted = (): void => {
    this.onChanged?.();
    this.requestUpdate();
  };

  private readonly handleImported = (): void => {
    this.onChanged?.();
    this.requestUpdate();
  };

  private get editorDialog(): CustomEditorDialog | null {
    return this.querySelector<CustomEditorDialog>('calc-custom-editor');
  }

  private get importDialog(): CustomImportDialog | null {
    return this.querySelector<CustomImportDialog>('calc-custom-import');
  }

  private get exportDialog(): CustomExportDialog | null {
    return this.querySelector<CustomExportDialog>('calc-custom-export');
  }
}

customElements.define('calc-custom-hub', CustomHub);
