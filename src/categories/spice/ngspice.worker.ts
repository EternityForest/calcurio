/**
 * Worker entry point: runs ngspice off the main thread so a long simulation
 * never freezes the page, and so it can be cancelled by terminating the
 * worker. Replies with the parsed vectors as transferable buffers.
 */

import createNgspiceModule from '@o.z/ngspice-wasm';
import { errorMessage } from '../../framework/errors.js';
import { parseRawFile } from './rawfile.js';
import { runNgspice } from './run.js';
import type { SimulationRequest, SimulationResponse } from './simulate.js';

/** The subset of `WorkerGlobalScope` this module uses. */
interface WorkerScope {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<SimulationRequest>) => void,
  ): void;
  postMessage(message: SimulationResponse, transfer?: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;

scope.addEventListener('message', (event) => {
  void handle(event.data);
});

/** Simulates one netlist and posts either the vectors or the reason it failed. */
async function handle(request: SimulationRequest): Promise<void> {
  try {
    const bytes = await runNgspice(request.netlist, createNgspiceModule);
    const file = parseRawFile(bytes);
    const buffers = file.series.map((series) => series.buffer as ArrayBuffer);
    scope.postMessage(
      {
        ok: true,
        names: [...file.names],
        pointCount: file.pointCount,
        buffers,
      },
      buffers,
    );
  } catch (error) {
    scope.postMessage({ ok: false, error: errorMessage(error) });
  }
}
