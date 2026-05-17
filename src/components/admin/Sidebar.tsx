'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { cn, getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Package, Tag, Warehouse, Percent,
  Palette, Settings, MessageSquare, Users, LogOut,
  Zap, ChevronRight, Store, Menu, X, Image
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Produtos', href: '/admin/products', icon: Package },
  { label: 'Categorias', href: '/admin/categories', icon: Tag },
  { label: 'Estoque', href: '/admin/inventory', icon: Warehouse },
  { label: 'Promoções', href: '/admin/promotions', icon: Percent },
  { label: 'Aparência', href: '/admin/appearance', icon: Palette },
  { label: 'Usuários', href: '/admin/users', icon: Users },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user, company, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Poditron</div>
            <div className="text-zinc-500 text-[10px] mt-0.5">Admin Panel</div>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Company */}
      {company && (
        <div className="px-3 py-2.5 border-b border-zinc-800/50">
          <Link href={`/catalog/${company.slug}`} target="_blank"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 transition-colors group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Store className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{company.name}</div>
              <div className="text-zinc-500 text-[10px]">Ver catálogo ↗</div>
            </div>
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 active:bg-zinc-800'
              )}>
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-zinc-500')} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-2.5 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.full_name ? getInitials(user.full_name) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.full_name || 'Usuário'}</div>
            <div className="text-zinc-500 text-[10px] capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={signOut} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-zinc-500" title="Sair">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 h-full bg-zinc-950 border-r border-zinc-800/50 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar — header-safe adiciona padding-top = safe-area-inset-top (notch iOS no PWA) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex flex-col bg-zinc-950 border-b border-zinc-800/50 header-safe">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm">{company?.name || 'Poditron'}</span>
          </Link>
          <button onClick={() => setOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:bg-zinc-800 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800/50 flex flex-col animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slideIn 0.22s ease-out; }
      `}</style>
    </>
  )
}
