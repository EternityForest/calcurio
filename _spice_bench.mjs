import createNgspiceModule from '@o.z/ngspice-wasm';
async function run(label, tranline) {
  const netlist = `* inrush\nV1 1 0 400\nL1 1 2 100u\nR1 2 3 0.5\nC1 3 0 470u\nR2 3 4 1\nC2 4 0 100u\n.save v(3) i(L1) v(4)\n${tranline}\n.end\n`;
  const ng = await createNgspiceModule({ noInitialRun:true, noExitRuntime:true, print(){}, printErr(){} });
  ng.FS.writeFile('/in.cir', netlist);
  const argv=['ngspice','-b','-r','/out.raw','/in.cir'];
  const save = ng.stackSave();
  const argvPtr = ng.stackAlloc(argv.length*4);
  for (let i=0;i<argv.length;i++){ const p = ng.stringToUTF8OnStack(argv[i]); ng.setValue(argvPtr+i*4,p,'*'); }
  const t0=Date.now();
  try { ng._main(argv.length, argvPtr); } catch(e){}
  const ms=Date.now()-t0; ng.stackRestore(save);
  const buf = ng.FS.readFile('/out.raw');
  const head = new TextDecoder().decode(buf.slice(0,500));
  const pts = +/No\. Points:\s*(\d+)/.exec(head)[1];
  console.log(`[${label}] pts=${pts} ms=${ms} sizeMB=${(buf.length/1e6).toFixed(1)}`);
}
await run('tstep=100n (default)', '.tran 100n 100m uic');
await run('tstep=50u tmax=100n', '.tran 50u 100m 0 100n uic');
