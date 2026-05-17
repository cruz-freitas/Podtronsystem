'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AdminSidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading])

  if (loading) return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  if (!user) return null

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <AdminSidebar />
      {/* offset mobile = altura da topbar (56px) + notch iOS (safe-area-inset-top) */}
      <main className="flex-1 overflow-y-auto bg-[#0d0d0d] pt-topbar lg:pt-0">
        {children}
      </main>
    </div>
  )
}
