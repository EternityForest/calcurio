import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { customToJson } from '../../custom/serialize.js';
import type { CustomDefinition } from '../../custom/types.js';

let nextDialogId = 0;

/**
 * Shows one custom as JSON that can be copied or downloaded, so it can be
 * pasted onto a forum or shared as a file and imported elsewhere. The text is
 * selectable even when the clipboard API is unavailable.
 */
export class CustomExportDialog extends LitElement {
  private custom: CustomDefinition | null = null;
  private text = '';
  private status = '';
  private readonly titleId = `calc-custom-export-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Shows the dialog for one custom. */
  open(custom: CustomDefinition): void {
    this.custom = custom;
    this.text = customToJson(custom);
    this.status = '';
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

  override render(): TemplateResult | typeof nothing {
    const custom = this.custom;
    if (custom === null) {
      return nothing;
    }
    return html`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Export "${custom.title}"</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          <p class="help">
            Copy this JSON, or download it as a file to share with others.
          </p>
          <textarea
            class="form-control calc-custom-json"
            data-testid="export-json"
            readonly
            rows="12"
            spellcheck="false"
            .value=${this.text}
          ></textarea>
          ${
            this.status === ''
              ? nothing
              : html`<p class="help calc-status" role="status">
                  ${this.status}
                </p>`
          }
          <div class="calc-actions">
            <button
              class="button"
              type="button"
              data-testid="copy-json"
              @click=${this.handleCopy}
            >
              Copy
            </button>
            <button
              class="button"
              type="button"
              data-testid="download-json"
              @click=${this.handleDownload}
            >
              Download file
            </button>
          </div>
        </div>
      </dialog>
    `;
  }

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

  private readonly handleDownload = (): void => {
    const custom = this.custom;
    if (custom === null) {
      return;
    }
    const blob = new Blob([this.text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customFileName(custom.id)}.json`;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.status = `Downloaded ${customFileName(custom.id)}.json.`;
    this.requestUpdate();
  };

  private readonly handleClose = (): void => {
    this.status = '';
    this.requestUpdate();
  };

  private get textArea(): HTMLTextAreaElement | null {
    return this.querySelector<HTMLTextAreaElement>('textarea');
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

/** A filesystem-safe file name for a custom id. */
export function customFileName(id: string): string {
  const slug = id.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '');
  return (slug === '' ? 'custom' : slug).slice(0, 64);
}

customElements.define('calc-custom-export', CustomExportDialog);
