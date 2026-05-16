'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import { Users, Shield, UserCheck, UserX, Mail } from 'lucide-react'
import { toast } from 'sonner'

const roleLabels = {
  super_admin: { label: 'Super Admin', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  company_admin: { label: 'Admin', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  seller: { label: 'Vendedor', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

export default function UsersPage() {
  const { company, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'company_admin' | 'seller'>('seller')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!company?.id) return
    load()
  }, [company?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', company!.id)
      .order('created_at')
    if (data) setUsers(data as User[])
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    // Create auth user via Supabase Admin (requires service key in production)
    // For now, show instructions
    toast.info('Para convidar usuários, crie-os em Supabase > Authentication > Users e vincule ao company_id.')
    setShowInvite(false)
    setSaving(false)
  }

  async function toggleActive(u: User) {
    await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id)
    setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_active: !item.is_active } : item))
    toast.success(u.is_active ? 'Usuário desativado' : 'Usuário ativado')
  }

  async function changeRole(u: User, role: User['role']) {
    await supabase.from('users').update({ role }).eq('id', u.id)
    setUsers(prev => prev.map(item => item.id === u.id ? { ...item, role } : item))
    toast.success('Permissão atualizada')
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Usuários</h1>
          <p className="text-zinc-400 text-sm mt-1">{users.length} usuário(s) nesta empresa</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <Mail className="w-4 h-4" /> Convidar Usuário
        </button>
      </div>

      {showInvite && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Como adicionar usuários</h3>
          <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
            <li>Acesse <span className="text-indigo-400">supabase.com</span> → seu projeto → <strong className="text-white">Authentication → Users</strong></li>
            <li>Clique em <strong className="text-white">Add User → Create new user</strong></li>
            <li>Informe email e senha do novo usuário</li>
            <li>Copie o UUID gerado e rode no <strong className="text-white">SQL Editor</strong>:</li>
          </ol>
          <div className="bg-zinc-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
            {`INSERT INTO users (id, company_id, full_name, role, is_active)\nVALUES (\n  'UUID_DO_USUARIO',\n  '${company?.id}',\n  'Nome do Usuário',\n  'seller', -- ou 'company_admin'\n  true\n);`}
          </div>
          <button onClick={() => setShowInvite(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition-colors">
            Fechar
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800/30">
            {users.map(u => {
              const roleConfig = roleLabels[u.role] || roleLabels.seller
              const isMe = u.id === currentUser?.id
              return (
                <div key={u.id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.full_name ? getInitials(u.full_name) : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {u.full_name || 'Sem nome'}
                      {isMe && <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">você</span>}
                    </div>
                    <div className="text-xs text-zinc-500">{formatDate(u.created_at)}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${roleConfig.color}`}>
                    {roleConfig.label}
                  </span>
                  {!isMe && (
                    <div className="flex items-center gap-2">
                      <select value={u.role} onChange={e => changeRole(u, e.target.value as User['role'])}
                        className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors">
                        <option value="seller">Vendedor</option>
                        <option value="company_admin">Admin</option>
                      </select>
                      <button onClick={() => toggleActive(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                        title={u.is_active ? 'Desativar' : 'Ativar'}>
                        {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
