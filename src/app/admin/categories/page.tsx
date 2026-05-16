'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { categoriesService } from '@/services/companies'
import type { Category } from '@/types'
import { slugify } from '@/lib/utils'
import { Plus, Edit, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'

const defaultForm = { name: '', slug: '', description: '', icon: '', color: '#6366f1', is_active: true }

export default function CategoriesPage() {
  const { company } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!company?.id) return
    load()
  }, [company?.id])

  async function load() {
    setLoading(true)
    const { data } = await categoriesService.getAll(company!.id)
    if (data) setCategories(data)
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', color: cat.color || '#6366f1', is_active: cat.is_active })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      const { error } = await categoriesService.update(editing.id, form)
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return }
      toast.success('Categoria atualizada!')
    } else {
      const { error } = await categoriesService.create({ ...form, company_id: company!.id })
      if (error) { toast.error('Erro ao criar: ' + error); setSaving(false); return }
      toast.success('Categoria criada!')
    }
    setShowForm(false)
    load()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta categoria?')) return
    const { error } = await categoriesService.delete(id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Categoria excluída')
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function toggleActive(cat: Category) {
    await categoriesService.update(cat.id, { is_active: !cat.is_active })
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Categorias</h1>
          <p className="text-zinc-400 text-sm mt-1">{categories.length} categorias cadastradas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                required placeholder="Ex: Pods Descartáveis"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Slug *</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                required placeholder="pods-descartaveis"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Ícone (Lucide)</label>
              <input
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="Ex: Zap, Package, Tag"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cor</label>
              <div className="flex gap-2">
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-zinc-700 bg-transparent cursor-pointer" />
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descrição</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Tag className="w-4 h-4" />}
              {editing ? 'Salvar' : 'Criar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Tag className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800/30">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '20', border: `1px solid ${cat.color}30` }}>
                  <Tag className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{cat.name}</div>
                  <div className="text-xs text-zinc-500">/{cat.slug}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                  {cat.is_active ? 'Ativa' : 'Inativa'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleActive(cat)} className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    {cat.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
