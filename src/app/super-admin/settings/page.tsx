'use client'

import { useAuth } from '@/context/AuthContext'
import { Shield, Zap, Globe, Key } from 'lucide-react'

export default function SuperAdminSettingsPage() {
  const { user } = useAuth()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
        <p className="text-zinc-400 text-sm mt-1">Configurações globais do Poditron</p>
      </div>

      {/* System info */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" /> Sistema Poditron
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Versão', value: '1.0.0' },
            { label: 'Ambiente', value: process.env.NODE_ENV || 'production' },
            { label: 'Super Admin', value: user?.full_name || '—' },
            { label: 'Banco de Dados', value: 'Supabase PostgreSQL' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
              <span className="text-xs text-zinc-500">{item.label}</span>
              <span className="text-xs text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-400" /> Como funciona o sistema de tokens
        </h3>
        <div className="space-y-3 text-sm text-zinc-400">
          <p>Cada empresa possui um <strong className="text-white">slug único</strong> que funciona como seu token de acesso e identificador.</p>
          <div className="space-y-2">
            {[
              { icon: '🔑', text: 'Você cria a empresa em "Nova Empresa" e define o slug' },
              { icon: '📧', text: 'O sistema gera um email e senha para o admin da empresa' },
              { icon: '🛒', text: 'O catálogo fica disponível em /catalog/[slug]' },
              { icon: '⚙️', text: 'O admin loga em /auth/login e gerencia apenas sua empresa' },
              { icon: '🔒', text: 'Dados isolados — uma empresa nunca acessa dados de outra' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" /> Links Úteis
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard', desc: 'Gerenciar banco de dados e usuários' },
            { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', desc: 'Gerenciar deployments' },
          ].map(link => (
            <a key={link.url} href={link.url} target="_blank"
              className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors group">
              <div>
                <div className="text-sm text-white font-medium">{link.label}</div>
                <div className="text-xs text-zinc-500">{link.desc}</div>
              </div>
              <Globe className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
