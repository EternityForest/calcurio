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
  categories/electrical/    everyday electrical calculations
    ohms-law.ts         calculator definition (pure data)
    voltage-divider.ts  two-resistor divider with E-series selection
    low-pass-rlc.ts     low-pass RLC, RC, and LC filter
    high-pass-rlc.ts    high-pass RLC, RC, and LC filter
    inductor-impedance.ts       reactance of an inductor at a frequency
    capacitor-impedance.ts      reactance of a capacitor at a frequency
    inductance-at-bias.ts       inductance of a part at a current
    capacitance-at-dc-bias.ts   capacitance of a part at a DC bias
    wire-gauge.ts       wire-gauge geometry table
    wire-metals.ts      conductor resistivity table
    wire-resistance.ts  resistance of a wire from its gauge and metal
    friis.ts            Friis free-space path loss
    e-series.ts         E3-E24 resistor and capacitor tables, built on demand
    index.ts            category module entry
  categories/mechanical/    cable tension and stored energy
    catenary.ts         anchor force and chain length of a sagging cable
    raised-weight-energy.ts     gravitational energy of a raised mass
    index.ts            category module entry
  categories/fluids/    working-fluid properties and flow
    dippr-101.ts        DIPPR equation 101 correlation
    fluids.ts           fluid property table
    volume-and-weight.ts        volume and weight from a fluid's density
    orifice-flow.ts     discharge through an orifice under a head
    pipe-flow.ts        flow, velocity, and diameter in a full pipe
    pipe-pressure-drop.ts       pressure loss along a pipe at a flow rate
    index.ts            category module entry
  categories/physics/   wave propagation and the speed of light
    wave-media.ts       propagation-medium table (speed and impedance)
    wavelengths.ts      common wavelengths with their uses
    speed-of-light.ts   speed, frequency, wavelength, and travel time
    index.ts            category module entry
  categories/conversions/   everyday conversions between equivalent units
    equivalent-units.ts builds a set of mutually-equivalent variables
    length.ts           centimetres, inches, feet
    volume.ts           gallons, litres, cubic feet
    temperature.ts      Celsius, Fahrenheit, kelvin
    weight.ts           kilograms, pounds, ounces
    speed.ts            km/h, mph, ft/s, m/s
    index.ts            category module entry
  categories/math/      arithmetic primitives
    arithmetic.ts       shared operand builder and "slots" config
    add.ts              sum of two to ten values
    subtract.ts         difference of two values
    multiply.ts         product of two to ten values
    divide.ts           quotient of two values
    expression.ts       general expression evaluator (expr-eval)
    index.ts            category module entry
  categories/custom/    user-built multistep calculations
    library.ts          keeps registered calculators in step with storage
    hub.ts              lists saved customs, opens creator and importer
    editor.ts           edits one custom's steps
    step-dialog.ts      edits a step's settings, wiring, and visibility
    browser-dialog.ts   picks a catalog calculator to embed
    import-dialog.ts    pastes or chooses exported JSON
    export-dialog.ts    shows a custom as copyable JSON
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
  custom/               the custom-calculator model (pure data)
    types.ts            step kinds, wires, and wire paths
    catalog.ts          embeddable calculators and their tables
    steps.ts            config helpers, field lists, and wire options
    validate.ts         custom, wire, and table validation
    compile.ts          custom definition -> CalculatorDefinition
    serialize.ts        JSON export and import
    store.ts            localStorage persistence
  app.ts                category manifest and app singleton
  main.ts               imports CSS and mounts the widget
  pwa.ts                registers the service worker in production builds
public/                 copied verbatim into the build root
  manifest.webmanifest  web app manifest (installability)
  sw.js                 hand-written service worker (offline app shell)
  favicon-32.png        browser tab icon
  icons/                installed-app icons (192, 512, maskable, Apple)
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

The Electrical category uses the models directly in two calculators,
**Inductance at a current bias** and **Capacitance at a DC bias**, which the
SPICE inrush transient then builds on.

### Electrical calculators

Alongside Ohm's law and the component-bias models, the **Electrical** category
adds a two-resistor **Voltage divider** (type each resistance or pick one
from the E-series tables; it reports the output voltage and a read-only
divider ratio), **Low-pass** and **High-pass RLC filters** (set the
inductance to zero to collapse to the RC case, or the resistance to zero for
the undamped LC case; each reports the time constant and the -3 dB
frequency), **Inductor** and **Capacitor impedance** at a frequency (enter
any two of frequency, component value, and impedance, then Calculate the
third), and **Wire resistance**, which sets the conductor geometry from the
wire-gauge table (or from a typed cross-section, diameter, or radius) and the
resistivity from the metal table to give the resistance.

**Friis path loss** gives the free-space loss of a radio link,
`20 log10(4πdf/c)`, from the carrier frequency and the link distance. It
reports the free-space wavelength at that frequency as a convenience. The
transmit power and the two antenna gains are recorded inputs that do not
change the loss — the calculator only works out the loss.

### Fluids and DIPPR equation 101

The **Fluids** category carries thermophysical data for common working
fluids — water, air, nitrogen, mineral oil, ethylene glycol, neat propylene
glycol, and propylene-glycol/water mixtures at 30 %, 40 %, and 50 %. The
table stores each fluid's vapor-pressure and dynamic-viscosity coefficients
for DIPPR equation 101, plus reference density, specific heat, thermal
conductivity, thermal expansion, and dynamic viscosity at 20 °C. The 20 °C
viscosity is a literal reference value, held for every fluid (the mixtures
and mineral oil included) so a single lookup always yields a viscosity even
where the DIPPR correlation is not fitted.

