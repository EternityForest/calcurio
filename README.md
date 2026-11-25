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
    units.ts            convert-units wrapper plus resistance/inductance/capacitance/temperature
    runtime.ts          state, compute order, refinement, validation
    tables.ts           table registry and validation
    app.ts              category registry and lazy loading
    bookmarks.ts        localStorage persistence
    testing.ts          calculator test-case harness
    components/         Lit elements (app shell, calculator view, fields, dialog)
  models/               shared component models, with their data tables
    inductor-types.ts   inductor saturation table and L(i) law
    capacitor-types.ts  capacitor DC-bias table and C(V) law
  categories/basic/     one lazily loaded category
    ohms-law.ts         calculator definition (pure data)
    inductance-at-bias.ts       inductance of a part at a current
    capacitance-at-dc-bias.ts   capacitance of a part at a DC bias
    index.ts            category module entry
  categories/spice/     ngspice-backed transient simulations
    circuit.ts          netlist builder (pure data)
    rawfile.ts          binary rawfile parser
    metrics.ts          peaks and dissipated energy
    run.ts              batches ngspice in the current context
    ngspice.worker.ts   worker entry hosting the WebAssembly build
    simulate.ts         worker client (cancellable)
    decimate.ts         min/max envelope for plotting
    chart.ts            Chart.js graph of the waveforms
    inrush.ts           inrush transient calculator definition
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

Units come from `convert-units`; Calcurio adds `resistance` (`Ω`, `mΩ`,
`kΩ`, `MΩ`), `inductance` (`H`, `mH`, `µH`, `nH`), `capacitance`
(`F`, `mF`, `µF`, `nF`, `pF`) and `temperature` (`°C`, `K`, `°F`, `°R`)
measures because the library does not ship them. The temperature measure
spells the degrees out (`°C` rather than the library's bare `C`) and leaves
`F` to the farad. The unit selector lists the variable's base unit followed
by every unit of the same kind, or by `unitOptions` when it is provided.
Typed values are converted from the selected display unit into the base unit,
and displayed values are converted back out. A variable may set
`defaultDisplayUnit` to open in a different unit of the same kind; the state
is still stored in `unit`, so the capacitors store farads but start in
microfarads.

### Component models

`src/models` holds the shared, data-driven models for real parts. Each file
pairs an approximate reference table with the maths that turns a rating into
a curve, so the same numbers feed the calculators, the tables dialog, and the
SPICE netlist.

- `inductor-types.ts` lists magnetic materials and constructions (air,
  ferrite, powdered iron, Sendust, MPP, high flux, nanocrystalline). The
  saturation law is the behavioural rational form
  `L(i) = L∞ + (L0 − L∞) / (1 + (|i| / I_k)^p)`: `L0` is the rated
  inductance, `L∞` the residual inductance left at very high current, `I_k`
  the knee current at which the drop is halfway, and `p` the knee sharpness.
  The ΔL column is the fraction of inductance lost at the rated saturation
  current, so the convention that defines that current (typically a 10–30 %
  drop, depending on material) must match the datasheet. Air core never
  saturates, so its model stays linear.
- `capacitor-types.ts` lists dielectric and package classes (C0G/NP0, X5R,
  X7R, X8R, X7T, aluminium, tantalum). Packages are named imperial/metric
  (e.g. 0402/1005) so the size is unambiguous. The DC-bias law is the
  matching form `C(V) = Csat + (C0 − Csat) / (1 + (|V| / V0)^n)`. Class-2
  ceramics lose capacitance as they are biased; the knee voltage `V0` and
  the residual `Csat` come from the rated capacitance per active volume, the
  dielectric constant k, and a form modifier, fitted to 10 µF / 10 V X5R
  package anchors, with `V0` capped at 1.5× the voltage rating. C0G and the
  electrolytics are linear.

The inductor tables quote the rated saturation current at 25 °C and a
derating figure at 100 °C; the temperature inputs interpolate linearly
between the two, which the field descriptions note. Because the laws appear
twice — once in TypeScript for the calculator outputs and once as ngspice
behavioural sources (`BL … ddt(i)` and `Bcap … ddt(v)`) in the netlist — the
closed-form and simulated curves agree; keep the two in step.

The Basic category uses the models directly in two calculators, **Inductance
at a current bias** and **Capacitance at a DC bias**, which the SPICE inrush
transient then builds on.

### Adding a category

1. Create `src/categories/<id>/index.ts` exporting `{ calculators }` (and,
   optionally, `tables`).
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

Tables a category exports are registered with it under their `id` and become
reference data for its calculators: a variable with a `table` field becomes a
dropdown over that table's rows. Categories that need the same data export
the same table (the Basic and SPICE categories both ship the inductor and
capacitor model tables), so a shared model only needs defining once.

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

## SPICE simulations

The **SPICE** category runs transient circuit simulations with
[ngspice](https://github.com/z-wasm/ngspice-wasm) compiled to WebAssembly
(`@o.z/ngspice-wasm`, BSD-3-Clause). Each run happens in a Web Worker, so a
long simulation never blocks the page and can be cancelled by terminating the
worker. The multi-megabyte WebAssembly module is code-split into its own
chunk and only loads the first time a simulation runs; nothing is sent to a
server.

The first calculator, **Inrush Transient**, switches a supply voltage through
a series inductance and resistance onto a capacitor, with a second capacitor
behind its own resistance in parallel. Pick the inductor material and each
capacitor's dielectric to bring in the saturation and DC-bias models, enter
the parts' rated values and voltage ratings, and set the operating
temperature. It reports the peak load-capacitor voltage, the peak series
current, and the energy dissipated in each resistance, and graphs the series
current and capacitor voltage over the run. The time step (default 100 ns)
and simulation length (default 100 ms) are adjustable.

The pipeline is deliberately split so most of it is testable without the
simulator:

- `circuit.ts` builds the netlist as plain text: linear parts emit native
  `L`/`C` elements, while saturating inductors and DC-bias capacitors emit
  behavioural sources carrying the `src/models` laws.
- `run.ts` runs ngspice in the current context (Node or a worker).
- `rawfile.ts` parses the binary rawfile into named vectors.
- `metrics.ts` integrates those vectors into the reported numbers.
- `simulate.ts` is the worker client, cancelled through an `AbortSignal`.

`run.test.ts` exercises the real ngspice build end-to-end under Node, once
for a linear circuit and once for one with a saturating inductor and DC-bias
capacitors, and checks the physics (both capacitors settle to the supply, the
load capacitor overshoots, and every sample stays finite).

## Deploying to GitHub Pages

The build uses a relative `base`, so it works from a project subpath such as
`https://<user>.github.io/calcurio/`.

```sh
npm run deploy   # builds, then pushes dist/ to the gh-pages branch
```

`gh-pages` publishes the compiled static site; it never requires a backend.

## License

MIT.
