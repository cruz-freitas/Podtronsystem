'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { inventoryService } from '@/services/inventory'
import { productsService } from '@/services/products'
import type { InventoryMovement, Product, ProductVariation } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Warehouse, Plus, ArrowUpCircle, ArrowDownCircle, RotateCcw, TrendingUp, AlertTriangle, Package, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type MovType = 'entrada' | 'saida' | 'ajuste' | 'devolucao'
type FormType = { product_id: string; variation_id: string; type: MovType; quantity: number; reason: string; notes: string }

const defaultForm: FormType = { product_id: '', variation_id: '', type: 'entrada', quantity: 1, reason: '', notes: '' }

const typeConfig = {
  entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  saida: { label: 'Saída', icon: ArrowDownCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ajuste: { label: 'Ajuste', icon: RotateCcw, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  devolucao: { label: 'Devolução', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
}

export default function InventoryPage() {
  const { user, company } = useAuth()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormType>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [stockView, setStockView] = useState<Product[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!company?.id) return
    loadData()
    return () => { mountedRef.current = false }
  }, [company?.id])

  async function loadData() {
    setLoading(true)
    const [movResult, prodResult] = await Promise.all([
      inventoryService.getMovements(company!.id),
      productsService.getAll(company!.id, { isActive: undefined, limit: 200 }),
    ])
    if (!mountedRef.current) return
    if (movResult.data) setMovements(movResult.data)
    if (prodResult.data) {
      setProducts(prodResult.data)
      setStockView(prodResult.data.filter(p => p.is_active))
    }
    setLoading(false)
  }

  const selectedProduct = products.find(p => p.id === form.product_id)
  const productVariations = selectedProduct?.variations?.filter(v => v.is_active) || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_id) { toast.error('Selecione um produto'); return }
    if (selectedProduct?.has_variations && !form.variation_id) {
      toast.error('Selecione o sabor/variação do produto')
      return
    }
    if (form.quantity <= 0) { toast.error('Quantidade deve ser maior que zero'); return }
    setSaving(true)
    const { error } = await inventoryService.addMovement({
      company_id: company!.id,
      user_id: user!.id,
      ...form,
      variation_id: form.variation_id || undefined,
    })
    if (error) {
      toast.error('Erro ao registrar: ' + error)
    } else {
      toast.success('Movimentação registrada!')
      setShowForm(false)
      setForm(defaultForm)
      loadData()
    }
    setSaving(false)
  }

  function getProductStock(p: Product): { total: number; details: string } {
    if (p.has_variations && p.variations?.length) {
      const vars = p.variations.filter(v => v.is_active)
      const total = vars.reduce((s, v) => s + (v.stock_quantity || 0), 0)
      const details = vars.map(v => `${v.flavor || v.name}: ${v.stock_quantity}`).join(' · ')
      return { total, details }
    }
    return { total: p.stock_quantity || 0, details: '' }
  }

  const lowStockProducts = stockView.filter(p => {
    const { total } = getProductStock(p)
    return total <= p.min_stock_alert
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Controle de Estoque</h1>
          <p className="text-zinc-400 text-sm mt-1">Entradas, saídas e ajustes por produto e sabor</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> Nova Movimentação
        </button>
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
            <AlertTriangle className="w-4 h-4" />
            {lowStockProducts.length} produto(s) com estoque baixo ou zerado
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {lowStockProducts.slice(0, 6).map(p => {
              const { total, details } = getProductStock(p)
              return (
                <div key={p.id} className="bg-zinc-900/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium truncate">{p.name}</span>
                    <span className={`text-sm font-bold ml-2 flex-shrink-0 ${total === 0 ? 'text-red-400' : 'text-amber-400'}`}>{total} un.</span>
                  </div>
                  {details && <p className="text-xs text-zinc-500 truncate">{details}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New movement form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Nova Movimentação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Produto *</label>
              <select value={form.product_id}
                onChange={e => setForm(f => ({ ...f, product_id: e.target.value, variation_id: '' }))}
                required className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="">Selecione o produto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.brand ? `(${p.brand})` : ''} {p.has_variations ? '— tem variações' : `— ${p.stock_quantity} un.`}
                  </option>
                ))}
              </select>
            </div>

            {/* Show variations if product has them - REQUIRED */}
            {selectedProduct?.has_variations && productVariations.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Sabor / Variação * <span className="text-red-400 text-xs">(obrigatório para este produto)</span>
                </label>
                <select value={form.variation_id}
                  onChange={e => setForm(f => ({ ...f, variation_id: e.target.value }))}
                  required className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="">Selecione o sabor</option>
                  {productVariations.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.flavor || v.name} — estoque atual: {v.stock_quantity} un.
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MovType }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="entrada">➕ Entrada (recebeu mercadoria)</option>
                <option value="saida">➖ Saída (vendeu / retirou)</option>
                <option value="ajuste">🔄 Ajuste (corrigir quantidade exata)</option>
                <option value="devolucao">↩️ Devolução</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                {form.type === 'ajuste' ? 'Quantidade Final *' : 'Quantidade *'}
              </label>
              <input type="number" min="0" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                required className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Motivo</label>
              <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Ex: Compra de fornecedor, venda, contagem física..."
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Warehouse className="w-4 h-4" />}
              Registrar
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm) }}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Stock overview per product */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800/50">
          <h3 className="text-white font-semibold">Estoque por Produto</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {stockView.map(p => {
              const { total, details } = getProductStock(p)
              const isZero = total === 0
              const isLow = !isZero && total <= p.min_stock_alert
              return (
                <div key={p.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                      {p.thumbnail_url || p.images?.[0]
                        ? <img src={p.thumbnail_url || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-zinc-600" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{p.name}</span>
                        {p.brand && <span className="text-xs text-zinc-500">{p.brand}</span>}
                      </div>
                      {details && <p className="text-xs text-zinc-500 mt-0.5 truncate">{details}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                        isZero ? 'text-red-400 bg-red-500/10' :
                        isLow ? 'text-amber-400 bg-amber-500/10' :
                        'text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {total} un.
                      </span>
                    </div>
                  </div>
                  {/* Per variation breakdown */}
                  {p.has_variations && p.variations && p.variations.length > 0 && (
                    <div className="mt-2 ml-12 flex flex-wrap gap-1.5">
                      {p.variations.filter(v => v.is_active).map(v => (
                        <span key={v.id} className={`text-xs px-2 py-0.5 rounded-lg border ${
                          v.stock_quantity === 0 ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          v.stock_quantity <= 5 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-zinc-400 bg-zinc-800 border-zinc-700'
                        }`}>
                          {v.flavor || v.name}: <strong>{v.stock_quantity}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Movement history */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800/50">
          <h3 className="text-white font-semibold">Histórico de Movimentações</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Warehouse className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm">Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {movements.map(m => {
              const cfg = typeConfig[m.type]
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {(m.product as any)?.name || '—'}
                      {(m.variation as any)?.flavor && (
                        <span className="text-zinc-400 ml-1.5 text-xs">• {(m.variation as any).flavor}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{m.reason || cfg.label}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${cfg.color}`}>
                      {m.type === 'ajuste' ? `→ ${m.quantity}` : m.type === 'saida' ? `−${m.quantity}` : `+${m.quantity}`}
                    </div>
                    <div className="text-xs text-zinc-500">{m.quantity_before} → {m.quantity_after}</div>
                  </div>
                  <div className="text-xs text-zinc-600 hidden sm:block w-28 text-right flex-shrink-0">
                    {formatDateTime(m.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
