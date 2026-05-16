'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { companiesService } from '@/services/companies'
import { buildWhatsAppUrl, buildProductWhatsAppMessage } from '@/lib/utils'
import { Settings, MessageSquare, Store, Save, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { company, refreshUser } = useAuth()
  const [tab, setTab] = useState<'geral' | 'whatsapp'>('geral')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', whatsapp: '',
    whatsapp_message: '', description: '', city: '', state: '',
  })
  const [saving, setSaving] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!company) return
    setForm({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      whatsapp: company.whatsapp || '',
      whatsapp_message: company.whatsapp_message || '',
      description: company.description || '',
      city: company.city || '',
      state: company.state || '',
    })
    return () => { mountedRef.current = false }
  }, [company])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!company?.id) return
    setSaving(true)
    const { error } = await companiesService.update(company.id, form)
    if (error) {
      toast.error('Erro ao salvar')
    } else {
      toast.success('Configurações salvas!')
      await refreshUser()
    }
    setSaving(false)
  }

  // Preview of what message will look like
  const previewMessage = buildProductWhatsAppMessage({
    productName: 'Ignite V150',
    brand: 'Ignite',
    sku: 'IGN-V150',
    variation: 'Blueberry Ice',
    price: 89.90,
    catalogUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://seusite.com'}/catalog/${company?.slug}/product/ignite-v150`,
    greeting: form.whatsapp_message || undefined,
  })

  const inputClass = "w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">Dados da empresa e configuração do WhatsApp</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1 w-fit">
        {[
          { id: 'geral', label: 'Geral', icon: Store },
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {tab === 'geral' && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-400" /> Informações da Empresa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome da Empresa *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contato@empresa.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cidade</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="São Paulo" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Estado</label>
                <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="SP" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Descreva sua empresa..." className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>
              {company?.slug && (
                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex-1">
                    <div className="text-xs text-zinc-400">Link do seu catálogo</div>
                    <div className="text-sm text-indigo-300 font-mono">/catalog/{company.slug}</div>
                  </div>
                  <a href={`/catalog/${company.slug}`} target="_blank"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'whatsapp' && (
          <div className="space-y-5">
            {/* Number config */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" /> Número do WhatsApp
              </h3>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Número *</label>
                <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="5511999999999" className={inputClass} />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Formato: <span className="text-zinc-300 font-mono">55 + DDD + número</span> — sem espaços ou traços. Ex: <span className="text-zinc-300 font-mono">5511999999999</span>
                </p>
              </div>
              {form.whatsapp && (
                <a href={`https://wa.me/${form.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                  <MessageSquare className="w-4 h-4" /> Testar número
                </a>
              )}
            </div>

            {/* Greeting template */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Saudação Inicial</h3>
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300">
                  Esta é apenas a <strong>saudação inicial</strong>. O sistema adiciona automaticamente os dados do produto (nome, sabor, preço, SKU e link) em seguida.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Saudação</label>
                <textarea value={form.whatsapp_message} onChange={e => setForm(f => ({ ...f, whatsapp_message: e.target.value }))} rows={2}
                  placeholder="Olá! Vi seu catálogo online e tenho interesse em um produto."
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-semibold">Preview da Mensagem</h3>
              <p className="text-xs text-zinc-500">Veja como ficará a mensagem quando o cliente clicar em "Chamar no WhatsApp":</p>
              <div className="bg-[#0b1a12] border border-green-900/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-900/30">
                  <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">C</div>
                  <div>
                    <div className="text-green-300 text-xs font-semibold">Cliente</div>
                    <div className="text-green-600 text-[10px]">via WhatsApp</div>
                  </div>
                </div>
                <pre className="text-green-200 text-xs whitespace-pre-wrap font-sans leading-relaxed">{previewMessage}</pre>
              </div>
              <p className="text-xs text-zinc-600">* Dados do produto são gerados automaticamente com base no produto clicado</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  )
}
