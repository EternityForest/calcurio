import type { TableDefinition } from '../../framework/types.js';

/** One currency the converter offers. */
export interface CurrencyInfo {
  readonly code: string;
  readonly name: string;
  readonly kind: 'fiat' | 'gold';
}

/**
 * Currencies priced by gold-api.com, mapped to the identifier its endpoint
 * expects. These are treated as currencies by the converter.
 */
export const GOLD_CURRENCIES: Readonly<Record<string, string>> = {
  XAU: 'gold',
  XAG: 'silver',
  BTC: 'bitcoin',
  ETH: 'ethereum',
};

/** Every currency the converter offers, fiat first then precious metals. */
export const CURRENCIES: readonly CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', kind: 'fiat' },
  { code: 'EUR', name: 'Euro', kind: 'fiat' },
  { code: 'GBP', name: 'British Pound', kind: 'fiat' },
  { code: 'JPY', name: 'Japanese Yen', kind: 'fiat' },
  { code: 'AUD', name: 'Australian Dollar', kind: 'fiat' },
  { code: 'CAD', name: 'Canadian Dollar', kind: 'fiat' },
  { code: 'CHF', name: 'Swiss Franc', kind: 'fiat' },
  { code: 'CNY', name: 'Chinese Yuan', kind: 'fiat' },
  { code: 'HKD', name: 'Hong Kong Dollar', kind: 'fiat' },
  { code: 'NZD', name: 'New Zealand Dollar', kind: 'fiat' },
  { code: 'SEK', name: 'Swedish Krona', kind: 'fiat' },
  { code: 'KRW', name: 'South Korean Won', kind: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', kind: 'fiat' },
  { code: 'NOK', name: 'Norwegian Krone', kind: 'fiat' },
  { code: 'MXN', name: 'Mexican Peso', kind: 'fiat' },
  { code: 'INR', name: 'Indian Rupee', kind: 'fiat' },
  { code: 'BRL', name: 'Brazilian Real', kind: 'fiat' },
  { code: 'ZAR', name: 'South African Rand', kind: 'fiat' },
  { code: 'TRY', name: 'Turkish Lira', kind: 'fiat' },
  { code: 'RUB', name: 'Russian Ruble', kind: 'fiat' },
  { code: 'PLN', name: 'Polish Zloty', kind: 'fiat' },
  { code: 'THB', name: 'Thai Baht', kind: 'fiat' },
  { code: 'IDR', name: 'Indonesian Rupiah', kind: 'fiat' },
  { code: 'HUF', name: 'Hungarian Forint', kind: 'fiat' },
  { code: 'CZK', name: 'Czech Koruna', kind: 'fiat' },
  { code: 'ILS', name: 'Israeli New Shekel', kind: 'fiat' },
  { code: 'CLP', name: 'Chilean Peso', kind: 'fiat' },
  { code: 'PHP', name: 'Philippine Peso', kind: 'fiat' },
  { code: 'AED', name: 'UAE Dirham', kind: 'fiat' },
  { code: 'SAR', name: 'Saudi Riyal', kind: 'fiat' },
  { code: 'MYR', name: 'Malaysian Ringgit', kind: 'fiat' },
  { code: 'DKK', name: 'Danish Krone', kind: 'fiat' },
  { code: 'XAU', name: 'Gold (troy ounce)', kind: 'gold' },
  { code: 'XAG', name: 'Silver (troy ounce)', kind: 'gold' },
  { code: 'BTC', name: 'Bitcoin', kind: 'gold' },
  { code: 'ETH', name: 'Ethereum', kind: 'gold' },
];

/** Table the converter's from/to selects read. */
export const currencyTable: TableDefinition = {
  id: 'currencies',
  title: 'Currencies',
  description: 'Currencies offered by the converter.',
  keyColumn: 'code',
  labelColumn: 'name',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'kind', label: 'Kind' },
  ],
  rows: CURRENCIES.map((currency) => ({ ...currency })),
};
