// ═══════════════════════════════════════════════════════
//  PODITRON PWA — Service Worker
//  Estratégia: Cache-First para assets, Network-First para
//  dados do catálogo, Offline fallback para navegação.
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'poditron-v1'
const STATIC_CACHE = 'poditron-static-v1'
const IMG_CACHE = 'poditron-images-v1'

// Assets estáticos que são pré-cacheados no install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
]

// ─── Install: pré-cacheia assets críticos ─────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Não bloqueia o install se algum falhar
      })
    }).then(() => self.skipWaiting())
  )
})

// ─── Activate: limpa caches antigos ───────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE && k !== IMG_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ─── Fetch: estratégias por tipo de requisição ────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora extensões do Chrome e não-http
  if (!request.url.startsWith('http')) return

  // ── Imagens: Cache-First com fallback ──────────────
  if (request.destination === 'image') {
    event.respondWith(imageStrategy(request))
    return
  }

  // ── API / Supabase: Network-only (dados ao vivo) ───
  if (
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(fetch(request))
    return
  }

  // ── Next.js estático (_next/static): Cache-First ───
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staticStrategy(request))
    return
  }

  // ── Páginas do catálogo: Network-First + offline ───
  if (url.pathname.startsWith('/catalog/')) {
    event.respondWith(catalogStrategy(request))
    return
  }

  // ── Resto: Network-First simples ───────────────────
  event.respondWith(networkFirst(request))
})

// ─── Estratégia: imagens com cache longo ──────────────
async function imageStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(IMG_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Retorna placeholder SVG se offline
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#0e0e16"/>
        <text x="150" y="155" text-anchor="middle" fill="#333" font-size="40">📦</text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}

// ─── Estratégia: assets estáticos ─────────────────────
async function staticStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

// ─── Estratégia: catálogo Network-First ───────────────
async function catalogStrategy(request) {
  // Só cacheia navegação GET
  if (request.method !== 'GET') return fetch(request)

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Fallback offline
    return caches.match('/offline.html') || new Response(
      offlinePage(),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

// ─── Estratégia: Network-First genérico ───────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

// ─── HTML de fallback offline ─────────────────────────
function offlinePage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sem conexão — Poditron</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #06060a;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      text-align: center;
      max-width: 320px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
      display: block;
    }
    h1 { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
    p { color: rgba(255,255,255,0.45); font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
    button {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      color: white;
      padding: 14px 32px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="icon">📡</span>
    <h1>Sem conexão</h1>
    <p>Verifique sua internet e tente novamente. Os produtos vistos anteriormente podem estar disponíveis no cache.</p>
    <button onclick="location.reload()">Tentar novamente</button>
  </div>
</body>
</html>`
}
