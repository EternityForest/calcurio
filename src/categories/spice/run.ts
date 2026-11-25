/**
 * Runs ngspice in batch mode inside the current JavaScript context. Kept free
 * of worker and DOM APIs so it can run in a worker or in a Node test.
 */

import type { NgspiceModule, NgspiceModuleOptions } from '@o.z/ngspice-wasm';

/** Creates a fresh ngspice module instance. */
export type NgspiceFactory = (
  options: NgspiceModuleOptions,
) => Promise<NgspiceModule>;

const INPUT_FILE = '/in.cir';
const OUTPUT_FILE = '/out.raw';
const ARGUMENTS = ['ngspice', '-b', '-r', OUTPUT_FILE, INPUT_FILE];

/**
 * Simulates `netlist` and returns the bytes of the rawfile it produced. A new
 * module is created for every run because ngspice keeps process-wide state.
 */
export async function runNgspice(
  netlist: string,
  createModule: NgspiceFactory,
): Promise<Uint8Array> {
  const log: string[] = [];
  const module = await createModule({
    noInitialRun: true,
    noExitRuntime: true,
    print: (text) => log.push(text),
    printErr: (text) => log.push(text),
  });

  module.FS.writeFile(INPUT_FILE, netlist);
  invokeMain(module);

  try {
    return module.FS.readFile(OUTPUT_FILE) as Uint8Array;
  } catch {
    throw new Error('The simulator produced no result.' + summarize(log));
  }
}

/** Calls the module's `main`, tolerating the exit status ngspice throws. */
function invokeMain(module: NgspiceModule): void {
  const stack = module.stackSave();
  try {
    const pointer = module.stackAlloc(ARGUMENTS.length * 4);
    for (let index = 0; index < ARGUMENTS.length; index += 1) {
      const text = module.stringToUTF8OnStack(ARGUMENTS[index]!);
      module.setValue(pointer + index * 4, text, '*');
    }
    module._main(ARGUMENTS.length, pointer);
  } catch (error) {
    // Batch mode always exits by throwing the exit status; status 0 is clean.
    if (!isCleanExit(error)) {
      throw error;
    }
  } finally {
    module.stackRestore(stack);
  }
}

/** True for the `ExitStatus` object Emscripten throws on `exit(0)`. */
function isCleanExit(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return (error as { status?: unknown }).status === 0;
}

/** Adds the tail of the simulator log to a failure message. */
function summarize(log: readonly string[]): string {
  const text = log.join('').trim();
  if (text === '') {
    return '';
  }
  const lines = text.split('\n').slice(-4);
  return `\n${lines.join('\n')}`;
}
