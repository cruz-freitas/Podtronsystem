'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User, Company } from '@/types'

interface AuthContextType {
  session: Session | null
  user: User | null
  company: Company | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const fetchingRef = useRef(false)
  const initializedRef = useRef(false)

  async function fetchUser(userId: string) {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { data } = await supabase
        .from('users')
        .select('*, company:companies(*)')
        .eq('id', userId)
        .single()
      if (!mountedRef.current) return
      if (data) {
        const { company: co, ...userInfo } = data
        setUser(userInfo as User)
        setCompany(co as Company || null)
      } else {
        setUser(null)
        setCompany(null)
      }
    } catch {
      if (mountedRef.current) { setUser(null); setCompany(null) }
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    mountedRef.current = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return
      setSession(session)
      if (session?.user) await fetchUser(session.user.id)
      if (mountedRef.current) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return
      // Only handle explicit sign in/out - ignore TOKEN_REFRESHED to prevent loops
      if (event === 'SIGNED_OUT') {
        setSession(null); setUser(null); setCompany(null); setLoading(false)
      }
    })

    return () => { mountedRef.current = false; subscription.unsubscribe() }
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      setSession(data.session)
      if (data.user) await fetchUser(data.user.id)
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null); setCompany(null); setSession(null)
  }

  async function refreshUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await fetchUser(session.user.id)
  }

  return (
    <AuthContext.Provider value={{ session, user, company, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
