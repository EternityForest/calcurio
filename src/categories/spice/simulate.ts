/**
 * Client side of the ngspice worker: one request per run, resolved with the
 * parsed vectors. The worker is torn down when the run finishes, fails, or is
 * aborted, so a cancelled simulation never keeps burning cycles.
 */

import type { RawFile } from './rawfile.js';

/** Message sent to the worker. */
export interface SimulationRequest {
  readonly netlist: string;
}

/** Successful reply, with vector data as transferable buffers. */
export interface SimulationSuccess {
  readonly ok: true;
  readonly names: readonly string[];
  readonly pointCount: number;
  readonly buffers: readonly ArrayBuffer[];
}

/** Failed reply carrying a displayable reason. */
export interface SimulationFailure {
  readonly ok: false;
  readonly error: string;
}

/** Reply sent by the worker. */
export type SimulationResponse = SimulationSuccess | SimulationFailure;

/** Creates the worker that hosts ngspice. Injected so tests can stub it. */
export type WorkerFactory = () => Worker;

/** Starts the ngspice worker that ships with this category. */
export function createNgspiceWorker(): Worker {
  return new Worker(new URL('./ngspice.worker.ts', import.meta.url), {
    type: 'module',
  });
}

/**
 * Simulates `netlist` in a worker and resolves with its vectors. Aborting
 * `signal` terminates the worker and rejects with an `AbortError`.
 */
export function simulate(
  netlist: string,
  signal: AbortSignal,
  createWorker: WorkerFactory = createNgspiceWorker,
): Promise<RawFile> {
  return new Promise<RawFile>((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    let worker: Worker;
    try {
      worker = createWorker();
    } catch (error) {
      reject(error);
      return;
    }

    let settled = false;
    const settle = (action: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      signal.removeEventListener('abort', handleAbort);
      worker.terminate();
      action();
    };

    function handleAbort(): void {
      settle(() => reject(abortError()));
    }

    worker.onmessage = (event: MessageEvent<SimulationResponse>): void => {
      const response = event.data;
      if (response.ok) {
        try {
          const file = toRawFile(response);
          settle(() => resolve(file));
        } catch (error) {
          settle(() => reject(error));
        }
        return;
      }
      settle(() => reject(new Error(response.error)));
    };
    worker.onerror = (event: ErrorEvent): void => {
      settle(() => reject(new Error(event.message || 'ngspice failed.')));
    };

    signal.addEventListener('abort', handleAbort, { once: true });
    const request: SimulationRequest = { netlist };
    worker.postMessage(request);
  });
}

/** Rebuilds the parsed vectors from a successful reply. */
function toRawFile(response: SimulationSuccess): RawFile {
  const { names, pointCount, buffers } = response;
  if (buffers.length !== names.length) {
    throw new Error('The simulator returned mismatched vectors.');
  }
  const series = buffers.map((buffer) => {
    if (buffer.byteLength !== pointCount * 8) {
      throw new Error('The simulator returned a vector of the wrong length.');
    }
    return new Float64Array(buffer);
  });
  return { names: [...names], pointCount, series };
}

/** The rejection used when a run is cancelled. */
function abortError(): DOMException {
  return new DOMException('The simulation was cancelled.', 'AbortError');
}
