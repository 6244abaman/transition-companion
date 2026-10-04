const CACHE='transition-companion-next-shell-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./companion-mentor.jpeg','../icon-192.png','../icon-512.png','../apple-touch-icon.png','./config/system-prompt.txt','./data/knowledge-manifest.json','./data/banners.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
      return r;
    }).catch(()=>caches.match(e.request).then(cached=>cached||Response.error()))
  );
});