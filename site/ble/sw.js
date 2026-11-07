// Minimal offline cache so the reader opens as an installed app without network.
const CACHE = 'dbk-ble-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './ota.html', '../styles.css', '../ui-preferences.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => { e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });
