'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { productsService } from '@/services/products'
import { categoriesService } from '@/services/companies'
import type { Product, Category } from '@/types'
import { Plus, Search, Edit, Trash2, Star, EyeOff, Eye, Package, Filter, X } from 'lucide-react'
import { formatCurrency, slugify } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProductsPage() {
  const { company } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFeatured, setFilterFeatured] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!company?.id) return
    loadData()
    return () => { mountedRef.current = false }
  }, [company?.id])

  async function loadData() {
    setLoading(true)
    const [pr, cr] = await Promise.all([
      productsService.getAll(company!.id, { isActive: undefined }),
      categoriesService.getAll(company!.id),
    ])
    if (!mountedRef.current) return
    if (pr.data) setProducts(pr.data)
    if (cr.data) setCategories(cr.data)
    setLoading(false)
  }

  async function toggleFeatured(p: Product) {
    await productsService.update(p.id, { is_featured: !p.is_featured })
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: !x.is_featured } : x))
    toast.success(p.is_featured ? 'Removido dos destaques' : 'Adicionado aos destaques')
  }

  async function toggleActive(p: Product) {
    await productsService.update(p.id, { is_active: !p.is_active })
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
    toast.success(p.is_active ? 'Produto desativado' : 'Produto ativado')
  }

  async function deleteProduct(id: string) {
    if (!confirm('Excluir este produto?')) return
    await productsService.delete(id)
    toast.success('Produto excluído')
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const filtered = products.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
    const mc = !filterCategory || p.category_id === filterCategory
    const mf = !filterFeatured || p.is_featured
    return ms && mc && mf
  })

  const activeFilters = (filterCategory ? 1 : 0) + (filterFeatured ? 1 : 0)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Produtos</h1>
          <p className="text-zinc-400 text-xs mt-0.5">{products.length} cadastrados</p>
        </div>
        <a href="/admin/products/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
          <span className="sm:hidden">Novo</span>
        </a>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Buscar produto..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${showFilters || activeFilters > 0 ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
          <Filter className="w-4 h-4" />
          {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">{activeFilters}</span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none">
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setFilterFeatured(!filterFeatured)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterFeatured ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
            <Star className="w-3.5 h-3.5" /> Destaques
          </button>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterCategory(''); setFilterFeatured(false) }}
              className="px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Products list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-zinc-900/50 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">Nenhum produto encontrado</p>
          <a href="/admin/products/new" className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">+ Cadastrar produto</a>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <div key={product.id} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-3 hover:border-zinc-700/50 transition-all">
              {/* Image */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 border border-zinc-700/50 overflow-hidden flex-shrink-0">
                {product.thumbnail_url || product.images?.[0]
                  ? <img src={product.thumbnail_url || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-zinc-600" /></div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{product.name}</span>
                  {product.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${product.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {product.is_active ? 'ativo' : 'inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-white">{formatCurrency(product.price)}</span>
                  {product.brand && <span className="text-xs text-zinc-500">{product.brand}</span>}
                  <span className={`text-xs font-medium ml-auto ${product.stock_quantity === 0 ? 'text-red-400' : product.stock_quantity <= product.min_stock_alert ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {product.stock_quantity} un.
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleFeatured(product)}
                  className={`p-2 rounded-lg transition-colors ${product.is_featured ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-600 hover:text-amber-400 hover:bg-amber-500/10'}`}>
                  <Star className="w-4 h-4" />
                </button>
                <a href={`/admin/products/${product.id}`}
                  className="p-2 rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                  <Edit className="w-4 h-4" />
                </a>
                <button onClick={() => deleteProduct(product.id)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
