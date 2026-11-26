import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { Bookmark, BookmarkStore } from '../bookmarks.js';
import { MAX_BOOKMARK_NAME_LENGTH } from '../bookmarks.js';
import { errorMessage } from '../errors.js';
import type { CalculatorRuntime } from '../runtime.js';

let nextDialogId = 0;

/**
 * Popover dialog for saving, filtering, loading, and deleting snapshots of the
 * current calculator. Destructive deletes require a second click.
 */
export class BookmarksDialog extends LitElement {
  static override properties = {
    runtime: { attribute: false },
    globalId: { attribute: true },
    bookmarks: { attribute: false },
  };

  declare runtime: CalculatorRuntime | undefined;
  declare globalId: string | undefined;
  declare bookmarks: BookmarkStore | null | undefined;

  private filter = '';
  private name = '';
  private status = '';
  private error = '';
  private pendingDeleteId: string | null = null;
  private cached: readonly Bookmark[] = [];
  private readonly titleId = `calc-bookmarks-title-${nextDialogId++}`;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Resets transient state and opens the modal. */
  open(): void {
    this.filter = '';
    this.status = '';
    this.error = '';
    this.pendingDeleteId = null;
    this.name = defaultBookmarkName();
    this.refresh();
    void this.updateComplete.then(() => {
      this.showDialog();
    });
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
    const runtime = this.runtime;
    if (runtime === undefined) {
      return nothing;
    }
    const store = this.bookmarks ?? null;
    const visible = this.visibleBookmarks();

    return html`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Bookmarks</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${
            store === null
              ? html`
                  <p class="alert warning">
                    Bookmarks are not available in this browser.
                  </p>
                `
              : html`
                  <div class="calc-bookmark-save">
                    <label
                      class="calc-field-label"
                      for=${`${this.titleId}-name`}
                    >
                      Save current state
                    </label>
                    <div class="calc-field-input">
                      <input
                        id=${`${this.titleId}-name`}
                        class="form-control calc-bookmark-name"
                        type="text"
                        autocomplete="off"
                        maxlength=${MAX_BOOKMARK_NAME_LENGTH}
                        .value=${this.name}
                        @input=${this.handleNameInput}
                      />
                      <button
                        class="button"
                        type="button"
                        data-testid="save-bookmark"
                        ?disabled=${!this.canSave(runtime)}
                        @click=${this.handleSave}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                `
          }

          <label class="calc-bookmark-filter">
            <span class="calc-field-label">Filter</span>
            <input
              class="form-control"
              type="search"
              autocomplete="off"
              placeholder="Filter by name"
              .value=${this.filter}
              @input=${this.handleFilterInput}
            />
          </label>

          ${
            this.status === ''
              ? nothing
              : html`<p class="help calc-status" role="status">
                  ${this.status}
                </p>`
          }
          ${
            this.error === ''
              ? nothing
              : html`<p class="alert danger" role="alert">${this.error}</p>`
          }

          <ul class="calc-bookmark-list">
            ${visible.map((bookmark) => this.renderBookmark(bookmark))}
          </ul>
          ${
            visible.length === 0
              ? html`<p class="help">
                  ${
                    this.cached.length === 0
                      ? 'No saved states yet.'
                      : 'No bookmarks match this filter.'
                  }
                </p>`
              : nothing
          }
        </div>
      </dialog>
    `;
  }

  private renderBookmark(bookmark: Bookmark): TemplateResult {
    const pending = this.pendingDeleteId === bookmark.id;
    return html`
      <li class="calc-bookmark" data-testid=${`bookmark-${bookmark.id}`}>
        <div class="calc-bookmark-text">
          <strong>${bookmark.name}</strong>
          <span class="help">${formatSavedAt(bookmark.savedAt)}</span>
        </div>
        <button
          class="button"
          type="button"
          data-testid=${`load-bookmark-${bookmark.id}`}
          @click=${() => this.handleLoad(bookmark)}
        >
          Load
        </button>
        <button
          class="button danger"
          type="button"
          data-testid=${`delete-bookmark-${bookmark.id}`}
          @click=${() => this.handleDelete(bookmark)}
        >
          ${pending ? 'Confirm delete' : 'Delete'}
        </button>
      </li>
    `;
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

  private canSave(runtime: CalculatorRuntime): boolean {
    return Object.values(runtime.state).some((value) => value !== null);
  }

  private refresh(): void {
    const store = this.bookmarks ?? null;
    const globalId = this.globalId ?? '';
    if (store === null) {
      this.cached = [];
      this.requestUpdate();
      return;
    }
    try {
      this.cached = store.list(globalId);
    } catch (error) {
      this.cached = [];
      this.error = errorMessage(error);
    }
    this.requestUpdate();
  }

  private visibleBookmarks(): readonly Bookmark[] {
    const needle = this.filter.trim().toLowerCase();
    if (needle === '') {
      return this.cached;
    }
    return this.cached.filter((bookmark) =>
      bookmark.name.toLowerCase().includes(needle),
    );
  }

  private readonly handleNameInput = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.name = target.value;
    }
  };

  private readonly handleFilterInput = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.filter = target.value;
      this.requestUpdate();
    }
  };

  private readonly handleSave = (): void => {
    const store = this.bookmarks ?? null;
    const runtime = this.runtime;
    if (store === null || runtime === undefined) {
      return;
    }
    try {
      const bookmark = store.save(
        this.globalId ?? '',
        this.name,
        runtime.snapshot(),
      );
      this.status = `Saved "${bookmark.name}".`;
      this.error = '';
      this.name = defaultBookmarkName();
      this.refresh();
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
    }
  };

  private readonly handleLoad = (bookmark: Bookmark): void => {
    const runtime = this.runtime;
    if (runtime === undefined) {
      return;
    }
    try {
      runtime.loadState(bookmark.state, bookmark.units, {
        includeDerived: false,
      });
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
      return;
    }
    this.dispatchEvent(
      new CustomEvent<string>('bookmark-loaded', {
        detail: bookmark.name,
        bubbles: true,
        composed: true,
      }),
    );
    this.close();
  };

  private readonly handleDelete = (bookmark: Bookmark): void => {
    if (this.pendingDeleteId !== bookmark.id) {
      this.pendingDeleteId = bookmark.id;
      this.status = 'Press "Confirm delete" to remove this bookmark.';
      this.requestUpdate();
      return;
    }

    const store = this.bookmarks ?? null;
    if (store === null) {
      return;
    }
    try {
      store.delete(this.globalId ?? '', bookmark.id);
      this.pendingDeleteId = null;
      this.status = `Deleted "${bookmark.name}".`;
      this.error = '';
      this.refresh();
    } catch (error) {
      this.error = errorMessage(error);
      this.requestUpdate();
    }
  };

  private readonly handleClose = (): void => {
    this.pendingDeleteId = null;
    this.status = '';
    this.requestUpdate();
  };
}

function defaultBookmarkName(): string {
  const now = new Date();
  return `Calculation ${formatSavedAt(now.toISOString())}`;
}

function formatSavedAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

customElements.define('calc-bookmarks-dialog', BookmarksDialog);
