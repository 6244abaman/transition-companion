const CACHE='transition-companion-next-shell-v1';
const ASSETS=['./','./index.html',
  './.bundle/c1.txt','./.bundle/c2.txt','./.bundle/c3.txt','./.bundle/c4.txt','./.bundle/c5.txt',
  './.bundle/c6.txt','./.bundle/c7.txt','./.bundle/c8.txt','./.bundle/c9.txt','./.bundle/c10.txt'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    if(r && r.ok && new URL(e.request.url).origin===self.location.origin){
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy));
    }
    return r;
  })));
});