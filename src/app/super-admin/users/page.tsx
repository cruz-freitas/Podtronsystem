'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, getInitials } from '@/lib/utils'
import { Users, Search, Building2, Shield, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

interface UserWithCompany {
  id: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  company: { name: string; slug: string } | null
}

const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  company_admin: { label: 'Admin', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  seller: { label: 'Vendedor', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserWithCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*, company:companies(name, slug)')
      .order('created_at', { ascending: false })
    if (data) setUsers(data as any)
    setLoading(false)
  }

  async function toggleActive(u: UserWithCompany) {
    await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id)
    setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_active: !item.is_active } : item))
    toast.success(u.is_active ? 'Usuário desativado' : 'Usuário ativado')
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Todos os Usuários</h1>
        <p className="text-zinc-400 text-sm mt-1">{users.length} usuários no sistema</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" placeholder="Buscar usuário ou empresa..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800/30">
            {filtered.map(u => {
              const roleConfig = roleLabels[u.role] || roleLabels.seller
              return (
                <div key={u.id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.full_name ? getInitials(u.full_name) : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{u.full_name || 'Sem nome'}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {u.company
                        ? <><Building2 className="w-3 h-3 text-zinc-600" /><span className="text-xs text-zinc-500">{u.company.name}</span></>
                        : <span className="text-xs text-zinc-600">Sem empresa</span>
                      }
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border hidden sm:inline ${roleConfig.color}`}>
                    {roleConfig.label}
                  </span>
                  <span className="text-xs text-zinc-500 hidden md:inline">{formatDate(u.created_at)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${u.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                    {u.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleActive(u)}
                      className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                      {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
