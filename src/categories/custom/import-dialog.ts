import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { errorMessage } from '../../framework/errors.js';
import type { CustomDefinition } from '../../custom/types.js';
import type { CustomLibrary } from './library.js';

let nextDialogId = 0;

/**
 * Imports a custom from pasted JSON or a chosen JSON file. Nothing is written
 * until the text parses and the custom passes the same checks a saved one does.
 */
export class CustomImportDialog extends LitElement {
  static override properties = {
    library: { attribute: false },
    onImported: { attribute: false },
  };

  declare library: CustomLibrary | undefined;
  declare onImported: ((custom: CustomDefinition) => void) | undefined;

  private text = '';
  private error = '';
  private readonly titleId = `calc-custom-import-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Opens the modal with an empty form. */
  open(): void {
    this.text = '';
    this.error = '';
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
            <h2 id=${this.titleId}>Import custom</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          <p class="help">
            Paste exported JSON, or choose a .json file saved from another
            custom.
          </p>
          <label class="calc-custom-file">
            <span class="calc-field-label">File</span>
            <input
              class="form-control"
              type="file"
              accept=".json,application/json"
              data-testid="import-file"
              @change=${this.handleFile}
            />
          </label>
          <textarea
            class="form-control calc-custom-json"
            data-testid="import-json"
            rows="10"
            spellcheck="false"
            placeholder='{ "version": 2, "id": "...", "title": "...", ... }'
            .value=${this.text}
            @input=${this.handleText}
          ></textarea>
          ${
            this.error === ''
              ? nothing
              : html`<p class="alert danger" role="alert">${this.error}</p>`
          }
          <div class="calc-actions">
            <button
              class="button"
              type="button"
              data-testid="import-submit"
              ?disabled=${this.text.trim() === ''}
              @click=${() => void this.handleImport()}
            >
              Import
            </button>
          </div>
        </div>
      </dialog>
    `;
  }

  private readonly handleText = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      this.text = target.value;
      this.error = '';
      this.requestUpdate();
    }
  };

  private readonly handleFile = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const file = target.files?.[0];
    if (file === undefined) {
      return;
    }
    void file.text().then(
      (contents) => {
        this.text = contents.trim();
        this.error = '';
        this.requestUpdate();
      },
      (error: unknown) => {
        this.error = `Could not read that file: ${errorMessage(error)}`;
        this.requestUpdate();
      },
    );
  };

  private readonly handleImport = async (): Promise<void> => {
    const library = this.library;
    if (library === undefined) {
      return;
    }
    try {
      const imported = await library.importJson(this.text.trim());
      this.onImported?.(imported);
      this.close();
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
    }
  };

  private readonly handleClose = (): void => {
    this.error = '';
    this.requestUpdate();
  };

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

customElements.define('calc-custom-import', CustomImportDialog);
