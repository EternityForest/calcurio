import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { ConfigFieldDefinition, ConfigValue } from '../types.js';

/**
 * Renders one settings control and calls `onChange` with a freshly parsed
 * value. Shared by the calculator view and the custom builder so settings look
 * and behave the same wherever they appear. Relative fields (a number with a
 * min/max, a select with a fixed option list) keep their widget; an empty or
 * unparsable number is ignored rather than committed.
 */
export function configControl(
  field: ConfigFieldDefinition,
  value: ConfigValue | undefined,
  onChange: (value: ConfigValue) => void,
): TemplateResult {
  const testId = `config-${field.name}`;
  switch (field.kind) {
    case 'boolean':
      return html`
        <input
          type="checkbox"
          data-testid=${testId}
          ?checked=${value === true}
          @change=${(event: Event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
              onChange(target.checked);
            }
          }}
        />
      `;
    case 'select':
      return html`
        <select
          class="form-control"
          data-testid=${testId}
          @change=${(event: Event) => {
            const target = event.target;
            if (target instanceof HTMLSelectElement) {
              onChange(target.value.trim());
            }
          }}
        >
          ${(field.options ?? []).map(
            (option) => html`
              <option value=${option} ?selected=${option === value}>
                ${option}
              </option>
            `,
          )}
        </select>
      `;
    case 'string':
      return html`
        <input
          class="form-control"
          type="text"
          data-testid=${testId}
          .value=${String(value ?? '')}
          @change=${(event: Event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
              onChange(target.value.trim());
            }
          }}
        />
      `;
    case 'number':
      return html`
        <input
          class="form-control"
          type="number"
          data-testid=${testId}
          .value=${String(value ?? '')}
          min=${field.min === undefined ? nothing : String(field.min)}
          max=${field.max === undefined ? nothing : String(field.max)}
          step="any"
          @change=${(event: Event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) {
              return;
            }
            const parsed = Number(target.value);
            if (Number.isFinite(parsed)) {
              onChange(parsed);
            }
          }}
        />
      `;
  }
}
