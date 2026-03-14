const CACHE_NAME = 'rupeewise-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.png',
    '/index.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(err => {
                console.warn('Service Worker fetch failed for:', event.request.url, err);
                return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            });
        })
    );
});
