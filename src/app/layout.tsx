import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

// ─── Viewport ─────────────────────────────────────────
// Configuração separada do metadata (Next 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Safe area para iPhone notch / home indicator
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#06060a' },
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
  ],
}

// ─── Metadata global ──────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Poditron',
    template: '%s — Poditron',
  },
  description: 'Plataforma SaaS para catálogos digitais e vendas via WhatsApp',
  applicationName: 'Poditron',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Poditron',
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
    url: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#6366f1',
    'msapplication-tap-highlight': 'no',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/*
          O Service Worker é registrado via script inline para funcionar
          em todas as rotas sem depender de 'use client' no layout.
          O sw.js fica em /public/sw.js (servido na raiz).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .catch(function(err) {
                      console.warn('[PWA] SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
