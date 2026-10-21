// Service worker mínimo: deixa o app abrir mesmo sem internet.
// Páginas: tenta a rede primeiro, cai no cache se estiver offline.
// /assets/ (nome com hash, nunca muda): baixa uma vez e usa o cache para sempre.
//   Importante para o motor da IA (~27 MB): não pode ser rebaixado a cada visita.
// Outros arquivos (ícone, manifest): usa o cache e atualiza em segundo plano.
const CACHE = 'inventario-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './icon.svg', './manifest.webmanifest'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // Apaga só os caches antigos do próprio app. O modelo da IA fica num cache
  // da biblioteca (transformers-cache) e não pode ser apagado a cada atualização.
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('inventario-') && k !== CACHE).map((k) => caches.delete(k))),
      ),
  )
  self.clients.claim()
})

const guardar = (req, res) => {
  if (res.ok) {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy))
  }
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  // Firestore/Google e o Hugging Face cuidam do próprio cache; só tratamos arquivos do app.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => guardar(req, res))))
    return
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => guardar(req, res))
        .catch(() => cached)
      return cached || network
    }),
  )
})
