import { CURRENCIES, GOLD_CURRENCIES } from './currencies.js';

/** localStorage key holding the per-pair rate cache. */
export const CACHE_KEY = 'calcurio.finance.rates.v1';

/** How long a cached pair stays fresh. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FIAT_API = 'https://open.er-api.com/v6/latest';
const GOLD_API = 'https://api.gold-api.com/price';

/** Every currency code the converter knows about. */
export const CURRENCY_CODES: readonly string[] = CURRENCIES.map(
  (currency) => currency.code,
);

interface RateRow {
  readonly rate: number;
  readonly fetchedAt: number;
}

type RateCache = Record<string, RateRow>;

function pairKey(from: string, to: string): string {
  return `${from}->${to}`;
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readCache(): RateCache {
  const store = storage();
  if (store === null) {
    return {};
  }
  try {
    const raw = store.getItem(CACHE_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const cache: RateCache = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'object' || value === null) {
        continue;
      }
      const row = value as Partial<RateRow>;
      if (
        typeof row.rate === 'number' &&
        Number.isFinite(row.rate) &&
        row.rate > 0 &&
        typeof row.fetchedAt === 'number' &&
        Number.isFinite(row.fetchedAt)
      ) {
        cache[key] = { rate: row.rate, fetchedAt: row.fetchedAt };
      }
    }
    return cache;
  } catch {
    return {};
  }
}

function writeCache(cache: RateCache): void {
  const store = storage();
  if (store === null) {
    return;
  }
  try {
    store.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full or unavailable store only costs a refetch next time.
  }
}

function cachedRate(cache: RateCache, from: string, to: string): number | null {
  const row = cache[pairKey(from, to)];
  if (row === undefined) {
    return null;
  }
  if (Date.now() - row.fetchedAt >= CACHE_TTL_MS) {
    return null;
  }
  return row.rate;
}

function storeRate(
  cache: RateCache,
  from: string,
  to: string,
  rate: number,
): void {
  if (!Number.isFinite(rate) || rate <= 0) {
    return;
  }
  cache[pairKey(from, to)] = { rate, fetchedAt: Date.now() };
}

function isGold(currency: string): boolean {
  return GOLD_CURRENCIES[currency] !== undefined;
}

async function fetchFiatRates(base: string): Promise<Record<string, number>> {
  const response = await fetch(`${FIAT_API}/${encodeURIComponent(base)}`);
  if (!response.ok) {
    throw new Error(`Exchange rate request failed (${response.status}).`);
  }
  const data: unknown = await response.json();
  if (typeof data !== 'object' || data === null) {
    throw new Error('Exchange rate response was not an object.');
  }
  const record = data as { result?: unknown; rates?: unknown };
  if (record.result !== 'success') {
    throw new Error('Exchange rate response was not successful.');
  }
  if (typeof record.rates !== 'object' || record.rates === null) {
    throw new Error('Exchange rate response did not include rates.');
  }
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(record.rates)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }
  return rates;
}

async function fetchGoldPrice(currency: string): Promise<number> {
  const id = GOLD_CURRENCIES[currency];
  if (id === undefined) {
    throw new Error(`Unknown gold currency ${currency}.`);
  }
  const response = await fetch(`${GOLD_API}/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Gold price request failed (${response.status}).`);
  }
  const data: unknown = await response.json();
  if (typeof data !== 'object' || data === null) {
    throw new Error('Gold price response was not an object.');
  }
  const record = data as { price?: unknown };
  const price =
    typeof record.price === 'number' ? record.price : Number(record.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Gold price response did not contain a usable price.');
  }
  return price;
}

