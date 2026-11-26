/**
 * Register the service worker that makes Calcurio installable and usable
 * offline. Only runs in a production build: in `vite dev` the module would be
 * served without the emitted `sw.js`, and caching would fight live reloads.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', () => {
    const script = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker.register(script).catch((error: unknown) => {
      console.warn('Calcurio service worker failed to register.', error);
    });
  });
}