DIPPR equation 101 is the standard five-parameter correlation

    Y = exp(A + B/T + C·ln T + D·T^E)

with the temperature in kelvin. `dippr-101.ts` implements it once, and the
same function evaluates both property sets, so the vapor-pressure
coefficients return pascals and the viscosity coefficients return pascal
seconds. Vapor pressure and viscosity are only fitted for the pure
substances, so the glycol mixtures and mineral oil leave those cells empty.

The category's calculators reach both the fluid data and the flow physics.
**Volume and weight** sets a fluid's density from the table; entering either
a volume or a weight then gives the other. **Orifice flow** gives the
discharge under a falling head, `Q = Cd·A·√(2gh)`, with the area taken from
the orifice diameter and the discharge coefficient defaulting to 0.62 for a
sharp-edged opening. **Pipe flow** relates the pipe diameter, the mean
velocity, and the flow rate through `Q = A·v` for a full pipe: enter any two
and Calculate the third. **Pipe pressure drop** takes a fluid from the table
(its density and viscosity fill in automatically), a pipe bore, length, and
roughness, and a volumetric flow rate, then gives the velocity, Reynolds
number, Darcy friction factor, and pressure loss through the Darcy–Weisbach
equation `Δp = f·(L/D)·(ρ·v²/2)`, with `f` from `64/Re` in laminar flow and
from the Colebrook–White correlation (solved by fixed-point iteration,
seeded by Swamee–Jain) when turbulent.

### Conversions

The **Conversions** category turns the equivalent-variables idea into
standalone calculators: length (centimetres, inches, feet), volume (gallons,
litres, cubic feet), temperature (Celsius, Fahrenheit, kelvin), weight
(kilograms, pounds, ounces), and speed (km/h, mph, ft/s, m/s). Each is a set
of two or more variables that are all the same quantity, so entering any one
fills the rest and there is nothing to solve for.

`equivalent-units.ts` builds those variables from a list of units, wiring
every pair together with a `convertUnit` conversion. Conversions go through
the unit system rather than a hand-written factor, so the results agree
exactly with the unit selectors and affine temperatures carry their offset.
Because the variables are reflections rather than formulas, these calculators
have no `computable` values and no test cases; their tests drive the runtime
directly.

### Math

The **Math** category holds the arithmetic primitives. **Add** and **Multiply**
each combine two to ten values, with a `slots` config field choosing how many
operands appear; **Subtract** and **Divide** always take exactly two. They use
the same `buildVariables` pattern as everything else, so the operand count is a
setting rather than a fixed field list.

**Expression** is a general evaluator built on
[expr-eval](https://github.com/silentmatt/expr-eval) (MIT). A formula is
written in the always-present input `x` (default 0) plus a configurable
number of extra inputs `a`, `b`, `c`, …, and evaluates to `y`. It supports
the usual `+ - * / ^`, parentheses, and functions such as `sin`, `cos`,
`sqrt`, `log`, `abs`, and `min`. expr-eval parses and evaluates without
`eval`, and assignment, function definitions, the `in` operator, and member
access are switched off, so a typed formula can only read the inputs it is
offered and can never run arbitrary code. The extra-input count is a `config`
field, so the visible input list is a setting rather than a fixed set of
fields, and an expression naming an unknown variable is reported on the
expression field.

### Mechanical

The **Mechanical** category covers static loads and stored energy.
**Catenary (chain curve)** gives the tension each anchor of a sagging cable
carries and the total length of the cable along its curve: enter the
horizontal span, the droop at the centre, the load hung at midspan, and the
total weight of the chain or rope. Rather than the small-sag parabola, the
solver uses the true catenary shape — a centre load splits the cable into two
catenary segments, and the horizontal tension that reproduces the given droop
is found by bisection — so the result holds for deep as well as shallow sag.
The vertical reaction carries half the total weight, the anchor force is the
vector sum of the two components, and the arc length follows from the tension
and the rope's weight per unit length, `L = Q·a/H` with catenary parameter
`a = H/w`. Entering the rope's total weight is usually the easiest figure to
measure, and a weightless cable reduces to the ordinary triangle of forces.
**Energy stored in a raised weight** gives the gravitational potential energy
of a mass lifted by a height, `m·g·h`; gravity defaults to standard gravity
(9.80665 m/s²) but can be changed for another location.

### Physics

The **Physics** category covers wave propagation and the speed of light, with
two reference tables and one calculator. The **wave media** table lists the
speed of light and the impedance of common propagation media: the bulk
dielectrics (vacuum, air, PTFE) and the usual coax and twisted-pair cables
(Cat5e, RG-58, RG-316, RG-400, LMR-400). For a bulk medium the speed is the
phase velocity and the impedance is the wave impedance; for a cable it is the
nominal velocity factor and the characteristic impedance. The speeds are
nominal — a cable's velocity factor depends on its dielectric, so check the
datasheet — and each row has a distinct speed so the medium can be recovered
from it. The **wavelengths** table lists common waves with their vacuum
frequency and a `uses` note: the visible colours, the UV bands and germicidal
lamps, the ISM and amateur radio bands, the common IR LED peaks, and the
thermal-camera LWIR band.

**Speed of light** ties them together. Picking a medium from the wave-media
table sets the speed of light in it; entering the frequency then gives the
wavelength (`λ = c/f`), and entering a distance gives the travel time
(`t = d/c`).

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
