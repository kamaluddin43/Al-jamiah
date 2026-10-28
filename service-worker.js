// ★★★ ক্যাশ ভার্সন আপডেট করা হলো (v3 থেকে v4) ★★★
const CACHE_NAME = 'al-jamiah-v4.4.8';

const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  // Tailwind CDN এখান থেকে বাদ দেওয়া হয়েছে, কারণ এটি CORS এরর দিচ্ছিল
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
            console.log('Deleting old cache:', cacheName);
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

  // ★ শুধুমাত্র একই ডোমেইনের ফাইল ক্যাশ থেকে সার্ভ করব (বাইরের লিংক যেমন Tailwind সরাসরি নেটওয়ার্ক থেকে লোড হবে)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // ক্যাশে থাকলে ক্যাশ থেকে দিই
      if (response) {
        return response;
      }
      
      // না থাকলে নেটওয়ার্ক থেকে আনি এবং ক্যাশে সেভ করি
      return fetch(event.request).then((fetchResponse) => {
        if (fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // অফলাইন হলে index.html দেখাই
      return caches.match('index.html');
    })
  );
});
