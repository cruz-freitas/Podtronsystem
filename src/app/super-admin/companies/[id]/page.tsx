'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  ArrowLeft, Building2, Package, Users, ExternalLink,
  CheckCircle, XCircle, Edit, Save, X, Tag, Warehouse
} from 'lucide-react'
import { toast } from 'sonner'

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [stats, setStats] = useState({ products: 0, users: 0, categories: 0, outOfStock: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', plan: 'basic', is_active: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').eq('id', id).single()
    if (!data) { router.push('/super-admin/companies'); return }
    setCompany(data as Company)
    setForm({ name: data.name, email: data.email || '', whatsapp: data.whatsapp || '', plan: data.plan, is_active: data.is_active })

    const [products, users, categories, outOfStock] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('company_id', id).eq('stock_quantity', 0),
    ])
    setStats({
      products: products.count || 0,
      users: users.count || 0,
      categories: categories.count || 0,
      outOfStock: outOfStock.count || 0,
    })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('companies').update(form).eq('id', id)
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return }
    toast.success('Empresa atualizada!')
    setCompany(prev => prev ? { ...prev, ...form } : null)
    setEditing(false)
    setSaving(false)
  }

  async function toggleActive() {
    const newStatus = !company?.is_active
    await supabase.from('companies').update({ is_active: newStatus }).eq('id', id)
    setCompany(prev => prev ? { ...prev, is_active: newStatus } : null)
    setForm(f => ({ ...f, is_active: newStatus }))
    toast.success(newStatus ? 'Empresa ativada' : 'Empresa desativada')
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    )
  }

  if (!company) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/super-admin/companies')}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{company.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded font-mono">/catalog/{company.slug}</code>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${company.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
              {company.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/catalog/${company.slug}`} target="_blank"
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition-colors">
            <ExternalLink className="w-4 h-4" /> Ver Catálogo
          </a>
          <button onClick={toggleActive}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${company.is_active ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
            {company.is_active ? <><XCircle className="w-4 h-4" /> Desativar</> : <><CheckCircle className="w-4 h-4" /> Ativar</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Produtos', value: stats.products, icon: Package, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-indigo-600/10', border: 'border-indigo-500/20' },
          { label: 'Categorias', value: stats.categories, icon: Tag, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20' },
          { label: 'Usuários', value: stats.users, icon: Users, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20' },
          { label: 'Sem Estoque', value: stats.outOfStock, icon: Warehouse, color: 'text-red-400', bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/20' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4`}>
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-zinc-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Company Info */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" /> Informações da Empresa
          </h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
              <button onClick={() => setEditing(false)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nome', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'WhatsApp', key: 'whatsapp', type: 'text' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs text-zinc-500 mb-1">{field.label}</label>
              {editing ? (
                <input type={field.type} value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              ) : (
                <div className="text-sm text-white">{(company as any)[field.key] || '—'}</div>
              )}
            </div>
          ))}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Plano</label>
            {editing ? (
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            ) : (
              <div className="text-sm text-white capitalize">{company.plan}</div>
            )}
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Criada em</label>
            <div className="text-sm text-white">{formatDate(company.created_at)}</div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">ID</label>
            <div className="text-xs text-zinc-500 font-mono truncate">{company.id}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
