'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Promotion } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, Percent, Trash2, ToggleLeft, ToggleRight, Tag, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const defaultForm = {
  name: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 0, is_active: true, highlight_color: '#ef4444',
  start_date: '', end_date: '',
}

export default function PromotionsPage() {
  const { company } = useAuth()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('company_id', company!.id)
      .order('created_at', { ascending: false })
    if (mountedRef.current) {
      if (data) setPromotions(data as Promotion[])
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error('Nome é obrigatório'); return }
    if (!form.discount_value || form.discount_value <= 0) { toast.error('Valor do desconto deve ser maior que zero'); return }
    setSaving(true)
    const payload = {
      ...form,
      company_id: company!.id,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    const { error } = await supabase.from('promotions').insert(payload)
    if (error) {
      toast.error('Erro ao criar promoção: ' + error.message)
    } else {
      toast.success('Promoção criada!')
      setShowForm(false)
      setForm(defaultForm)
      load()
    }
    setSaving(false)
  }

  async function toggleActive(p: Promotion) {
    const { error } = await supabase.from('promotions').update({ is_active: !p.is_active }).eq('id', p.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setPromotions(prev => prev.map(item => item.id === p.id ? { ...item, is_active: !item.is_active } : item))
    toast.success(p.is_active ? 'Promoção desativada' : 'Promoção ativada')
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta promoção?')) return
    const { error } = await supabase.from('promotions').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Promoção excluída')
    setPromotions(prev => prev.filter(p => p.id !== id))
  }

  const inputClass = "w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Promoções</h1>
          <p className="text-zinc-400 text-sm mt-1">{promotions.length} promoções cadastradas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> Nova Promoção
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Nova Promoção</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                placeholder="Ex: Semana do Vape" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo de Desconto</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}
                className={inputClass}>
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Valor * {form.discount_type === 'percentage' ? '(%)' : '(R$)'}
              </label>
              <input type="number" min="0.01" step="0.01" value={form.discount_value || ''}
                onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                required placeholder={form.discount_type === 'percentage' ? 'Ex: 20' : 'Ex: 10.00'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Data de Início</label>
              <input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Data de Fim</label>
              <input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cor de Destaque</label>
              <div className="flex gap-2">
                <input type="color" value={form.highlight_color} onChange={e => setForm(f => ({ ...f, highlight_color: e.target.value }))}
                  className="w-11 h-10 rounded-xl border border-zinc-700 bg-transparent cursor-pointer p-1" />
                <input value={form.highlight_color} onChange={e => setForm(f => ({ ...f, highlight_color: e.target.value }))}
                  className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Status</label>
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl h-10">
                <span className="text-sm text-zinc-300 flex-1">Promoção ativa</span>
                <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                  <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Percent className="w-4 h-4" />}
              Criar Promoção
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm) }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-zinc-900/50 animate-pulse" />)}</div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
          <Percent className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">Nenhuma promoção cadastrada</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-indigo-400 text-sm hover:text-indigo-300">+ Criar primeira promoção</button>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800/30">
            {promotions.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors group">
                <div className="w-3 h-8 rounded-full flex-shrink-0" style={{ background: p.highlight_color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                    <Tag className="w-3 h-3" />
                    {p.discount_type === 'percentage' ? `${p.discount_value}% de desconto` : `R$ ${p.discount_value} de desconto`}
                    {p.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> até {formatDate(p.end_date)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${p.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                  {p.is_active ? 'Ativa' : 'Inativa'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleActive(p)} className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    {p.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
