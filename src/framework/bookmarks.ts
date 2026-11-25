import { BookmarkStorageError, errorMessage } from './errors.js';
import type { CalculatorSnapshot } from './runtime.js';
import type { CalcState } from './types.js';
import { isUnitSymbol } from './units.js';
import type { UnitSymbol } from './units.js';

export const BOOKMARK_STORAGE_KEY = 'calcurio.bookmarks.v1';
export const MAX_BOOKMARK_NAME_LENGTH = 80;
export const MAX_BOOKMARKS_PER_CALCULATOR = 100;

/** Minimal storage surface, so tests can use an in-memory implementation. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Bookmark {
  readonly id: string;
  readonly name: string;
  readonly savedAt: string;
  readonly state: CalcState;
  readonly units: Record<string, UnitSymbol>;
}

interface StoredIndex {
  readonly version: 1;
  readonly byCalculator: Record<string, Bookmark[]>;
}

/**
 * Persists calculator snapshots in localStorage, indexed by global calculator
 * id. All reads validate the stored JSON; corrupted data raises instead of
 * being silently discarded.
 */
export class BookmarkStore {
  private readonly storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
  }

  list(globalId: string): readonly Bookmark[] {
    const index = this.readIndex();
    const bookmarks = index.byCalculator[globalId] ?? [];
    return bookmarks
      .map(cloneBookmark)
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  }

  save(globalId: string, name: string, snapshot: CalculatorSnapshot): Bookmark {
    const index = this.readIndex();
    const existing = index.byCalculator[globalId] ?? [];
    if (existing.length >= MAX_BOOKMARKS_PER_CALCULATOR) {
      throw new BookmarkStorageError(
        `This calculator already has ${MAX_BOOKMARKS_PER_CALCULATOR} ` +
          'bookmarks. Delete one before saving another.',
      );
    }

    const bookmark: Bookmark = {
      id: createId(),
      name: normalizeName(name),
      savedAt: new Date().toISOString(),
      state: { ...snapshot.state },
      units: { ...snapshot.units },
    };
    const byCalculator: Record<string, Bookmark[]> = {
      ...index.byCalculator,
      [globalId]: [bookmark, ...existing],
    };
    this.writeIndex({ version: 1, byCalculator });
    return cloneBookmark(bookmark);
  }

  delete(globalId: string, bookmarkId: string): void {
    const index = this.readIndex();
    const existing = index.byCalculator[globalId] ?? [];
    if (!existing.some((bookmark) => bookmark.id === bookmarkId)) {
      throw new BookmarkStorageError('That bookmark no longer exists.');
    }

    const remaining = existing.filter((bookmark) => bookmark.id !== bookmarkId);
    const byCalculator: Record<string, Bookmark[]> = {
      ...index.byCalculator,
    };
    if (remaining.length === 0) {
      delete byCalculator[globalId];
    } else {
      byCalculator[globalId] = remaining;
    }
    this.writeIndex({ version: 1, byCalculator });
  }

  private readIndex(): StoredIndex {
    let raw: string | null;
    try {
      raw = this.storage.getItem(BOOKMARK_STORAGE_KEY);
    } catch (error) {
      throw new BookmarkStorageError(
        `Could not read bookmarks: ${errorMessage(error)}`,
        { cause: error },
      );
    }
    if (raw === null || raw === '') {
      return { version: 1, byCalculator: {} };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new BookmarkStorageError(
        'Bookmark data is not valid JSON and was not changed.',
        { cause: error },
      );
    }
    return parseIndex(parsed);
  }

  private writeIndex(index: StoredIndex): void {
    try {
      this.storage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(index));
    } catch (error) {
      throw new BookmarkStorageError(
        `Could not save bookmarks: ${errorMessage(error)}`,
        { cause: error },
      );
    }
  }
}

/** Returns localStorage when the browser allows it, otherwise null. */
export function browserLocalStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function parseIndex(value: unknown): StoredIndex {
  if (!isRecord(value)) {
    throw invalid('Bookmark data must be an object.');
  }
  if (value['version'] !== 1) {
    throw invalid(
      'Bookmark data has an unsupported version and was not changed.',
    );
  }
  const rawByCalculator = value['byCalculator'];
  if (!isRecord(rawByCalculator)) {
    throw invalid('Bookmark data must contain a "byCalculator" object.');
  }

  const byCalculator: Record<string, Bookmark[]> = {};
  for (const [globalId, rawBookmarks] of Object.entries(rawByCalculator)) {
    if (!Array.isArray(rawBookmarks)) {
      throw invalid(`Bookmarks for "${globalId}" must be an array.`);
    }
    byCalculator[globalId] = rawBookmarks.map((rawBookmark, index) =>
      parseBookmark(rawBookmark, globalId, index),
    );
  }
  return { version: 1, byCalculator };
}

function parseBookmark(
  value: unknown,
  globalId: string,
  index: number,
): Bookmark {
  const where = `Bookmark ${index + 1} for "${globalId}"`;
  if (!isRecord(value)) {
    throw invalid(`${where} must be an object.`);
  }

  const id = value['id'];
  const name = value['name'];
  const savedAt = value['savedAt'];
  if (typeof id !== 'string' || id === '') {
    throw invalid(`${where} has no id.`);
  }
  if (typeof name !== 'string') {
    throw invalid(`${where} has no name.`);
  }
  if (typeof savedAt !== 'string' || Number.isNaN(Date.parse(savedAt))) {
    throw invalid(`${where} has no valid saved date.`);
  }

  const rawState = value['state'];
  if (!isRecord(rawState)) {
    throw invalid(`${where} has no state object.`);
  }
  const state: CalcState = {};
  for (const [variable, rawValue] of Object.entries(rawState)) {
    if (rawValue === null) {
      state[variable] = null;
      continue;
    }
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      throw invalid(`${where} has a non-numeric value for "${variable}".`);
    }
    state[variable] = rawValue;
  }

  const rawUnits = value['units'];
  if (!isRecord(rawUnits)) {
    throw invalid(`${where} has no units object.`);
  }
  const units: Record<string, UnitSymbol> = {};
  for (const [variable, rawUnit] of Object.entries(rawUnits)) {
    if (typeof rawUnit !== 'string' || !isUnitSymbol(rawUnit)) {
      throw invalid(`${where} has an unknown unit for "${variable}".`);
    }
    units[variable] = rawUnit;
  }

  return { id, name, savedAt, state, units };
}

function cloneBookmark(bookmark: Bookmark): Bookmark {
  return {
    ...bookmark,
    state: { ...bookmark.state },
    units: { ...bookmark.units },
  };
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  const usable = trimmed === '' ? 'Untitled' : trimmed;
  return usable.slice(0, MAX_BOOKMARK_NAME_LENGTH);
}

function createId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `bookmark-${Date.now().toString(36)}-${random}`;
}

function invalid(message: string): BookmarkStorageError {
  return new BookmarkStorageError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
