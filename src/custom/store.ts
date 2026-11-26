import type { KeyValueStorage } from '../framework/bookmarks.js';
import { CustomStorageError, errorMessage } from '../framework/errors.js';
import { customFromJson, parseCustom } from './serialize.js';
import type { CustomDefinition } from './types.js';

/** localStorage key holding every saved custom. */
export const CUSTOM_STORAGE_KEY = 'calcurio.customs.v2';
/** Most customs a single browser profile may keep. */
export const MAX_CUSTOMS = 200;
/** Longest title kept from a saved or imported custom. */
export const MAX_CUSTOM_TITLE_LENGTH = 80;

interface StoredCustoms {
  readonly version: 2;
  readonly customs: CustomDefinition[];
}

/**
 * Persists user-built customs in localStorage as a single validated JSON
 * document. Every read re-parses the stored text, so corrupted data raises
 * instead of being silently discarded, mirroring `BookmarkStore`.
 */
export class CustomStore {
  private readonly storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
  }

  /** All saved customs, oldest first. */
  list(): readonly CustomDefinition[] {
    return this.readIndex().customs;
  }

  get(id: string): CustomDefinition | undefined {
    return this.list().find((custom) => custom.id === id);
  }

  has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  /**
   * Inserts or replaces a custom by its id, keeping the stored order. Replacing
   * never grows the count, so it is allowed even at the limit.
   */
  save(custom: CustomDefinition): CustomDefinition {
    const parsed = normalizeCustom(parseCustom(custom));
    const index = this.readIndex();
    const existing = index.customs.findIndex((entry) => entry.id === parsed.id);
    if (existing === -1 && index.customs.length >= MAX_CUSTOMS) {
      throw new CustomStorageError(
        `You already have ${MAX_CUSTOMS} customs. Delete one before saving ` +
          'another.',
      );
    }

    const customs = [...index.customs];
    if (existing === -1) {
      customs.push(parsed);
    } else {
      customs[existing] = parsed;
    }
    this.writeIndex({ version: 2, customs });
    return parsed;
  }

  delete(id: string): void {
    const index = this.readIndex();
    if (!index.customs.some((custom) => custom.id === id)) {
      throw new CustomStorageError('That custom no longer exists.');
    }
    const customs = index.customs.filter((custom) => custom.id !== id);
    this.writeIndex({ version: 2, customs });
  }

  /**
   * Adds an imported custom as a new entry. Its id is made unique so two
   * customs never fight over the same calculator id.
   */
  importCustom(custom: CustomDefinition): CustomDefinition {
    const parsed = normalizeCustom(parseCustom(custom));
    const index = this.readIndex();
    if (index.customs.length >= MAX_CUSTOMS) {
      throw new CustomStorageError(
        `You already have ${MAX_CUSTOMS} customs. Delete one before importing.`,
      );
    }
    const taken = new Set(index.customs.map((entry) => entry.id));
    const unique: CustomDefinition = {
      ...parsed,
      id: uniqueId(parsed.id, taken),
    };
    this.writeIndex({
      version: 2,
      customs: [...index.customs, unique],
    });
    return unique;
  }

  /** Parses exported JSON text and imports the custom it holds. */
  importJson(text: string): CustomDefinition {
    return this.importCustom(customFromJson(text));
  }

  private readIndex(): StoredCustoms {
    let raw: string | null;
    try {
      raw = this.storage.getItem(CUSTOM_STORAGE_KEY);
    } catch (error) {
      throw new CustomStorageError(
        `Could not read customs: ${errorMessage(error)}`,
        { cause: error },
      );
    }
    if (raw === null || raw === '') {
      return { version: 2, customs: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new CustomStorageError(
        'Custom data is not valid JSON and was not changed.',
        { cause: error },
      );
    }
    return parseIndex(parsed);
  }

  private writeIndex(index: StoredCustoms): void {
    try {
      this.storage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(index));
    } catch (error) {
      throw new CustomStorageError(
        `Could not save customs: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  }
}

function parseIndex(value: unknown): StoredCustoms {
  if (!isRecord(value)) {
    throw new CustomStorageError('Custom data must be an object.');
  }
  if (value['version'] !== 2) {
    throw new CustomStorageError(
      'Custom data has an unsupported version and was not changed.',
    );
  }
  const rawCustoms = value['customs'];
  if (!Array.isArray(rawCustoms)) {
    throw new CustomStorageError('Custom data must contain a "customs" array.');
  }
  const customs = rawCustoms.map((raw, position) => {
    try {
      return parseCustom(raw);
    } catch (error) {
      throw new CustomStorageError(
        `Saved custom ${position + 1} is invalid: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  });
  return { version: 2, customs };
}

/** Trims the title and applies the length limit. */
function normalizeCustom(custom: CustomDefinition): CustomDefinition {
  const trimmed = custom.title.trim();
  const title = (trimmed === '' ? 'Untitled' : trimmed).slice(
    0,
    MAX_CUSTOM_TITLE_LENGTH,
  );
  if (title === custom.title) {
    return custom;
  }
  return { ...custom, title };
}

/** Adds a numeric suffix until the id is unused. */
function uniqueId(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) {
    return base;
  }
  for (let suffix = 2; suffix <= taken.size + 1; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  throw new CustomStorageError(`Could not find a free id for "${base}".`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
