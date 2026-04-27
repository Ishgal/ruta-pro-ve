// public/sw.js
self.addEventListener('install', (event) => {
  console.log('SW instalado');
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  console.log('SW activado');
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => new Response('Offline'))
  );
});