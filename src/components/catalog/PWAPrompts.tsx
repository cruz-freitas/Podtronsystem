'use client'

import { useState, useEffect } from 'react'
import { Download, Wifi, WifiOff, X, Smartphone, RefreshCw } from 'lucide-react'
import { usePWA } from './usePWA'

interface PWAPromptsProps {
  primary: string
  secondary: string
  companyName: string
}

// ─── Banner de instalação ─────────────────────────────
function InstallBanner({
  primary, secondary, companyName, onInstall, onDismiss,
}: PWAPromptsProps & { onInstall: () => void; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Delay para não aparecer imediatamente ao abrir
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9990] px-4 pb-4"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(14,14,22,0.97)',
          border: `1px solid ${primary}30`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px ${primary}15`,
        }}
      >
        {/* Barra colorida no topo */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />

        <div className="p-4 flex items-center gap-4">
          {/* Ícone */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${primary}25, ${secondary}15)`, border: `1px solid ${primary}30` }}
          >
            <Smartphone className="w-6 h-6" style={{ color: primary }} />
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white leading-tight">
              Instalar {companyName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Acesso rápido, funciona offline
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
            <button
              onClick={onInstall}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                boxShadow: `0 4px 15px ${primary}40`,
              }}
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Banner de atualização disponível ────────────────
function UpdateBanner({ primary }: { primary: string }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9995] px-4 pt-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(14,14,22,0.97)',
          border: `1px solid ${primary}40`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="p-3 flex items-center gap-3">
          <RefreshCw className="w-4 h-4 flex-shrink-0" style={{ color: primary }} />
          <p className="text-sm text-white font-semibold flex-1">Nova versão disponível!</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-black px-3 py-1.5 rounded-lg"
            style={{ background: primary, color: '#fff' }}
          >
            Atualizar
          </button>
          <button onClick={() => setVisible(false)}>
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Indicador offline ────────────────────────────────
function OfflinePill() {
  const [show, setShow] = useState(false)

  // Pequeno delay para não piscar ao recarregar
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 500)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[9994] flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold shadow-2xl"
      style={{ background: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(10px)' }}
    >
      <WifiOff className="w-3.5 h-3.5" />
      Você está offline
    </div>
  )
}

// ─── Componente principal ─────────────────────────────
export function PWAPrompts({ primary, secondary, companyName }: PWAPromptsProps) {
  const { isInstallable, isOnline, isUpdateAvailable, promptInstall, dismissInstall } = usePWA()

  async function handleInstall() {
    const accepted = await promptInstall()
    if (!accepted) dismissInstall()
  }

  return (
    <>
      {/* Offline pill */}
      {!isOnline && <OfflinePill />}

      {/* Update banner */}
      {isUpdateAvailable && <UpdateBanner primary={primary} />}

      {/* Install banner - só aparece se instalável e online */}
      {isInstallable && isOnline && (
        <InstallBanner
          primary={primary}
          secondary={secondary}
          companyName={companyName}
          onInstall={handleInstall}
          onDismiss={dismissInstall}
        />
      )}
    </>
  )
}
