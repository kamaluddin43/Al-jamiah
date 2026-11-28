// ==========================================
// FIREBASE CLOUD MESSAGING - BACKGROUND
// ==========================================

// Firebase Compat SDK (Service Worker-এর জন্য)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase Configuration
firebase.initializeApp({
    apiKey: "AIzaSyCGZM2C4J5L7g1soLweHFvAH9erGVdOodY",
    authDomain: "al-jamiah.firebaseapp.com",
    projectId: "al-jamiah",
    storageBucket: "al-jamiah.firebasestorage.app",
    messagingSenderId: "453999340546",
    appId: "1:453999340546:web:0201175936e85c33bd4b1b"
});

const messaging = firebase.messaging();

// অ্যাপ বন্ধ বা ব্যাকগ্রাউন্ডে থাকলে নোটিফিকেশন
messaging.onBackgroundMessage((payload) => {
    console.log('Background Message:', payload);

    const notificationTitle =
        payload.notification?.title || 'আল-জামিয়াহ';

    const notificationOptions = {
        body: payload.notification?.body || 'নতুন একটি নোটিফিকেশন এসেছে।',
        icon: './logo.png',
        badge: './logo.png',
        data: payload.data || {}
    };

    return self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});


// ==========================================
// PWA CACHE SYSTEM
// ==========================================

// ক্যাশ ভার্সন আপডেট
const CACHE_NAME = 'al-jamiah-v6.9.0.9';

const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];


// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );

    self.skipWaiting();
});


// Activate Event
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


// Fetch Event
self.addEventListener('fetch', (event) => {

    // Firebase/API এবং non-GET request ক্যাশ হবে না
    if (
        event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('identitytoolkit') ||
        event.request.url.includes('fcmregistrations.googleapis.com') ||
        event.request.url.includes('firebaseinstallations.googleapis.com') ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    // শুধু একই ডোমেইনের ফাইল ক্যাশ হবে
    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {

            if (response) {
                return response;
            }

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
            return caches.match('index.html');
        })
    );
});
