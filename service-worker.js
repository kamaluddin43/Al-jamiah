const CACHE_NAME = 'al-jamiah-v3';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// ইনস্টল ইভেন্ট (ফাইলগুলো ক্যাশ করা)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// অ্যাক্টিভেট ইভেন্ট (পুরনো ক্যাশ মুছে ফেলা)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ফেচ ইভেন্ট (ক্যাশ থেকে লোড করা, না থাকলে নেটওয়ার্ক থেকে)
self.addEventListener('fetch', (event) => {
  // ফায়ারবেস বা API রিকোয়েস্ট ক্যাশ করব না
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('identitytoolkit') || 
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // নতুন রিকোয়েস্ট হলে ক্যাশে সেভ করি (শুধু GET রিকোয়েস্ট)
        if (event.request.method === 'GET' && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // ★ অফলাইন হলে index.html দেখাই (গিটহাব ফিক্স)
      return caches.match('index.html');
    })
  );
});
