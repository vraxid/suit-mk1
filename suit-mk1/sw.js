// Offline cache for Suit Mk1. Bump VERSION whenever any file changes.
const VERSION = 'mk1-v9';
const FILES = [
  "./",
  "fonts/chakra-petch-latin-600-normal.woff2",
  "fonts/chakra-petch-latin-700-normal.woff2",
  "fonts/jetbrains-mono-latin-400-normal.woff2",
  "fonts/jetbrains-mono-latin-500-normal.woff2",
  "fonts/jetbrains-mono-latin-700-normal.woff2",
  "icons/apple-touch-icon.png",
  "icons/favicon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "index.html",
  "manifest.webmanifest",
  "models/faceshell.glb",
  "models/logo.glb",
  "models/lenses.glb",
  "models/suit2.glb",
  "models/webshooter.glb",
  "vendor/jsm/controls/OrbitControls.js",
  "vendor/jsm/loaders/GLTFLoader.js",
  "vendor/jsm/utils/BufferGeometryUtils.js",
  "vendor/three.module.min.js",
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.includes('/audio/')) return;   // let the browser stream the music itself
  // network first for the page itself so updates show up; cache first for everything else
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./', copy)); return r; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