async function populateFiatPairs(
  cache: RateCache,
  base: string,
  rates: Record<string, number>,
): Promise<void> {
  for (const [currency, rate] of Object.entries(rates)) {
    if (currency === base) {
      continue;
    }
    storeRate(cache, base, currency, rate);
    storeRate(cache, currency, base, 1 / rate);
  }
  const codes = Object.keys(rates).filter((code) => {
    const rate = rates[code];
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
  });
  for (const from of codes) {
    for (const to of codes) {
      if (from === to) {
        continue;
      }
      const fromRate = rates[from]!;
      const toRate = rates[to]!;
      storeRate(cache, from, to, toRate / fromRate);
    }
  }
}

async function resolveFiatRate(
  cache: RateCache,
  from: string,
  to: string,
): Promise<number> {
  const rates = await fetchFiatRates(from);
  await populateFiatPairs(cache, from, rates);
  const rate = rates[to];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`No exchange rate from ${from} to ${to}.`);
  }
  return rate;
}

async function populateGoldPairs(
  cache: RateCache,
  gold: string,
  goldUsd: number,
): Promise<void> {
  for (const currency of CURRENCY_CODES) {
    if (currency === gold || currency === 'USD') {
      continue;
    }
    try {
      const usdTo = await convertWithCache(cache, 'USD', currency, 1);
      const rate = goldUsd * usdTo;
      storeRate(cache, gold, currency, rate);
      storeRate(cache, currency, gold, 1 / rate);
    } catch {
      // Currencies the API cannot price are skipped; others still populate.
    }
  }
}

async function resolveGoldRate(
  cache: RateCache,
  from: string,
  to: string,
): Promise<number> {
  const fromGold = isGold(from);
  const toGold = isGold(to);
  const fromUsd = fromGold ? await fetchGoldPrice(from) : null;
  const toUsd = toGold ? await fetchGoldPrice(to) : null;

  if (fromUsd !== null) {
    storeRate(cache, from, 'USD', fromUsd);
    storeRate(cache, 'USD', from, 1 / fromUsd);
  }
  if (toUsd !== null) {
    storeRate(cache, to, 'USD', toUsd);
    storeRate(cache, 'USD', to, 1 / toUsd);
  }

  if (fromUsd !== null) {
    await populateGoldPairs(cache, from, fromUsd);
  }
  if (toUsd !== null) {
    await populateGoldPairs(cache, to, toUsd);
  }

  let rate: number;
  if (fromUsd !== null && toUsd !== null) {
    rate = fromUsd / toUsd;
  } else if (fromUsd !== null) {
    const usdTo = await convertWithCache(cache, 'USD', to, 1);
    rate = fromUsd * usdTo;
  } else if (toUsd !== null) {
    const usdFrom = await convertWithCache(cache, 'USD', from, 1);
    rate = 1 / (usdFrom * toUsd);
  } else {
    throw new Error('No gold currency in the pair.');
  }
  storeRate(cache, from, to, rate);
  storeRate(cache, to, from, 1 / rate);
  return rate;
}

async function convertWithCache(
  cache: RateCache,
  from: string,
  to: string,
  amount: number,
): Promise<number> {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) {
    return amount;
  }
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number.');
  }

  const direct = cachedRate(cache, source, target);
  if (direct !== null) {
    return amount * direct;
  }
  const inverse = cachedRate(cache, target, source);
  if (inverse !== null) {
    return amount / inverse;
  }

  const rate =
    isGold(source) || isGold(target)
      ? await resolveGoldRate(cache, source, target)
      : await resolveFiatRate(cache, source, target);
  return amount * rate;
}

/**
 * Converts an amount between currencies. Rates are cached per pair for 24
 * hours in localStorage. Gold, silver, Bitcoin, and Ethereum are priced by
 * gold-api.com and treated as currencies; everything else uses the free
 * ExchangeRate-API endpoint. Each request fills in as many pairs as it can
 * derive, so later conversions often need no network.
 */
export async function convert(
  from: string,
  to: string,
  amount: number,
): Promise<number> {
  const cache = readCache();
  try {
    return await convertWithCache(cache, from, to, amount);
  } finally {
    writeCache(cache);
  }
}
