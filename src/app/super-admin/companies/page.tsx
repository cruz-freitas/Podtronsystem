'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  Building2, Plus, Search, ExternalLink,
  CheckCircle, XCircle, Trash2, BarChart3,
  Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCompanies(data as Company[])
    setLoading(false)
  }

  async function toggleActive(company: Company) {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: !company.is_active })
      .eq('id', company.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success(company.is_active ? 'Empresa desativada' : 'Empresa ativada')
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_active: !c.is_active } : c))
  }

  async function deleteCompany(company: Company) {
    if (!confirm(`Tem certeza que deseja excluir "${company.name}"? Todos os dados serão perdidos.`)) return
    const { error } = await supabase.from('companies').delete().eq('id', company.id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Empresa excluída')
    setCompanies(prev => prev.filter(c => c.id !== company.id))
  }

  function copySlug(company: Company) {
    const url = `${window.location.origin}/catalog/${company.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(company.id)
    toast.success('Link copiado!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function changePlan(company: Company, plan: string) {
    await supabase.from('companies').update({ plan }).eq('id', company.id)
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, plan } : c))
    toast.success('Plano atualizado')
  }

  const filtered = companies.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase())
  )

  const planColors: Record<string, string> = {
    basic: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    pro: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    premium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas</h1>
          <p className="text-zinc-400 text-sm mt-1">{companies.length} empresas cadastradas</p>
        </div>
        <a
          href="/super-admin/companies/new"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </a>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">Nenhuma empresa encontrada</p>
          <a href="/super-admin/companies/new" className="mt-3 text-purple-400 text-sm hover:text-purple-300">
            Criar nova empresa →
          </a>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Empresa</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Link do Catálogo</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Plano</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Criada em</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {filtered.map(company => (
                <tr key={company.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {company.logo_url
                          ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                          : <Building2 className="w-4 h-4 text-purple-400" />
                        }
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{company.name}</div>
                        {company.email && <div className="text-xs text-zinc-500">{company.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-mono">
                        /catalog/{company.slug}
                      </code>
                      <button
                        onClick={() => copySlug(company)}
                        className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        {copiedId === company.id
                          ? <Check className="w-3 h-3 text-emerald-400" />
                          : <Copy className="w-3 h-3" />
                        }
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <select
                      value={company.plan}
                      onChange={e => changePlan(company, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border bg-transparent cursor-pointer focus:outline-none ${planColors[company.plan] || planColors.basic}`}
                    >
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-zinc-500">{formatDate(company.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      company.is_active
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {company.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`/catalog/${company.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Ver catálogo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => toggleActive(company)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          company.is_active
                            ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={company.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {company.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`/super-admin/companies/${company.id}`}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                        title="Detalhes"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteCompany(company)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
