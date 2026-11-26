# Calcurio

![AI generated image of a man looking at a clockwork mechanical computer](calcurio.avif)

An embeddable calculator framework plus a static, client-side calculator
site built with it. Everything runs in the browser; there is no server and
no data leaves the device(Except a few features, like currency conversion). Bookmarks are stored in `localStorage`.

USE AT YOUR OWN RISK: No guarantee of accuracy! Some models, like capacitor bias, almost certainly need improvement.

Use the app here: https://eternityforest.github.io/calcurio/

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

A recompute runs in three phases. First every table select and its columns are
refreshed from the values already present: a select only moves when exactly one
row matches its populated columns, so a partial or ambiguous set leaves it
alone. Then equivalent variables fill one another (see below). Only then are
the `computable` variables solved, in definition order. When one of them
changes and it is an input (`input !== false`), another pass begins from the
top, still excluding the value the user just changed. If the values have not
settled after five rounds, the UI shows an error. The table lookup and
equivalent phases are settled once and never take part in those rounds.

Changing a value pins it and recomputes the rest. Pressing **Calculate** on a
variable moves it to the front, pins every other populated value, and solves
for the target. This lets the same definition solve for any variable.

### Equivalent variables

Some table-bound values describe the same quantity in several forms. The wire
resistance calculator stores cross-section, diameter, and radius as columns of
the wire-gauge table, but a value typed into any one of them should fill the
others even when no gauge row matches. An `equivalent` map records that: each
key names another variable and each value converts this variable's value into
it.

```ts
{
  name: 'diameter',
  label: 'Diameter',
  unit: 'mm',
  tableSelect: 'gauge',
  tableField: 'diameter',
  equivalent: {
    area: (diameter) => Math.PI * (diameter / 2) ** 2,
    radius: (diameter) => diameter / 2,
  },
},
```

Declare every link in both directions (`diameter` names `area` and `area` names
`diameter`); the runtime treats the entries as one group of variables that are
different spellings of the same value. When a table lookup leaves a group with
exactly one populated member, the runtime converts it into every other member
that is not pinned. Two or more populated members make the group ambiguous and
it is left untouched. Because the conversions are a one-shot reflection rather
than a formula solved from the state, they are applied before the refinement
rounds and never drive them.

A `computable` variable already derives its value from a formula, so it must
not also declare `equivalent` variables.

### State-level calculators

Some calculators do not derive one variable from the others; they take the
whole state, run an expensive or all-or-nothing computation, and produce
every output at once. `computeState` supports this:

```ts
const definition: CalculatorDefinition = {
  // ...
  variables: [
    // ...inputs...
    {
      name: 'peakVoltage',
      label: 'Peak voltage',
      unit: 'V',
      editable: false,
      // Every computable must return `unchanged()`: the real value comes
      // from `computeState` below, never from the incremental solver.
      computable: () => unchanged(),
    },
  ],
  async computeState(state, context) {
    const result = await runSimulation(stateCopy, context.signal);
    context.display(chartElement, () => chartElement.remove());
    return { ...state, peakVoltage: result.peak };
  },
};
```

When `computeState` is set, the runtime stops recomputing on every change:
the definition no longer drives updates, and every `computable` variable must
return `unchanged()` so the editor knows the value is produced elsewhere. A
**Run** button (with a **Cancel** action while it is running) triggers the
computation, passing it a copy of the state, not the live one.

`computeState` is asynchronous and receives an `AbortSignal` in `context`.
Cancelling, or starting a new run, aborts the signal so work in flight can
stop. The `context.display(content, dispose?)` hook shows arbitrary output
(the SPICE category draws a Chart.js graph this way) below the fields; each
item is tied to one run, is removed before the next one begins, and its
optional `dispose` runs at that point.

### Units

