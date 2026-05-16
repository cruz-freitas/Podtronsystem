'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user?.role === 'super_admin') router.replace('/super-admin/dashboard')
    else if (user) router.replace('/admin/dashboard')
    else router.replace('/auth/login')
  }, [user, loading])

  return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )
}
