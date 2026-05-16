'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  promptInstall: () => Promise<boolean>
  dismissInstall: () => void
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ── Detecta se já está instalado ──────────────────
    const standaloneMedia = window.matchMedia('(display-mode: standalone)')
    setIsInstalled(standaloneMedia.matches || (navigator as any).standalone === true)
    const handleStandalone = (e: MediaQueryListEvent) => setIsInstalled(e.matches)
    standaloneMedia.addEventListener('change', handleStandalone)

    // ── Captura o prompt de instalação ────────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!dismissed) setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // ── Detecta instalação concluída ──────────────────
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // ── Monitor de conectividade ──────────────────────
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // ── Registra o Service Worker ─────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => {
          // Detecta atualização disponível
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true)
              }
            })
          })
          // Verifica atualização periodicamente (a cada 30min)
          setInterval(() => reg.update(), 30 * 60 * 1000)
        })
        .catch(err => console.warn('[PWA] SW registration failed:', err))
    }

    return () => {
      standaloneMedia.removeEventListener('change', handleStandalone)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dismissed])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsInstallable(false)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismissInstall = useCallback(() => {
    setIsInstallable(false)
    setDismissed(true)
    // Não mostra de novo por 7 dias
    sessionStorage.setItem('pwa_dismissed_at', Date.now().toString())
  }, [])

  return { isInstallable, isInstalled, isOnline, isUpdateAvailable, promptInstall, dismissInstall }
}
