import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_KEY, CACHE_TTL_MS, convert } from './exchange.js';

interface FakeStorage {
  readonly store: Map<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

function createStorage(): FakeStorage {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

const FIAT_RATES = {
  result: 'success',
  rates: {
    USD: 1,
    EUR: 0.9,
    GBP: 0.8,
    JPY: 150,
  },
};

const GOLD_PRICE = { price: 2000 };

describe('exchange', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = createStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('converts fiat currencies and caches every pair', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('open.er-api.com')) {
        return jsonResponse(FIAT_RATES);
      }
      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await convert('USD', 'EUR', 100);
    expect(result).toBeCloseTo(90, 9);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const cache = JSON.parse(storage.getItem(CACHE_KEY) ?? '{}') as Record<
      string,
      { rate: number; fetchedAt: number }
    >;
    expect(cache['USD->EUR']?.rate).toBeCloseTo(0.9, 9);
    expect(cache['EUR->USD']?.rate).toBeCloseTo(1 / 0.9, 9);
    expect(cache['EUR->GBP']?.rate).toBeCloseTo(0.8 / 0.9, 9);
    expect(cache['GBP->JPY']?.rate).toBeCloseTo(150 / 0.8, 9);
  });

  it('uses the cache for a second conversion', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(FIAT_RATES));
    vi.stubGlobal('fetch', fetchMock);

    await convert('USD', 'EUR', 100);
    const second = await convert('USD', 'EUR', 100);
    expect(second).toBeCloseTo(90, 9);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('converts a gold currency to fiat and fills cross pairs', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('api.gold-api.com')) {
        return jsonResponse(GOLD_PRICE);
      }
      if (url.includes('open.er-api.com')) {
        return jsonResponse(FIAT_RATES);
      }
      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await convert('XAU', 'USD', 1);
    expect(result).toBeCloseTo(2000, 9);

    const cache = JSON.parse(storage.getItem(CACHE_KEY) ?? '{}') as Record<
      string,
      { rate: number; fetchedAt: number }
    >;
    expect(cache['XAU->USD']?.rate).toBeCloseTo(2000, 9);
    expect(cache['XAU->EUR']?.rate).toBeCloseTo(1800, 9);
    expect(cache['XAU->GBP']?.rate).toBeCloseTo(1600, 9);
    expect(cache['EUR->XAU']?.rate).toBeCloseTo(1 / 1800, 9);
  });

  it('refetches a rate once the cache row expires', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(FIAT_RATES));
    vi.stubGlobal('fetch', fetchMock);

    await convert('USD', 'EUR', 100);
    const stale = Date.now() + CACHE_TTL_MS + 1;
    vi.spyOn(Date, 'now').mockReturnValue(stale);

    await convert('USD', 'EUR', 100);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns the amount unchanged for identical currencies', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(convert('USD', 'USD', 42)).resolves.toBe(42);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
