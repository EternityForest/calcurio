# Calcurio

An embeddable calculator framework plus a static, client-side calculator
site built with it. Everything runs in the browser; there is no server and
no data leaves the device. Bookmarks are stored in `localStorage`.

## Quick start

Requirements: Node 22.12 or newer (or 24+), and npm.

```sh
npm install
npm run dev      # start the Vite dev server
npm run build    # typecheck and build static files into dist/
npm run preview  # serve the production build locally
npm test         # run the Vitest suite
```

If your Node is older than 22.12 (for example 22.1), run the tooling under a
newer interpreter without changing your system install:

```sh
npx -y node@22.13.0 node_modules/typescript/bin/tsc --noEmit
npx -y node@22.13.0 node_modules/vitest/vitest.mjs run
npx -y node@22.13.0 node_modules/vite/bin/vite.js build
```

## How the widget works

The app is a single custom element, `<calc-app>`. It shows a list of
categories; opening one lazily imports that category's module and then lists
its calculators. Each category is emitted by Vite as its own JavaScript chunk,
so a visitor only downloads the calculators they open.

```html
<calc-app></calc-app>
<script type="module">
  import { app } from './app.js';
  document.querySelector('calc-app').app = app;
</script>
```

The widget renders in the light DOM so the global `barrel.css` stylesheet can
style it, and it uses native `<dialog>` for the bookmark popover.

## Project layout

```
src/
  framework/            UI-independent core
    types.ts            CalculatorDefinition, VariableDefinition, CalcState
    units.ts            convert-units wrapper plus a resistance measure
    runtime.ts          state, compute order, refinement, validation
    app.ts              category registry and lazy loading
    bookmarks.ts        localStorage persistence
    testing.ts          calculator test-case harness
    components/         Lit elements (app shell, calculator view, fields, dialog)
  categories/basic/     one lazily loaded category
    ohms-law.ts         calculator definition (pure data)
    index.ts            category module entry
  app.ts                category manifest and app singleton
  main.ts               imports CSS and mounts the widget
```

### Calculators are data

A calculator is a plain object with no DOM knowledge. It lists variables and,
for each, the unit its state is stored in, an optional `computable`
function, and an optional `validate` function. Values are always stored in
the variable's declared unit; display and typed units are converted at the
edges.

```ts
import { missing } from '../../framework/missing.js';
import type { CalculatorDefinition } from '../../framework/types.js';

export const myCalculator: CalculatorDefinition = {
  id: 'my-calculator',
  title: 'My Calculator',
  variables: [
    {
      name: 'power',
      label: 'Power',
      unit: 'W',
      computable: (state) =>
        state.voltage === null || state.current === null
          ? missing([
              ...(state.voltage === null ? ['voltage'] : []),
              ...(state.current === null ? ['current'] : []),
            ])
          : state.voltage * state.current,
    },
    // ...more variables
  ],
};
```

`computable` returns a number, or `missing([...names])` when its inputs are
not available. Returning `missing` clears the value and records which other
variables were needed, which the UI shows as a hint.

### Compute order and refinement

The runtime keeps an ordered list of every computable variable. It computes
them in that order. When a value changes and the variable is an input
(`input !== false`), another pass begins from the top, still excluding the
value the user just changed. If the values have not settled after five
rounds, the UI shows an error.

Changing a value pins it and recomputes the rest. Pressing **Calculate** on a
variable moves it to the front, pins every other populated value, and solves
for the target. This lets the same definition solve for any variable.

### Units

Units come from `convert-units`; Calcurio adds a `resistance` measure
(`Ω`, `mΩ`, `kΩ`, `MΩ`) because the library does not ship one. The unit
selector lists the variable's base unit followed by every unit of the same
kind, or by `unitOptions` when it is provided. Typed values are converted from
the selected display unit into the base unit, and displayed values are
converted back out.

### Adding a category

1. Create `src/categories/<id>/index.ts` exporting `{ calculators }`.
2. Add the definition(s) to that array.
3. Register the lazy import in `src/app.ts`:

```ts
export const CATEGORY_MANIFEST = {
  basic: {
    title: 'Basic',
    description: 'Everyday electrical calculations.',
    load: () => import('./categories/basic/index.js'),
  },
  // ...
} as const satisfies CategoryManifest;
```

You can also register a calculator directly at runtime with
`app.categories.basic.add(definition)`.

### Testing calculator definitions

Give a definition one or more complete `testCases` in base units. The harness
verifies the full state, then for every computable variable removes it,
recomputes, and checks the result within a floating point tolerance. A
definition with failing cases throws a detailed error.

```ts
import { assertCalculatorTests } from '../../framework/testing.js';

assertCalculatorTests(ohmsLaw);
```

Run the suite with `npm test`.

## Bookmarks

The bookmark dialog saves a calculator's values and display units under a key
derived from its global id (`<category>.<calculator>`) inside the
`calcurio.bookmarks.v1` localStorage entry. The dialog supports filtering by
name and deleting saved entries. No bookmark data is sent anywhere.

## Graphs

Every editable numeric field has a **Plot** button. It opens a dialog that
puts that field on the X axis and lets you pick any other computable variable
for the Y axis. The dialog edits the X unit, minimum, maximum, and number of
steps; the range starts at the field's current value plus and minus 100%.

Plotting samples the Y value on an isolated copy of the runtime, so the
calculator's own state is never disturbed. Points are drawn in time-budgeted
batches (about one frame each) and stream into the chart as they are
computed, so a large sweep stays responsive and can be stopped at any time.
Charts use [Chart.js](https://www.chartjs.org/) (MIT), loaded on demand the
first time a plot runs.

## Deploying to GitHub Pages

The build uses a relative `base`, so it works from a project subpath such as
`https://<user>.github.io/calcurio/`.

```sh
npm run deploy   # builds, then pushes dist/ to the gh-pages branch
```

`gh-pages` publishes the compiled static site; it never requires a backend.

## License

MIT.
