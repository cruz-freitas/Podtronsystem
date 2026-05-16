'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { bannersService } from '@/services/companies'
import type { Banner } from '@/types'
import { Plus, Edit, Trash2, Image as ImageIcon, ToggleLeft, ToggleRight, GripVertical, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const defaultForm = { title: '', subtitle: '', image_url: '', link_url: '', link_text: '', is_active: true, sort_order: 0 }

export default function BannersPage() {
  const { company } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!company?.id) return
    load()
    return () => { mountedRef.current = false }
  }, [company?.id])

  async function load() {
    setLoading(true)
    const { data } = await bannersService.getAll(company!.id)
    if (mountedRef.current && data) setBanners(data)
    if (mountedRef.current) setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ ...defaultForm, sort_order: banners.length })
    setShowForm(true)
  }

  function openEdit(b: Banner) {
    setEditing(b)
    setForm({ title: b.title || '', subtitle: b.subtitle || '', image_url: b.image_url, link_url: b.link_url || '', link_text: b.link_text || '', is_active: b.is_active, sort_order: b.sort_order })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.image_url) { toast.error('URL da imagem é obrigatória'); return }
    setSaving(true)
    const payload = { ...form, company_id: company!.id }
    if (editing) {
      const { error } = await bannersService.update(editing.id, form)
      if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
      toast.success('Banner atualizado!')
    } else {
      const { error } = await bannersService.create(payload)
      if (error) { toast.error('Erro ao criar'); setSaving(false); return }
      toast.success('Banner criado!')
    }
    setShowForm(false)
    setEditing(null)
    load()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este banner?')) return
    const { error } = await bannersService.delete(id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Banner excluído')
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  async function toggleActive(b: Banner) {
    await bannersService.update(b.id, { is_active: !b.is_active })
    setBanners(prev => prev.map(item => item.id === b.id ? { ...item, is_active: !item.is_active } : item))
    toast.success(b.is_active ? 'Banner desativado' : 'Banner ativado')
  }

  const inputClass = "w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Banners</h1>
          <p className="text-zinc-400 text-sm mt-1">Banners exibidos no topo do catálogo</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">{editing ? 'Editar Banner' : 'Novo Banner'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">URL da Imagem *</label>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} required
                placeholder="https://exemplo.com/banner.jpg" className={inputClass} />
              {form.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-zinc-700" style={{ height: 120 }}>
                  <img src={form.image_url} alt="preview" className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none' }} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Título</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do banner" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Subtítulo</label>
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Subtítulo" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Link (URL)</label>
              <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Texto do Botão</label>
              <input value={form.link_text} onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))} placeholder="Ex: Ver Produtos" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Ordem</label>
              <input type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className={inputClass} />
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
              <span className="text-sm text-zinc-300 flex-1">Ativo</span>
              <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {editing ? 'Salvar' : 'Criar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-900/50 animate-pulse" />)}</div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
          <ImageIcon className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">Nenhum banner cadastrado</p>
          <button onClick={openNew} className="mt-4 text-indigo-400 text-sm hover:text-indigo-300">+ Criar primeiro banner</button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-3 group hover:border-zinc-700/50 transition-all">
              <GripVertical className="w-4 h-4 text-zinc-700 flex-shrink-0" />
              <div className="w-28 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700">
                <img src={b.image_url} alt={b.title || ''} className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{b.title || 'Sem título'}</div>
                {b.subtitle && <div className="text-xs text-zinc-500 truncate">{b.subtitle}</div>}
                {b.link_url && (
                  <a href={b.link_url} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" /> {b.link_url}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border mr-2 ${b.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                  {b.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <button onClick={() => toggleActive(b)} className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Ativar/Desativar">
                  {b.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
