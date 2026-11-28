import { errorMessage } from '../../framework/errors.js';
import { unchanged } from '../../framework/unchanged.js';
import type { CalculatorDefinition } from '../../framework/types.js';
import { convert } from './exchange.js';

export const currencyConverter: CalculatorDefinition = {
  id: 'currency-converter',
  title: 'Currency converter',
  description:
    'Convert an amount between currencies using live exchange rates. ' +
    'Gold, silver, Bitcoin, and Ethereum are priced as currencies too.' +
    'Updates every 24 hours, so accuracy might not be equal to true live converters.',
  headerHtml:
    '<a href="https://www.exchangerate-api.com">Rates By Exchange Rate API</a> · ' +
    '<a href="https://gold-api.com">Gold API</a>',
  autoComputeState: true,
  variables: [
    {
      name: 'amount',
      label: 'Amount',
      unit: '1',
      unitOptions: ['1'],
      default: 1,
      description: 'Amount to convert.',
    },
    {
      name: 'from',
      label: 'From',
      table: 'currencies',
      default: 'USD',
      description: 'Currency to convert from.',
    },
    {
      name: 'to',
      label: 'To',
      table: 'currencies',
      default: 'EUR',
      description: 'Currency to convert to.',
    },
    {
      name: 'result',
      label: 'Result',
      unit: '1',
      unitOptions: ['1'],
      editable: false,
      description: 'Converted amount.',
      computable: () => unchanged(),
    },
  ],
  computeState: async (state, context) => {
    const amount = state.amount;
    const from = state.from;
    const to = state.to;
    if (
      typeof amount !== 'number' ||
      typeof from !== 'string' ||
      typeof to !== 'string'
    ) {
      return { ...state, result: null };
    }
    try {
      const result = await convert(from, to, amount);
      return { ...state, result };
    } catch (error) {
      context.display(`Could not convert: ${errorMessage(error)}`);
      return { ...state, result: null };
    }
  },
};
