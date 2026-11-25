import { describe, expect, it, vi } from 'vitest';
import { simulate } from './simulate.js';
import type { SimulationResponse, WorkerFactory } from './simulate.js';

/** A stand-in for the ngspice worker that replies on demand. */
class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly posted: unknown[] = [];
  terminated = false;

  postMessage(message: unknown): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  reply(response: SimulationResponse): void {
    this.onmessage?.({ data: response } as MessageEvent);
  }

  fail(message: string): void {
    this.onerror?.({ message } as ErrorEvent);
  }
}

const NETLIST = '* test\n.end\n';

function harness(): { worker: FakeWorker; factory: WorkerFactory } {
  const worker = new FakeWorker();
  return { worker, factory: () => worker as unknown as Worker };
}

function bytes(values: readonly number[]): ArrayBuffer {
  return Float64Array.from(values).buffer;
}

describe('simulate', () => {
  it('posts the netlist and resolves with the parsed vectors', async () => {
    const { worker, factory } = harness();
    const promise = simulate(NETLIST, new AbortController().signal, factory);
    expect(worker.posted).toEqual([{ netlist: NETLIST }]);

    worker.reply({
      ok: true,
      names: ['time', 'v(3)'],
      pointCount: 2,
      buffers: [bytes([0, 1]), bytes([2, 3])],
    });

    const file = await promise;
    expect(file.names).toEqual(['time', 'v(3)']);
    expect(file.pointCount).toBe(2);
    expect(Array.from(file.series[1]!)).toEqual([2, 3]);
    expect(worker.terminated).toBe(true);
  });

  it('rejects with the worker message on failure', async () => {
    const { worker, factory } = harness();
    const promise = simulate(NETLIST, new AbortController().signal, factory);
    worker.reply({ ok: false, error: 'ngspice exploded' });

    await expect(promise).rejects.toThrow('ngspice exploded');
    expect(worker.terminated).toBe(true);
  });

  it('rejects when the worker raises an error event', async () => {
    const { worker, factory } = harness();
    const promise = simulate(NETLIST, new AbortController().signal, factory);
    worker.fail('worker crashed');

    await expect(promise).rejects.toThrow('worker crashed');
  });

  it('rejects a reply whose vectors do not match the names', async () => {
    const { worker, factory } = harness();
    const promise = simulate(NETLIST, new AbortController().signal, factory);
    worker.reply({
      ok: true,
      names: ['time', 'v(3)'],
      pointCount: 2,
      buffers: [bytes([0, 1])],
    });

    await expect(promise).rejects.toThrow('mismatched vectors');
  });

  it('rejects a vector of the wrong length', async () => {
    const { worker, factory } = harness();
    const promise = simulate(NETLIST, new AbortController().signal, factory);
    worker.reply({
      ok: true,
      names: ['time'],
      pointCount: 2,
      buffers: [bytes([0, 1, 2])],
    });

    await expect(promise).rejects.toThrow('wrong length');
  });

  it('rejects without starting a worker when already aborted', async () => {
    const factory = vi.fn<WorkerFactory>(() => {
      throw new Error('should not create a worker');
    });
    const controller = new AbortController();
    controller.abort();

    await expect(
      simulate(NETLIST, controller.signal, factory),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(factory).not.toHaveBeenCalled();
  });

  it('terminates the worker and rejects when aborted mid-run', async () => {
    const { worker, factory } = harness();
    const controller = new AbortController();
    const promise = simulate(NETLIST, controller.signal, factory);

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminated).toBe(true);
  });

  it('rejects when the worker cannot be created', async () => {
    const factory: WorkerFactory = () => {
      throw new Error('no workers here');
    };

    await expect(
      simulate(NETLIST, new AbortController().signal, factory),
    ).rejects.toThrow('no workers here');
  });
});
