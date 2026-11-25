import { html, LitElement, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { formatNumber } from '../format.js';
import { isBooleanColumn, isNumericColumn } from '../tables.js';
import type { TableCell, TableColumn, TableDefinition } from '../types.js';

/**
 * Read-only view of one data table. Column headers show the storage unit so
 * values are never ambiguous.
 */
export class TableView extends LitElement {
  static override properties = {
    table: { attribute: false },
  };

  declare table: TableDefinition | undefined;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override render(): TemplateResult | typeof nothing {
    const table = this.table;
    if (table === undefined) {
      return nothing;
    }

    return html`
      <div class="calc-table">
        <h2 class="calc-calculator-title">${table.title}</h2>
        ${
          table.description === undefined
            ? nothing
            : html`<p class="help">${table.description}</p>`
        }
        <div class="calc-table-scroll">
          <table class="calc-table-grid">
            <thead>
              <tr>
                ${table.columns.map(
                  (column) => html`
                    <th scope="col">${column.label}${renderUnit(column)}</th>
                  `,
                )}
              </tr>
            </thead>
            <tbody>
              ${table.rows.map(
                (row) => html`
                  <tr>
                    ${table.columns.map(
                      (column) => html`
                        <td>${renderCell(column, row[column.key])}</td>
                      `,
                    )}
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
        <p class="help">${table.rows.length} rows</p>
      </div>
    `;
  }
}

function renderUnit(column: TableColumn): TemplateResult | typeof nothing {
  if (column.unit === undefined) {
    return nothing;
  }
  return html`<span class="calc-table-unit"> (${column.unit})</span>`;
}

function renderCell(
  column: TableColumn,
  cell: TableCell | undefined,
): string | TemplateResult {
  if (cell === null || cell === undefined) {
    return '—';
  }
  if (isBooleanColumn(column) && typeof cell === 'boolean') {
    return cell ? 'yes' : 'no';
  }
  if (isNumericColumn(column) && typeof cell === 'number') {
    return formatNumber(cell);
  }
  return String(cell);
}

customElements.define('calc-table-view', TableView);
