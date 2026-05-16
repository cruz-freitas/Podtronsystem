'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { cn, getInitials } from '@/lib/utils'
import { LayoutDashboard, Building2, Users, Settings, LogOut, Shield, ChevronRight, Zap } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Empresas', href: '/super-admin/companies', icon: Building2 },
  { label: 'Usuários', href: '/super-admin/users', icon: Users },
  { label: 'Configurações', href: '/super-admin/settings', icon: Settings },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/auth/login')
    else if (user.role !== 'super_admin') router.replace('/admin/dashboard')
  }, [user, loading])

  if (loading) return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  )

  if (!user || user.role !== 'super_admin') return null

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <aside className="w-64 h-full bg-zinc-950 border-r border-zinc-800/50 flex flex-col">
        <div className="p-5 border-b border-zinc-800/50">
          <Link href="/super-admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Poditron</div>
              <div className="text-purple-400 text-xs font-medium">Super Admin</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50')}>
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-purple-400" />}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all">
            <Zap className="w-4 h-4 text-indigo-400" /><span>Painel Admin</span>
          </Link>
        </div>
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.full_name ? getInitials(user.full_name) : 'SA'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.full_name || 'Super Admin'}</div>
              <div className="text-purple-400 text-[10px]">Super Admin</div>
            </div>
            <button onClick={signOut} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-zinc-500">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-[#0d0d0d]">{children}</main>
    </div>
  )
}
