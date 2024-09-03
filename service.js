const CACHE_NAME = 'v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/model/model.json',
    '/win.html',
    '/win.js',
    '/game.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                const cachePromises = urlsToCache.map(url => {
                    return cache.add(url).catch(reason => {
                        console.warn(url + ' failed: ' + reason);
                    });
                });
                return Promise.all(cachePromises);
            })
            .then(() => {
                console.log('All resources have been fetched and cached.');
            })
    );
});