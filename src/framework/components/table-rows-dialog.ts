import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { ValueUpdateResult } from '../runtime.js';
import type { TableDefinition } from '../types.js';

let nextDialogId = 0;

/** Whether the dialog is showing markdown to copy or accepting it to import. */
export type TableRowsMode = 'export' | 'import';

/**
 * Modal that exports a table's custom rows as a GitHub-flavoured markdown
 * table, or imports rows from pasted markdown of the same shape.
 */
export class TableRowsDialog extends LitElement {
  static override properties = {
    table: { attribute: false },
  };

  declare table: TableDefinition | undefined;

  /** Parses and saves pasted markdown; the answer decides the status line. */
  onImport: (text: string) => ValueUpdateResult = () => ({ ok: true });

  private mode: TableRowsMode = 'export';
  private text = '';
  private status = '';
  private error = '';
  private readonly titleId = `calc-rows-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Opens the dialog. `content` seeds the textarea for export. */
  open(mode: TableRowsMode, content = ''): void {
    this.mode = mode;
    this.text = content;
    this.status = '';
    this.error = '';
    this.requestUpdate();
    void this.updateComplete.then(() => {
      this.showDialog();
    });
  }

  /** Closes the modal. */
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

  override render(): TemplateResult | typeof nothing {
    const table = this.table;
    if (table === undefined) {
      return nothing;
    }
    const exporting = this.mode === 'export';

    return html`
      <dialog
        class="calc-dialog calc-rows-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>
              ${exporting ? 'Export' : 'Import'} custom rows
            </h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          <p class="help">
            ${
              exporting
                ? `Every custom row for "${table.title}" as a markdown table.`
                : 'Paste a markdown table with the same columns to add or replace custom rows.'
            }
          </p>

          <textarea
            class="form-control calc-rows-markdown"
            data-testid="rows-markdown"
            rows="12"
            spellcheck="false"
            ?readonly=${exporting}
            .value=${this.text}
            @input=${this.handleInput}
          ></textarea>

          ${
            this.error === ''
              ? nothing
              : html`<p class="alert danger" role="alert">${this.error}</p>`
          }
          ${
            this.status === ''
              ? nothing
              : html`<p class="help calc-status" role="status">
                  ${this.status}
                </p>`
          }

          <div class="calc-actions">
            ${exporting ? this.renderExportActions(table) : this.renderImportActions()}
          </div>
        </div>
      </dialog>
    `;
  }

  private renderExportActions(table: TableDefinition): TemplateResult {
    return html`
      <button
        class="button"
        type="button"
        data-testid="copy-markdown"
        @click=${this.handleCopy}
      >
        Copy
      </button>
      <button
        class="button"
        type="button"
        data-testid="download-markdown"
        @click=${() => this.handleDownload(table)}
      >
        Download file
      </button>
    `;
  }

  private renderImportActions(): TemplateResult {
    return html`
      <button
        class="button"
        type="button"
        data-testid="import-markdown"
        @click=${this.handleImport}
      >
        Import
      </button>
    `;
  }

  private get dialogElement(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>('dialog.calc-rows-dialog');
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

  private readonly handleInput = (event: Event): void => {
    if (event.target instanceof HTMLTextAreaElement) {
      this.text = event.target.value;
      this.error = '';
    }
  };

  private readonly handleImport = (): void => {
    const result = this.onImport(this.text);
    if (!result.ok) {
      this.error = result.message ?? 'That markdown could not be imported.';
      this.status = '';
      this.requestUpdate();
      return;
    }
    this.error = '';
    this.status = result.message ?? 'Imported.';
    this.requestUpdate();
  };

  private readonly handleCopy = async (): Promise<void> => {
    const clipboard = navigator.clipboard;
    if (clipboard !== undefined && typeof clipboard.writeText === 'function') {
      try {
        await clipboard.writeText(this.text);
        this.status = 'Copied to the clipboard.';
        this.requestUpdate();
        return;
      } catch {
        // Fall through to selecting the text so the user can copy it.
      }
    }
    this.textArea?.select();
    this.status = 'Press Ctrl+C (or ⌘C) to copy the selected text.';
    this.requestUpdate();
  };

  private readonly handleDownload = (table: TableDefinition): void => {
    const blob = new Blob([this.text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableFileName(table.id)}.md`;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.status = `Downloaded ${tableFileName(table.id)}.md.`;
    this.requestUpdate();
  };

  private readonly handleClose = (): void => {
    this.status = '';
    this.error = '';
    this.requestUpdate();
  };

  private get textArea(): HTMLTextAreaElement | null {
    return this.querySelector<HTMLTextAreaElement>('textarea');
  }
}

/** A filesystem-safe file name for a table id. */
export function tableFileName(id: string): string {
  const slug = id.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '');
  return (slug === '' ? 'table' : slug).slice(0, 64);
}

customElements.define('calc-table-rows-dialog', TableRowsDialog);
