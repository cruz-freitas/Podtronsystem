'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { productsService } from '@/services/products'
import { categoriesService } from '@/services/companies'
import { supabase } from '@/lib/supabase'
import {
  Package, TrendingUp, AlertTriangle, Star, Tag,
  BarChart3, Warehouse, ExternalLink, Plus,
  ArrowUpRight, AlertCircle, ShoppingBag, Zap,
  Eye, Users, Percent
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const mockMonths = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const mockArea = mockMonths.slice(0, new Date().getMonth() + 1).map((m, i) => ({
  name: m, produtos: 10 + i * 2 + Math.floor(Math.random() * 5)
}))

export default function DashboardPage() {
  const { user, company } = useAuth()
  const [stats, setStats] = useState({
    total: 0, active: 0, featured: 0, outOfStock: 0,
    lowStock: 0, categories: 0, promotions: 0
  })
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!company?.id) return
    load()
    return () => { mountedRef.current = false }
  }, [company?.id])

  async function load() {
    setLoading(true)
    const [pStats, catRes, promoRes, lowRes, recentRes] = await Promise.all([
      productsService.getStats(company!.id),
      categoriesService.getAll(company!.id),
      supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('company_id', company!.id).eq('is_active', true),
      productsService.getLowStock(company!.id),
      productsService.getAll(company!.id, { isActive: undefined, limit: 5 }),
    ])
    if (!mountedRef.current) return
    setStats({
      ...pStats,
      categories: catRes.data?.length || 0,
      promotions: promoRes.count || 0,
    })
    if (lowRes.data) setLowStockItems(lowRes.data.slice(0, 5))
    if (recentRes.data) setRecentProducts(recentRes.data.slice(0, 5))
    setLoading(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = user?.full_name?.split(' ')[0] || 'Admin'

  const statCards = [
    { label: 'Total Produtos', value: stats.total, icon: Package, color: '#6366f1', trend: '+2 esta semana' },
    { label: 'Ativos', value: stats.active, icon: TrendingUp, color: '#10b981', trend: 'disponíveis' },
    { label: 'Em Destaque', value: stats.featured, icon: Star, color: '#f59e0b', trend: 'no catálogo' },
    { label: 'Sem Estoque', value: stats.outOfStock, icon: AlertTriangle, color: '#ef4444', trend: 'precisam reposição' },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertCircle, color: '#f97316', trend: 'atenção necessária' },
    { label: 'Categorias', value: stats.categories, icon: Tag, color: '#8b5cf6', trend: 'organizadas' },
    { label: 'Promoções', value: stats.promotions, icon: Percent, color: '#ec4899', trend: 'ativas agora' },
    { label: 'Visualizações', value: '—', icon: Eye, color: '#06b6d4', trend: 'em breve' },
  ]

  const quickActions = [
    { label: 'Novo Produto', icon: Plus, href: '/admin/products/new', color: '#6366f1' },
    { label: 'Ver Catálogo', icon: ExternalLink, href: `/catalog/${company?.slug}`, color: '#25D366', newTab: true },
    { label: 'Estoque', icon: Warehouse, href: '/admin/inventory', color: '#f59e0b' },
    { label: 'Promoções', icon: Percent, href: '/admin/promotions', color: '#ef4444' },
  ]

  return (
    <div className="min-h-full bg-[#0a0a0f]">
      {/* Top gradient bar */}
      <div className="h-1 w-full" style={{
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b)'
      }} />

      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Sistema ativo</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-zinc-400 mt-1">
              Painel de controle — <span className="text-white font-semibold">{company?.name}</span>
            </p>
          </div>
          <a href={`/catalog/${company?.slug}`} target="_blank"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
            <Zap className="w-4 h-4" /> Ver catálogo
          </a>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card, i) => (
            <div key={card.label}
              className="relative rounded-2xl p-4 overflow-hidden group hover:scale-[1.02] transition-all duration-200"
              style={{
                background: `${card.color}0d`,
                border: `1px solid ${card.color}25`,
              }}>
              {/* Glow */}
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20"
                style={{ background: card.color }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}20` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: card.color }} />
                </div>
                <div className="text-2xl font-black text-white mb-0.5">
                  {loading ? (
                    <div className="h-7 w-10 rounded-lg animate-pulse" style={{ background: `${card.color}20` }} />
                  ) : card.value}
                </div>
                <div className="text-xs font-semibold text-white/70">{card.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: `${card.color}80` }}>{card.trend}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MIDDLE ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart */}
          <div className="lg:col-span-2 rounded-2xl p-5"
            style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold">Crescimento de Produtos</h3>
                <p className="text-zinc-500 text-xs mt-0.5">{new Date().getFullYear()}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={mockArea}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="produtos" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#8b5cf6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Low stock */}
          <div className="rounded-2xl p-5"
            style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Alerta de Estoque</h3>
              <a href="/admin/inventory"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Ver tudo →
              </a>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white">Estoque em dia!</p>
                <p className="text-xs text-zinc-500 mt-1">Nenhum produto crítico</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map(p => {
                  const stock = p.has_variations && p.variations?.length
                    ? p.variations.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0)
                    : p.stock_quantity || 0
                  const isZero = stock === 0
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ background: isZero ? 'rgba(239,68,68,0.06)' : 'rgba(249,115,22,0.06)', border: `1px solid ${isZero ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)'}` }}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isZero ? 'bg-red-400' : 'bg-orange-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                        {p.brand && <p className="text-[10px] text-zinc-500">{p.brand}</p>}
                      </div>
                      <span className={`text-xs font-black flex-shrink-0 ${isZero ? 'text-red-400' : 'text-orange-400'}`}>
                        {stock} un.
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-1 gap-5">

          {/* Recent products */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h3 className="text-white font-bold">Produtos Recentes</h3>
              <a href="/admin/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Ver todos →</a>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Package className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Nenhum produto ainda</p>
                <a href="/admin/products/new" className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300">+ Cadastrar produto</a>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {recentProducts.map(p => {
                  const stock = p.has_variations && p.variations?.length
                    ? p.variations.reduce((s: number, v: any) => s + (v.stock_quantity || 0), 0)
                    : p.stock_quantity || 0
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {p.thumbnail_url || p.images?.[0]
                          ? <img src={p.thumbnail_url || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-zinc-700" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          {p.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500">{p.brand || 'Sem marca'} · {formatCurrency(p.price)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-bold ${stock === 0 ? 'text-red-400' : stock <= 5 ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {stock} un.
                        </div>
                        <div className={`text-[10px] ${p.is_active ? 'text-emerald-500' : 'text-zinc-600'}`}>
                          {p.is_active ? 'ativo' : 'inativo'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions + catalog link */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="rounded-2xl p-5" style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-bold mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(action => (
                  <a key={action.label} href={action.href} target={action.newTab ? '_blank' : undefined}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
                    style={{ background: `${action.color}12`, border: `1px solid ${action.color}25` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${action.color}20` }}>
                      <action.icon className="w-4 h-4" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-semibold text-white">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Catalog preview card */}
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6366f110, #8b5cf610)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Seu catálogo online</span>
                </div>
                <p className="text-white font-bold mb-1">{company?.name}</p>
                <p className="text-zinc-400 text-xs mb-4 font-mono">/catalog/{company?.slug}</p>
                <a href={`/catalog/${company?.slug}`} target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir catálogo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
