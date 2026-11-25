import createNgspiceModule from '@o.z/ngspice-wasm';

self.onmessage = async () => {
  const ng = await createNgspiceModule({
    noInitialRun: true,
    noExitRuntime: true,
    print() {},
    printErr() {},
  });
  ng.FS.writeFile('/in.cir', '.tran 5u 100m uic\n.end\n');
  const argv = ['ngspice', '-b', '-r', '/out.raw', '/in.cir'];
  const save = ng.stackSave();
  const argvPtr = ng.stackAlloc(argv.length * 4);
  for (let i = 0; i < argv.length; i += 1) {
    const p = ng.stringToUTF8OnStack(argv[i]);
    ng.setValue(argvPtr + i * 4, p, '*');
  }
  try {
    ng._main(argv.length, argvPtr);
  } catch {
    // exit status
  }
  ng.stackRestore(save);
  const buf = ng.FS.readFile('/out.raw');
  self.postMessage({ bytes: buf.length });
};
