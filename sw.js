/**
 * PET Words Adventure - Service Worker
 * Enables offline functionality
 */

const CACHE_NAME = 'pet-words-v3.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/animations.css',
  './js/app.js',
  './js/db.js',
  './js/auth.js',
  './js/leaderboard.js',
  './js/data-loader.js',
  './js/flashcard.js',
  './js/stories.js',
  './js/quiz.js',
  './js/library.js',
  './js/progress.js',
  './data/words/index.json',
  // All 23 vocabulary topics
  './data/words/clothes-and-accessories.json',
  './data/words/colours.json',
  './data/words/communications-and-technology.json',
  './data/words/education.json',
  './data/words/entertainment-and-media.json',
  './data/words/environment.json',
  './data/words/food-and-drink.json',
  './data/words/health-medicine-exercise.json',
  './data/words/hobbies-and-leisure.json',
  './data/words/house-and-home.json',
  './data/words/language.json',
  './data/words/natural-world.json',
  './data/words/personal-feelings.json',
  './data/words/places-buildings.json',
  './data/words/places-countryside.json',
  './data/words/places-town-city.json',
  './data/words/services.json',
  './data/words/shopping.json',
  './data/words/sport.json',
  './data/words/time.json',
  './data/words/travel-and-transport.json',
  './data/words/weather.json',
  './data/words/work-and-jobs.json',
  './assets/icons/icon.svg'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: All files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
      .catch(() => {
        // Return offline page if available
        return caches.match('./index.html');
      })
  );
});