Units come from `convert-units`; Calcurio adds the measures the library
does not ship: `resistance` (`Ω`, `mΩ`, `kΩ`, `MΩ`), `resistivity`,
`inductance` (`H`, `mH`, `µH`, `nH`), `capacitance` (`F`, `mF`, `µF`, `nF`,
`pF`), `temperature` (`°C`, `K`, `°F`, `°R`), `density` (`kg/m3`, `g/cm3`,
…), `specificHeat`, `thermalConductivity`, `dynamicViscosity`,
`thermalExpansion`, a dimensionless `ratio` (`1`, `%`), and a `decibel`
measure (`dB`). The decibel has a single unit, so it only labels a value that
is already logarithmic — a path loss or an antenna gain — and never converts
against anything. The temperature
measure spells the degrees out (`°C` rather than the library's bare `C`) and
leaves `F` to the farad. The unit selector lists the variable's base unit
followed by every unit of the same kind, or by `unitOptions` when it is
provided. Typed values are converted from the selected display unit into the
base unit, and displayed values are converted back out. A variable may set
`defaultDisplayUnit` to open in a different unit of the same kind; the state
is still stored in `unit`, so the capacitors store farads but start in
microfarads.


### Custom calculators

The **Custom** category lets a user build multistep calculations without
writing code. Its hub lists every saved custom and offers the creator and an
importer. A custom is an ordered list of _steps_, each an instance of any
catalog calculator — or a standalone numeric or text output — with its own
settings and starting values. A step field may **take from** one field of an
earlier step, and its value may feed any number of later fields; the editor
shows a wired field with the `highlight` style and names where it came from. A
field with a source is read-only, wires must join matching units (or the same
table), and each step can be marked hidden so it stays out of the running view.

A custom compiles to an ordinary `CalculatorDefinition`: each step contributes
its variables under a namespaced name and every wire becomes a `takeFrom` link,
which the runtime already refines to a fixed point. Solving a custom therefore
reuses the same compute-order and convergence machinery as a built-in
calculator. Because the variable list of a step comes from its config, a
custom's shape depends only on that config, never on the values themselves.

Customs live in the `calcurio.customs.v1` localStorage entry. They can be
exported as JSON to copy or download and re-imported from pasted text or a
file, so a custom can be shared on a forum and pasted back in. The model
(types, catalog, validation, compile, serialization, storage) is in
`src/custom`; the builder UI is in `src/categories/custom`.

### Adding a category

1. Create `src/categories/<id>/index.ts` exporting `{ calculators }` (and,
   optionally, `tables`).
2. Add the definition(s) to that array.
3. Register the lazy import in `src/app.ts`:

```ts
export const CATEGORY_MANIFEST = {
  electrical: {
    title: 'Electrical',
    description: 'Everyday electrical calculations.',
    load: () => import('./categories/electrical/index.js'),
  },
  // ...
} as const satisfies CategoryManifest;
```

A category whose calculators are created by the user at runtime sets `hub` to
the tag name of an element the category module defines (the Custom category
uses `calc-custom-hub`). The app renders that element in place of the tile list
and binds its `handle`, `openCalculator`, and `onChanged` properties.

You can also register a calculator directly at runtime with
`app.categories.electrical.add(definition)`.

Tables a category exports are registered with it under their `id` and become
reference data for its calculators: a variable with a `table` field becomes a
dropdown over that table's rows. Categories that need the same data export
the same table (the Electrical and SPICE categories both ship the inductor and
capacitor model tables), so a shared model only needs defining once.

A table can also be registered as a `TableProvider` — an object with an `id`
and a `build()` method. The registry builds and validates the table the first
time something requests it, then caches the result, so large or generated
tables cost nothing until they are used. The Electrical category's E-series
resistor and capacitor tables are built this way: `e-series.ts` emits every
E24 value across whole decades, each labelled with the smallest series the
value belongs to, so 1.5 kΩ reads "1.5k(E6)" and 5.1 kΩ reads "5.1k(E24)".

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

A `computeState` definition runs its `testCases` through the full-state check
only; the per-variable solve passes are skipped because those values are
produced by `computeState`, not the incremental solver.

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


## Installing as an app (PWA)

Calcurio is an installable progressive web app. It leans on the browser's own
install UI — no in-page "Add to home screen" prompt — via a few standard
pieces:

- `public/manifest.webmanifest` gives the app its name, colours, and 192/512
  `any` icons plus a 512 `maskable` icon, with all paths relative to the
  deployment (`start_url` and `scope` are `./`, so a GitHub Pages sub-path
  works unchanged). `index.html` links the manifest and adds `theme-color`
  and the Apple touch-icon/meta tags.
- `public/sw.js` is a hand-written service worker. It is deliberately a thin
  pass-through: navigations are network-first (falling back to the cached
  shell when offline), same-origin GET assets are cache-first, and everything
  else — other methods, other origins — is left entirely to the browser. When
  it does cache a response it keeps only the most recent 300 entries,
  evicting the oldest in insertion order.
- `src/pwa.ts` registers `sw.js` on `load`, and only in a production build
  (`import.meta.env.PROD`), so `vite dev` is never cached.

The icons are generated from `calcurio.avif` into `public/icons/`.

## Deploying to GitHub Pages

The build uses a relative `base`, so it works from a project subpath such as
`https://<user>.github.io/calcurio/`.

```sh
npm run deploy   # builds, then pushes dist/ to the gh-pages branch
```

`gh-pages` publishes the compiled static site; it never requires a backend.

## License

MIT.
