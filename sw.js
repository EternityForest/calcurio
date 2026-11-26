/*
 * Calcurio service worker.
 *
 * Deliberately small: it is a thin pass-through that lets the browser do its
 * normal thing, adding only (a) an offline-capable app shell and (b) a single
 * runtime cache capped at the most recent MAX_ENTRIES responses. Navigations
 * are network-first so a deploy is picked up immediately; hashed build assets
 * are cache-first because their names change whenever their content does.
 *
 * The file is written to the site root (not bundled) so its scope covers the
 * whole app, including a GitHub Pages project sub-path.
 */

const VERSION = 'v1';
const SHELL_CACHE = `calcurio-shell-${VERSION}`;
const RUNTIME_CACHE = `calcurio-runtime-${VERSION}`;
const MAX_ENTRIES = 300;

/** App shell, relative to the service worker's own location. */
const SHELL = [
  '',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

const base = new URL('./', self.location);
const shellUrls = SHELL.map((path) => new URL(path, base).href);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(shellUrls);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => !keep.has(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Drop the oldest entries (cache.keys() is in insertion order) past the cap. */
async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ENTRIES; i += 1) {
    await cache.delete(keys[i]);
  }
}

/** Network first, falling back to the cached shell when offline. */
async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
  } catch {
    // Offline: use the cached shell below.
  }
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }
  const shell = await caches.match(new URL('index.html', base).href);
  return shell ?? Response.error();
}

/** Cache first, filling the cache on a miss; the browser caches nothing here. */
async function assetResponse(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
    await trim(cache);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    request.mode === 'navigate'
      ? navigationResponse(request)
      : assetResponse(request),
  );
});
