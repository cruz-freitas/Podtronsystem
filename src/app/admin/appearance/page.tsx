'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { themesService, companiesService } from '@/services/companies'
import { supabase } from '@/lib/supabase'
import { Save, Eye, Palette, Type, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const presets = [
  { name: 'Índigo', primary: '#6366f1', secondary: '#8b5cf6', bg: '#06060a', surface: '#0e0e16' },
  { name: 'Esmeralda', primary: '#10b981', secondary: '#059669', bg: '#040d09', surface: '#091a10' },
  { name: 'Rosa', primary: '#ec4899', secondary: '#db2777', bg: '#0d0608', surface: '#1a0a10' },
  { name: 'Âmbar', primary: '#f59e0b', secondary: '#d97706', bg: '#0d0a04', surface: '#1a1208' },
  { name: 'Ciano', primary: '#06b6d4', secondary: '#0891b2', bg: '#04090d', surface: '#08121a' },
  { name: 'Roxo', primary: '#a855f7', secondary: '#9333ea', bg: '#09050d', surface: '#120a1a' },
  { name: 'Vermelho', primary: '#ef4444', secondary: '#dc2626', bg: '#0d0404', surface: '#1a0808' },
  { name: 'Branco', primary: '#e4e4e7', secondary: '#a1a1aa', bg: '#09090b', surface: '#141414' },
]

export default function AppearancePage() {
  const { company, refreshUser } = useAuth()
  const [colors, setColors] = useState({
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    background_color: '#06060a',
    surface_color: '#0e0e16',
  })
  const [texts, setTexts] = useState({
    description: '',
    tagline: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!company?.id) return
    load()
    return () => { mountedRef.current = false }
  }, [company?.id])

  async function load() {
    setLoading(true)
    const { data: theme } = await themesService.getByCompanyId(company!.id)
    const { data: comp } = await supabase.from('companies').select('description, tagline').eq('id', company!.id).single()

    if (mountedRef.current) {
      if (theme) {
        setColors({
          primary_color: theme.primary_color || '#6366f1',
          secondary_color: theme.secondary_color || '#8b5cf6',
          background_color: theme.background_color || '#06060a',
          surface_color: theme.surface_color || '#0e0e16',
        })
      }
      if (comp) {
        setTexts({
          description: comp.description || '',
          tagline: (comp as any).tagline || '',
        })
      }
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!company?.id) return
    setSaving(true)
    const [themeResult, compResult] = await Promise.all([
      themesService.update(company.id, colors),
      supabase.from('companies').update({
        description: texts.description,
        tagline: texts.tagline,
      }).eq('id', company.id),
    ])

    if (themeResult.error || compResult.error) {
      toast.error('Erro ao salvar')
    } else {
      toast.success('Salvo! O catálogo já reflete as mudanças.')
      await refreshUser()
    }
    setSaving(false)
  }

  const p = colors.primary_color
  const s = colors.secondary_color

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-zinc-900/50 animate-pulse" />)}
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Aparência</h1>
          <p className="text-zinc-400 text-sm mt-1">Cores e textos do catálogo</p>
        </div>
        <div className="flex gap-3">
          {company?.slug && (
            <a href={`/catalog/${company.slug}`} target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">
              <Eye className="w-4 h-4" /> Ver catálogo
            </a>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-indigo-400" /> Temas Prontos
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {presets.map(preset => {
            const active = colors.primary_color === preset.primary
            return (
              <button key={preset.name}
                onClick={() => setColors({ primary_color: preset.primary, secondary_color: preset.secondary, background_color: preset.bg, surface_color: preset.surface })}
                className="flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all hover:scale-105"
                style={{
                  background: active ? `${preset.primary}20` : 'rgba(255,255,255,0.04)',
                  border: active ? `1px solid ${preset.primary}50` : '1px solid rgba(255,255,255,0.06)',
                }}>
                <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                <span className="text-[10px] font-medium" style={{ color: active ? preset.primary : 'rgba(255,255,255,0.4)' }}>{preset.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom colors */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" /> Cores Personalizadas
        </h3>
        <div className="space-y-3">
          {[
            { key: 'primary_color', label: 'Cor Principal', desc: 'Botões, destaques e gradientes' },
            { key: 'secondary_color', label: 'Cor Secundária', desc: 'Gradiente e efeitos' },
            { key: 'background_color', label: 'Fundo', desc: 'Cor de fundo do catálogo' },
            { key: 'surface_color', label: 'Cards', desc: 'Cor dos cards de produto' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <input type="color" value={(colors as any)[key]}
                onChange={e => setColors(c => ({ ...c, [key]: e.target.value }))}
                className="w-11 h-11 rounded-xl cursor-pointer border-0 bg-transparent"
                style={{ padding: '2px' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
              </div>
              <code className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                {(colors as any)[key]}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Texts */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-400" /> Textos do Catálogo
        </h3>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Slogan / Frase de Efeito
            <span className="text-zinc-600 text-xs ml-2">— aparece acima do nome</span>
          </label>
          <input value={texts.tagline}
            onChange={e => setTexts(t => ({ ...t, tagline: e.target.value }))}
            maxLength={80}
            placeholder="Ex: A melhor experiência em vapes"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = `${p}60`}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <div className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{texts.tagline.length}/80</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Descrição
            <span className="text-zinc-600 text-xs ml-2">— aparece abaixo do nome</span>
          </label>
          <textarea value={texts.description}
            onChange={e => setTexts(t => ({ ...t, description: e.target.value }))}
            maxLength={200} rows={3}
            placeholder="Ex: Produtos de qualidade com entrega rápida. Atendemos todo o Brasil."
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 resize-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = `${p}60`}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <div className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{texts.description.length}/200</div>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm">Preview do Catálogo</h3>
        <div className="rounded-xl overflow-hidden" style={{ background: colors.background_color, border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Header preview */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: `${colors.background_color}cc`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg" style={{ background: `linear-gradient(135deg, ${p}, ${s})`, boxShadow: `0 0 12px ${p}50` }} />
              <span className="text-white text-sm font-bold">{company?.name}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
              WhatsApp
            </div>
          </div>

          {/* Hero preview */}
          <div className="py-10 px-4 text-center relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${p}15 0%, transparent 70%)` }} />
            <div className="relative space-y-3">
              {texts.tagline && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: `${p}20`, border: `1px solid ${p}40`, color: p }}>
                  ✦ {texts.tagline}
                </div>
              )}
              <div className="text-2xl font-black"
                style={{
                  background: `linear-gradient(135deg, #ffffff 30%, ${p} 80%, ${s} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {company?.name}
              </div>
              {texts.description && (
                <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {texts.description}
                </p>
              )}
            </div>
          </div>

          {/* Card preview */}
          <div className="px-4 pb-4 grid grid-cols-3 gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: colors.surface_color, border: `1px solid rgba(255,255,255,0.05)` }}>
                <div className="aspect-square" style={{ background: `${p}10` }} />
                <div className="p-2 space-y-1.5">
                  <div className="h-2 rounded" style={{ background: `${p}40`, width: '60%' }} />
                  <div className="h-1.5 rounded bg-white/10" />
                  <div className="h-5 rounded" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
