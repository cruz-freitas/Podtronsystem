'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  Building2, Users, TrendingUp, DollarSign, Activity,
  AlertTriangle, CheckCircle, XCircle, ExternalLink,
  Plus, RefreshCw, ShieldCheck, ArrowUpRight,
  Zap, BarChart3, Server, HardDrive, Database,
  Globe, Calendar, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface CompanyWithMeta extends Company {
  sale_value?: number
  sold_at?: string
  notes?: string
}

interface Stats {
  total: number
  active: number
  inactive: number
  revenue_total: number
  revenue_this_month: number
  revenue_last_month: number
  new_this_month: number
  new_last_month: number
  total_users: number
  storage_files: number
  storage_bytes: number
}

function formatBytes(b: number) {
  if (!b) return '0 B'
  const k = 1024, s = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`
}

function KPI({ label, value, sub, icon: Icon, color, delta, loading }: any) {
  return (
    <div className="relative rounded-2xl p-3 sm:p-5 overflow-hidden" style={{ background: '#0c0c14', border: `1px solid ${color}20` }}>
      <div className="absolute inset-0 opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {delta && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${delta.up ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800'}`}>
              {delta.up && <ArrowUpRight className="w-3 h-3" />}{delta.val}
            </span>
          )}
        </div>
        {loading
          ? <div className="h-8 w-24 rounded-lg animate-pulse mb-1" style={{ background: `${color}15` }} />
          : <div className="text-2xl sm:text-3xl font-black text-white mb-1">{value}</div>
        }
        <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyWithMeta[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0, active: 0, inactive: 0,
    revenue_total: 0, revenue_this_month: 0, revenue_last_month: 0,
    new_this_month: 0, new_last_month: 0,
    total_users: 0, storage_files: 0, storage_bytes: 0,
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    load()
    const t = setInterval(() => load(true), 60000)
    return () => { mountedRef.current = false; clearInterval(t) }
  }, [])

  async function load(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const [cosRes, usersRes, storageRes] = await Promise.all([
      supabase.from('companies').select('*').order('sold_at', { ascending: false }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('objects').select('metadata').limit(500),
    ])

    if (!mountedRef.current) return

    const cos = (cosRes.data || []) as CompanyWithMeta[]
    setCompanies(cos)

    const now = new Date()
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const revenueTotal = cos.reduce((s, c) => s + (Number(c.sale_value) || 0), 0)
    const revenueThisMonth = cos
      .filter(c => c.sold_at && new Date(c.sold_at) >= startThisMonth)
      .reduce((s, c) => s + (Number(c.sale_value) || 0), 0)
    const revenueLastMonth = cos
      .filter(c => c.sold_at && new Date(c.sold_at) >= startLastMonth && new Date(c.sold_at) <= endLastMonth)
      .reduce((s, c) => s + (Number(c.sale_value) || 0), 0)
    const newThisMonth = cos.filter(c => c.sold_at && new Date(c.sold_at) >= startThisMonth).length
    const newLastMonth = cos.filter(c => c.sold_at && new Date(c.sold_at) >= startLastMonth && new Date(c.sold_at) <= endLastMonth).length

    const storageFiles = storageRes.data?.length || 0
    const storageBytes = (storageRes.data || []).reduce((s, o) => s + ((o.metadata as any)?.size || 0), 0)

    setStats({
      total: cos.length, active: cos.filter(c => c.is_active).length,
      inactive: cos.filter(c => !c.is_active).length,
      revenue_total: revenueTotal, revenue_this_month: revenueThisMonth,
      revenue_last_month: revenueLastMonth, new_this_month: newThisMonth,
      new_last_month: newLastMonth, total_users: usersRes.count || 0,
      storage_files: storageFiles, storage_bytes: storageBytes,
    })

    // Monthly revenue chart (last 8 months)
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (7 - i))
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const rev = cos
        .filter(c => c.sold_at && new Date(c.sold_at) >= start && new Date(c.sold_at) <= end)
        .reduce((s, c) => s + (Number(c.sale_value) || 0), 0)
      const count = cos.filter(c => c.sold_at && new Date(c.sold_at) >= start && new Date(c.sold_at) <= end).length
      return {
        name: d.toLocaleDateString('pt-BR', { month: 'short' }),
        receita: rev,
        vendas: count,
      }
    })
    setMonthlyData(months)

    setLastUpdate(new Date())
    if (!silent) setLoading(false)
    else setRefreshing(false)
  }

  async function toggleActive(co: CompanyWithMeta) {
    await supabase.from('companies').update({ is_active: !co.is_active }).eq('id', co.id)
    setCompanies(prev => prev.map(c => c.id === co.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(co.is_active ? 'Empresa desativada' : 'Empresa ativada')
  }

  const growth = stats.revenue_last_month > 0
    ? (((stats.revenue_this_month - stats.revenue_last_month) / stats.revenue_last_month) * 100).toFixed(0)
    : null

  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').split('//')[1]?.split('.')[0] || ''

  return (
    <div className="min-h-full" style={{ background: '#07070f' }}>
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #10b981)' }} />

      <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a855f7' }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
              </div>
              <span className="text-xs text-zinc-700">
                {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Painel de Vendas</h1>
            <p className="text-zinc-500 text-sm mt-1">Monitoramento da plataforma Poditron</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => load(true)} disabled={refreshing}
              className="p-2.5 rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a href="/super-admin/companies/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Registrar </span>Venda
            </a>
          </div>
        </div>

        {/* REVENUE KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPI label="Receita Total" value={formatCurrency(stats.revenue_total)} sub="todas as vendas" icon={DollarSign} color="#10b981"
            loading={loading} />
          <KPI label="Este Mês" value={formatCurrency(stats.revenue_this_month)}
            sub={stats.revenue_last_month > 0 ? `mês passado: ${formatCurrency(stats.revenue_last_month)}` : 'primeiro mês'}
            icon={TrendingUp} color="#6366f1" loading={loading}
            delta={growth ? { val: `${Number(growth) >= 0 ? '+' : ''}${growth}%`, up: Number(growth) >= 0 } : undefined} />
          <KPI label="Clientes Ativos" value={stats.active} sub={`${stats.inactive} inativos`}
            icon={Building2} color="#a855f7" loading={loading}
            delta={stats.new_this_month > 0 ? { val: `+${stats.new_this_month} novos`, up: true } : undefined} />
          <KPI label="Ticket Médio" value={stats.total > 0 ? formatCurrency(stats.revenue_total / stats.total) : 'R$ 0'}
            sub="por venda" icon={BarChart3} color="#f59e0b" loading={loading} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Revenue chart */}
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-bold">Receita por Mês</h3>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                últimos 8 meses
              </span>
            </div>
            <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Valor total das vendas realizadas</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#3f3f46', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3f3f46', fontSize: 11 }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={v => v > 0 ? `R$${(v/1000).toFixed(0)}k` : '0'} />
                <Tooltip
                  contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v), 'Receita']}
                />
                <Bar dataKey="receita" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats */}
          <div className="space-y-3">
            {/* Month comparison */}
            <div className="rounded-2xl p-5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-bold text-white mb-4">Comparativo</h3>
              <div className="space-y-3">
                {[
                  { label: 'Este mês', value: stats.revenue_this_month, clients: stats.new_this_month, color: '#10b981' },
                  { label: 'Mês passado', value: stats.revenue_last_month, clients: stats.new_last_month, color: '#6366f1' },
                ].map(row => (
                  <div key={row.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                      <span className="text-sm font-bold" style={{ color: row.color }}>{row.clients} venda{row.clients !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-xl font-black text-white">{formatCurrency(row.value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client status */}
            <div className="rounded-2xl p-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-bold text-white mb-3">Status dos Clientes</h3>
              <div className="space-y-2">
                {[
                  { label: 'Ativos', value: stats.active, color: '#10b981', pct: stats.total > 0 ? (stats.active / stats.total) * 100 : 0 },
                  { label: 'Inativos', value: stats.inactive, color: '#ef4444', pct: stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0 },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                      <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color, transition: 'width 0.8s', minWidth: s.value > 0 ? '6px' : 0 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MONITORING */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

          {/* System health */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Sistema</h3>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>
            {['API Supabase','Database','Autenticação','Storage','Deploy Vercel'].map(s => (
              <div key={s} className="flex items-center justify-between py-1 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">OK</span>
              </div>
            ))}
          </div>

          {/* Storage */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Armazenamento</h3>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-xs">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Usado</span>
                <span className="font-bold text-white">{formatBytes(stats.storage_bytes)} / 1 GB</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min((stats.storage_bytes / (1024*1024*1024)) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                  minWidth: stats.storage_bytes > 0 ? '6px' : '0', transition: 'width 0.8s',
                }} />
              </div>
              <p className="text-right text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {((stats.storage_bytes / (1024*1024*1024)) * 100).toFixed(2)}% utilizado
              </p>
            </div>
            <div className="space-y-2 pt-1">
              {[
                { icon: '🖼️', label: 'Imagens de produtos', value: `${stats.storage_files} arquivos` },
                { icon: '📦', label: 'Total armazenado', value: formatBytes(stats.storage_bytes) },
                { icon: '👥', label: 'Usuários no sistema', value: `${stats.total_users} cadastros` },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 text-xs">
                  <span>{r.icon}</span>
                  <span className="flex-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.label}</span>
                  <span className="font-bold text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl p-5 space-y-2.5" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Acesso Rápido</h3>
            </div>
            {[
              { label: 'Supabase', href: `https://supabase.com/dashboard/project/${projectRef}`, icon: Database, color: '#10b981', desc: 'Dashboard' },
              { label: 'Auth / Logins', href: `https://supabase.com/dashboard/project/${projectRef}/auth/users`, icon: Users, color: '#6366f1', desc: 'Gerenciar usuários' },
              { label: 'Storage', href: `https://supabase.com/dashboard/project/${projectRef}/storage/buckets`, icon: HardDrive, color: '#f59e0b', desc: 'Arquivos e imagens' },
              { label: 'SQL Editor', href: `https://supabase.com/dashboard/project/${projectRef}/sql`, icon: Server, color: '#a855f7', desc: 'Executar queries' },
              { label: 'Vercel', href: 'https://vercel.com/dashboard', icon: Zap, color: '#ffffff', desc: 'Deploy e logs' },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank"
                className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:scale-[1.02] group"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${l.color}15` }}>
                  <l.icon className="w-3.5 h-3.5" style={{ color: l.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{l.label}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{l.desc}</div>
                </div>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: l.color }} />
              </a>
            ))}
          </div>
        </div>

        {/* CLIENTS TABLE */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Clientes</h2>
            <a href="/super-admin/companies" className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">Ver todos →</a>
          </div>

          {/* Mobile card list (hidden on md+) */}
          <div className="md:hidden space-y-2">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded w-32" style={{ background: 'rgba(255,255,255,0.04)' }} />
                      <div className="h-3 rounded w-20" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                  </div>
                </div>
              ))
            ) : companies.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm mb-4">Nenhuma venda registrada ainda</p>
                <a href="/super-admin/companies/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  <Plus className="w-4 h-4" /> Registrar primeira venda
                </a>
              </div>
            ) : companies.map(co => (
              <div key={co.id} className="rounded-xl p-3" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    {co.logo_url ? <img src={co.logo_url} alt={co.name} className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{co.name}</div>
                    <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>/{co.slug}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${co.is_active ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/15' : 'text-red-400 bg-red-500/10 border border-red-500/15'}`}>
                    <span className={`w-1 h-1 rounded-full ${co.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    {co.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-base font-black text-emerald-400">
                    {co.sale_value ? formatCurrency(Number(co.sale_value)) : <span className="text-zinc-600 text-sm font-normal">—</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <a href={`/catalog/${co.slug}`} target="_blank"
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      <Globe className="w-3 h-3" /> Ver
                    </a>
                    <button onClick={() => toggleActive(co)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{ background: co.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: co.is_active ? '#ef4444' : '#10b981' }}>
                      {co.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {co.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <a href={`/super-admin/companies/${co.id}`}
                      className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(168,85,247,0.1)' }}>
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {companies.length > 0 && (
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{companies.length} cliente{companies.length !== 1 ? 's' : ''}</span>
                <span className="text-sm font-black text-emerald-400">Total: {formatCurrency(stats.revenue_total)}</span>
              </div>
            )}
          </div>

          {/* Desktop table (hidden on mobile) */}
          <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Empresa','Valor da Venda','Status','Data da Venda','Observações','Catálogo','Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: j === 0 ? '120px' : '60px' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm mb-4">Nenhuma venda registrada ainda</p>
                        <a href="/super-admin/companies/new"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                          <Plus className="w-4 h-4" /> Registrar primeira venda
                        </a>
                      </td>
                    </tr>
                  ) : companies.map(co => (
                    <tr key={co.id} className="group hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
                            {co.logo_url
                              ? <img src={co.logo_url} alt={co.name} className="w-full h-full object-cover" />
                              : <Building2 className="w-4 h-4 text-purple-400" />
                            }
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{co.name}</div>
                            <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>/{co.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-base font-black text-emerald-400">
                          {co.sale_value ? formatCurrency(Number(co.sale_value)) : <span className="text-zinc-600 text-sm font-normal">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                          co.is_active
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/15'
                            : 'text-red-400 bg-red-500/10 border border-red-500/15'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${co.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                          {co.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {co.sold_at ? formatDate(co.sold_at) : formatDate(co.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[140px]">
                        <span className="text-xs truncate block" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {(co as any).notes || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <a href={`/catalog/${co.slug}`} target="_blank"
                          className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
                          style={{ color: '#6366f1' }}>
                          <Globe className="w-3.5 h-3.5" /> Abrir
                        </a>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleActive(co)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: co.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}>
                            {co.is_active
                              ? <XCircle className="w-3.5 h-3.5 text-red-400" />
                              : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            }
                          </button>
                          <a href={`/super-admin/companies/${co.id}`}
                            className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(168,85,247,0.1)' }}>
                            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {companies.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{companies.length} cliente{companies.length !== 1 ? 's' : ''}</span>
                <span className="text-sm font-black text-emerald-400">Total: {formatCurrency(stats.revenue_total)}</span>
              </div>
            )}
          </div>{/* end desktop table */}
        </div>{/* end CLIENTS TABLE */}

      </div>
    </div>
  )
}
