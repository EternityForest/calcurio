import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BOOKMARK_STORAGE_KEY,
  BookmarkStore,
  MAX_BOOKMARKS_PER_CALCULATOR,
  MAX_BOOKMARK_NAME_LENGTH,
  browserLocalStorage,
} from './bookmarks.js';
import type { KeyValueStorage } from './bookmarks.js';
import { BookmarkStorageError } from './errors.js';
import type { CalculatorSnapshot } from './runtime.js';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function snapshot(
  state: Record<string, number | null> = { a: 1, b: null },
): CalculatorSnapshot {
  return { state, units: { a: 'V' } };
}

describe('BookmarkStore', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty', () => {
    const store = new BookmarkStore(new MemoryStorage());
    expect(store.list('basic.sample')).toEqual([]);
  });

  it('saves a bookmark and lists it newest first', () => {
    vi.useFakeTimers();
    const store = new BookmarkStore(new MemoryStorage());

    vi.setSystemTime(new Date('2024-01-01T10:00:00.000Z'));
    const first = store.save('basic.sample', 'First', snapshot());
    vi.setSystemTime(new Date('2024-01-02T10:00:00.000Z'));
    const second = store.save('basic.sample', 'Second', snapshot());

    expect(second.savedAt).toBe('2024-01-02T10:00:00.000Z');
    expect(store.list('basic.sample')).toEqual([second, first]);
  });

  it('isolates bookmarks by calculator id', () => {
    const store = new BookmarkStore(new MemoryStorage());
    store.save('basic.sample', 'One', snapshot());
    store.save('basic.other', 'Two', snapshot());

    expect(store.list('basic.sample')).toHaveLength(1);
    expect(store.list('basic.sample')[0]?.name).toBe('One');
    expect(store.list('basic.other')[0]?.name).toBe('Two');
  });

  it('trims names and falls back to "Untitled"', () => {
    const store = new BookmarkStore(new MemoryStorage());
    expect(store.save('basic.sample', '  spaced  ', snapshot()).name).toBe(
      'spaced',
    );
    expect(store.save('basic.sample', '   ', snapshot()).name).toBe('Untitled');
  });

  it('truncates long names', () => {
    const store = new BookmarkStore(new MemoryStorage());
    const name = 'x'.repeat(MAX_BOOKMARK_NAME_LENGTH + 20);
    expect(store.save('basic.sample', name, snapshot()).name).toHaveLength(
      MAX_BOOKMARK_NAME_LENGTH,
    );
  });

  it('stores a detached copy of the snapshot', () => {
    const store = new BookmarkStore(new MemoryStorage());
    const saved = snapshot();
    const bookmark = store.save('basic.sample', 'Copy', saved);
    saved.state['a'] = 99;

    expect(bookmark.state['a']).toBe(1);
    expect(store.list('basic.sample')[0]?.state['a']).toBe(1);
  });

  it('deletes a bookmark', () => {
    const store = new BookmarkStore(new MemoryStorage());
    const bookmark = store.save('basic.sample', 'One', snapshot());
    store.delete('basic.sample', bookmark.id);
    expect(store.list('basic.sample')).toEqual([]);
  });

  it('rejects deleting a missing bookmark', () => {
    const store = new BookmarkStore(new MemoryStorage());
    expect(() => store.delete('basic.sample', 'missing')).toThrow(
      BookmarkStorageError,
    );
  });

  it('enforces the per-calculator limit', () => {
    const store = new BookmarkStore(new MemoryStorage());
    for (let index = 0; index < MAX_BOOKMARKS_PER_CALCULATOR; index += 1) {
      store.save('basic.sample', `Bookmark ${index}`, snapshot());
    }
    expect(() => store.save('basic.sample', 'Too many', snapshot())).toThrow(
      BookmarkStorageError,
    );
  });

  it('rejects invalid JSON without changing storage', () => {
    const storage = new MemoryStorage();
    storage.setItem(BOOKMARK_STORAGE_KEY, 'not json');
    const store = new BookmarkStore(storage);

    expect(() => store.list('basic.sample')).toThrow('not valid JSON');
    expect(storage.getItem(BOOKMARK_STORAGE_KEY)).toBe('not json');
  });

  it('rejects unsupported versions', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      BOOKMARK_STORAGE_KEY,
      JSON.stringify({ version: 2, byCalculator: {} }),
    );
    const store = new BookmarkStore(storage);
    expect(() => store.list('basic.sample')).toThrow('unsupported version');
  });

  it('rejects malformed bookmark data', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      BOOKMARK_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        byCalculator: {
          'basic.sample': [{ id: 'x', name: 'X', savedAt: 'nope' }],
        },
      }),
    );
    const store = new BookmarkStore(storage);
    expect(() => store.list('basic.sample')).toThrow('saved date');
  });

  it('reports storage read failures', () => {
    const storage: KeyValueStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {},
      removeItem: () => {},
    };
    const store = new BookmarkStore(storage);
    expect(() => store.list('basic.sample')).toThrow(
      'Could not read bookmarks: denied',
    );
  });

  it('reports storage write failures', () => {
    const storage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {},
    };
    const store = new BookmarkStore(storage);
    expect(() => store.save('basic.sample', 'One', snapshot())).toThrow(
      'Could not save bookmarks: quota',
    );
  });
});

describe('browserLocalStorage', () => {
  it('returns localStorage when available', () => {
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    expect(browserLocalStorage()).toBe(storage);
    vi.unstubAllGlobals();
  });

  it('returns null when localStorage throws', () => {
    const original = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage',
    );
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
    try {
      expect(browserLocalStorage()).toBeNull();
    } finally {
      if (original === undefined) {
        Reflect.deleteProperty(globalThis, 'localStorage');
      } else {
        Object.defineProperty(globalThis, 'localStorage', original);
      }
    }
  });
});
