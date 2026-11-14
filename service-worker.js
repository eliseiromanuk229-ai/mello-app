const CACHE_NAME = "metto-shell-v43";
const APP_FILES = ["./index.html", "./metto-cloud.html", "./metto-cloud.js?v=3", "./mello-prototype.html", "./mobile-layout.css?v=1", "./profile-banners.js?v=30", "./mello-stars.js?v=3", "./mello-v1.js?v=32", "./animations.css", "./animations.js", "./auth-accounts.js?v=24", "./emoji-assets.js", "./emoji-library.js", "./emoji-library.json", "./polls.js", "./button-icons.js", "./voice-circles.js", "./metto-enhancements.js?v=3", "./metto-final-polish.js?v=4", "./message-actions.js?v=2", "./assets/metto-logo.jpg", "./mello.webmanifest", "./mello-icon.svg", "./assets/banners/banner-01.jpg", "./assets/banners/banner-02.jpg", "./assets/banners/banner-03.jpg", "./assets/banners/banner-04.jpg", "./assets/banners/banner-05.jpg", "./assets/banners/banner-06.jpg", "./assets/banners/banner-07.jpg", "./assets/banners/banner-08.jpg", "./assets/banners/banner-09.jpg", "./assets/banners/banner-10.jpg", "./assets/banners/banner-11.jpg", "./assets/banners/banner-12.jpg", "./assets/banners/banner-13.jpg", "./assets/banners/banner-14.jpg", "./assets/banners/banner-15.jpg", "./assets/banners/banner-16.jpg", "./assets/banners/banner-17.jpg", ...Array.from({length:23}, (_, i) => `./assets/banners/banner-${String(i+18).padStart(2,"0")}.jpg`)];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(async () => (await caches.match(event.request)) || caches.match(new URL(event.request.url).pathname.endsWith("/metto-cloud.html") ? "./metto-cloud.html" : "./mello-prototype.html")));
  } else {
    const isBannerVideo = new URL(event.request.url).pathname.includes("/assets/banner-videos/");
    event.respondWith(caches.match(event.request).then(cached => {
      if (cached || !isBannerVideo) return cached || fetch(event.request);
      return fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
    }));
  }
});










