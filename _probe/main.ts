const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
});
worker.onmessage = (event) => {
  console.log('worker replied', event.data);
};
worker.postMessage('go');
