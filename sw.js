// Mode hors connexion : garde une copie de l'appli sur l'appareil.
// Fichiers de l'appli : réseau d'abord (pour avoir les mises à jour), copie si pas de réseau.
// Polices et lecteur de code-barres : copie d'abord. Open Food Facts : toujours en direct.
const CACHE = 'macro-pulse-v1';
const SHELL = ['./', './index.html', './ciqual.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const keep = (req, res) => {
  if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => keep(req, res))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$|(^|\.)unpkg\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => keep(req, res))));
  }
});
