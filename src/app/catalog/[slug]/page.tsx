'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { companiesService, categoriesService, themesService, promotionsService } from '@/services/companies'
import { productsService } from '@/services/products'
import type { Company, Theme, Category, Product, Promotion, ProductVariation } from '@/types'
import {
  Search, MessageCircle, Star, Zap, Package, X, Wind,
  ShieldAlert, AlertTriangle, Tag, Percent, Check,
  ShoppingCart, Plus
} from 'lucide-react'
import { formatCurrency, buildWhatsAppUrl, buildProductWhatsAppMessage, calculateDiscount } from '@/lib/utils'
import { CartProvider, useCart } from '@/components/catalog/CartContext'
import { CartDrawer } from '@/components/catalog/CartDrawer'
import { PWAPrompts } from '@/components/catalog/PWAPrompts'

// ─── Apply promo ──────────────────────────────────────────────
function applyPromo(price: number, promo: Promotion | null) {
  if (!promo) return { final: price, original: null }
  if (promo.discount_type === 'percentage')
    return { final: Math.max(0, price * (1 - promo.discount_value / 100)), original: price }
  return { final: Math.max(0, price - promo.discount_value), original: price }
}

// ─── Age Gate ─────────────────────────────────────────────────
function AgeGate({ primary, secondary, bg, onConfirm, onDeny }: {
  primary: string; secondary: string; bg: string
  onConfirm: () => void; onDeny: () => void
}) {
  const [denied, setDenied] = useState(false)

  if (denied) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: '#000' }}>
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acesso negado</h2>
        <p className="text-zinc-500 text-sm">Este conteúdo é restrito a maiores de 18 anos.</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-end sm:items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-10 blur-[80px]"
          style={{ background: `radial-gradient(circle, ${primary}, transparent)` }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl overflow-hidden" style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
          <div className="p-5 sm:p-8 text-center space-y-4 sm:space-y-6">
            <div className="flex justify-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
                <div className="relative w-full h-full rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primary}20, ${secondary}10)`, border: `1px solid ${primary}30` }}>
                  <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: primary }} />
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white mb-1">Verificação de Idade</h1>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Confirme que você é maior de idade</p>
            </div>

            <div className="rounded-2xl p-3 sm:p-4 text-left space-y-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />, text: 'Este site contém produtos de tabaco e derivados. A venda e consumo são proibidos para menores de 18 anos, conforme a Lei nº 9.294/96 e regulamentações da ANVISA.' },
                { icon: <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />, text: 'O uso de vaporizadores causa dependência e é prejudicial à saúde. Pode causar câncer, doenças cardiovasculares e respiratórias.' },
                { icon: <ShieldAlert className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />, text: 'Ao acessar, você declara ter 18 anos ou mais e está ciente dos riscos associados ao consumo destes produtos.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {item.icon}
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.text}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm sm:text-base font-bold text-white mb-3">Você tem 18 anos ou mais?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onConfirm}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 8px 30px ${primary}40` }}>
                  <Check className="w-4 h-4" /> SIM, tenho 18+
                </button>
                <button onClick={() => { setDenied(true); onDeny() }}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  <X className="w-4 h-4" /> NÃO
                </button>
              </div>
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Ao confirmar, você concorda com os Termos de Uso e Política de Privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Smoke background ─────────────────────────────────────────
function VapeBackground({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute" style={{ top: '-10%', left: '-5%', width: '50vw', height: '50vw', background: `radial-gradient(circle, ${primary}18 0%, transparent 70%)`, filter: 'blur(60px)', animation: 'blobFloat1 12s ease-in-out infinite' }} />
      <div className="absolute" style={{ bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${secondary}14 0%, transparent 70%)`, filter: 'blur(60px)', animation: 'blobFloat2 15s ease-in-out infinite' }} />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{ width: `${80 + i * 30}px`, height: `${80 + i * 30}px`, left: `${12 + i * 14}%`, bottom: '-5%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', filter: 'blur(20px)', animation: `smokeRise ${7 + i * 1.5}s ease-out infinite`, animationDelay: `${i * 1.3}s` }} />
      ))}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
    </div>
  )
}

// ─── Promo banner ─────────────────────────────────────────────
function PromoBanner({ promotions }: { promotions: Promotion[] }) {
  const [cur, setCur] = useState(0)
  useEffect(() => {
    if (promotions.length <= 1) return
    const t = setInterval(() => setCur(p => (p + 1) % promotions.length), 3500)
    return () => clearInterval(t)
  }, [promotions.length])
  if (!promotions.length) return null
  const promo = promotions[cur]
  return (
    <div className="relative overflow-hidden py-2 px-4 text-center text-white text-sm font-bold" style={{ background: promo.highlight_color || '#ef4444' }}>
      <div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'shimmerBanner 3s ease-in-out infinite' }} />
      <span className="relative">🔥 {promo.name} — {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `R$ ${promo.discount_value} OFF`}</span>
    </div>
  )
}

// ─── Cart FAB ─────────────────────────────────────────────────
function CartFAB({ primary, secondary }: { primary: string; secondary: string }) {
  const { totalItems, openCart } = useCart()
  if (totalItems === 0) return null
  return (
    <button onClick={openCart}
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 8px 30px ${primary}50` }}>
      <div className="relative">
        <ShoppingCart className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center text-[9px] font-black"
          style={{ color: primary }}>
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      </div>
      <span className="hidden sm:inline">Ver carrinho</span>
      <span className="sm:hidden">{totalItems}</span>
    </button>
  )
}

// ─── Section title ────────────────────────────────────────────
function SectionTitle({ icon, label, count, primary }: { icon: string; label: string; count?: number; primary: string }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <h2 className="text-base sm:text-xl font-black text-white tracking-tight">{label}</h2>
        {count !== undefined && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>{count}</span>}
      </div>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
    </div>
  )
}

// ─── Product card ─────────────────────────────────────────────
function ProductCard({ product, company, primary, secondary, surface, bg, index, activePromo }: {
  product: Product; company: Company; primary: string; secondary: string
  surface: string; bg: string; index: number; activePromo: Promotion | null
}) {
  const { addItem, items } = useCart()
  const vars = product.variations?.filter(v => v.is_active) || []
  const [selected, setSelected] = useState<ProductVariation | null>(vars[0] || null)
  const [hovered, setHovered] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const img = selected?.image_url || product.thumbnail_url || product.images?.[0]
  const basePrice = selected?.price || product.price
  const { final: finalPrice, original: promoOriginal } = applyPromo(basePrice, activePromo)
  const displayOriginal = promoOriginal || selected?.original_price || product.original_price
  const discount = calculateDiscount(displayOriginal || 0, finalPrice)
  const outOfStock = selected ? selected.stock_quantity === 0 : product.stock_quantity === 0

  const cartItemId = `${product.id}__${selected?.id ?? 'base'}`
  const inCart = items.find(i => i.id === cartItemId)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem(product, selected, basePrice, activePromo ? finalPrice : null)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/catalog/${company.slug}/product/${product.slug}`
    : `/catalog/${company.slug}/product/${product.slug}`

  const msg = buildProductWhatsAppMessage({
    productName: product.name, brand: product.brand || undefined,
    sku: product.sku || undefined,
    variation: selected?.flavor || selected?.name || undefined,
    price: finalPrice, catalogUrl: productUrl,
    greeting: company.whatsapp_message || undefined,
  })

  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: surface,
        border: hovered ? `1px solid ${primary}40` : inCart ? `1px solid ${primary}25` : '1px solid rgba(255,255,255,0.06)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: hovered ? `0 16px 50px rgba(0,0,0,0.5), 0 0 25px ${primary}18` : '0 4px 20px rgba(0,0,0,0.3)',
        animationName: 'cardIn', animationDuration: '0.5s',
        animationDelay: `${index * 0.05}s`, animationFillMode: 'both',
      }}>

      {/* In-cart indicator */}
      {inCart && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-black"
          style={{ background: primary, color: '#fff' }}>
          {inCart.quantity}x
        </div>
      )}

      <a href={`/catalog/${company.slug}/product/${product.slug}`}>
        <div className="relative overflow-hidden" style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.02)' }}>
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover"
              style={{ transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.07)' }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bg}cc 0%, transparent 50%)`, opacity: hovered ? 0.7 : 0.35, transition: 'opacity 0.3s' }} />
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {discount > 0 && (
              <span className="text-[10px] font-black text-white px-1.5 py-0.5 rounded-lg"
                style={{ background: activePromo ? (activePromo.highlight_color || '#ef4444') : '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>
                -{discount}%
              </span>
            )}
            {product.is_featured && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-1"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: '#fff' }}>
                <Star className="w-2.5 h-2.5 fill-white" /> TOP
              </span>
            )}
            {outOfStock && (
              <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.8)' }}>ESGOTADO</span>
            )}
          </div>
        </div>
      </a>

      <div className="p-2.5 sm:p-3 space-y-2">
        {product.brand && <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: primary }}>{product.brand}</p>}

        <a href={`/catalog/${company.slug}/product/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">{product.name}</h3>
        </a>

        {/* Flavor selector */}
        {vars.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {vars.slice(0, 3).map(v => {
              const active = selected?.id === v.id
              return (
                <button key={v.id} onClick={e => { e.preventDefault(); setSelected(v) }}
                  className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-lg font-semibold transition-all"
                  style={active
                    ? { background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: '#fff' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
                  } title={v.flavor || v.name}>
                  {(v.flavor || v.name).split(' ').slice(0, 2).join(' ')}
                </button>
              )
            })}
            {vars.length > 3 && <span className="text-[9px] px-1 py-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>+{vars.length - 3}</span>}
          </div>
        )}

        {/* Price */}
        <div className="space-y-0.5">
          {activePromo && !outOfStock && (
            <div className="flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" style={{ color: activePromo.highlight_color || '#ef4444' }} />
              <span className="text-[9px] font-bold uppercase" style={{ color: activePromo.highlight_color || '#ef4444' }}>{activePromo.name}</span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black" style={{ color: activePromo ? (activePromo.highlight_color || '#ef4444') : 'white' }}>
              {formatCurrency(finalPrice)}
            </span>
            {displayOriginal && displayOriginal > finalPrice && (
              <span className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatCurrency(displayOriginal)}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!outOfStock ? (
          <div className="flex gap-1.5">
            {/* Add to cart */}
            <button onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] sm:text-xs font-black text-white transition-all active:scale-95"
              style={{
                background: justAdded ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${primary}, ${secondary})`,
                boxShadow: justAdded ? '0 4px 15px rgba(16,185,129,0.4)' : `0 4px 15px ${primary}30`,
                transition: 'all 0.3s',
              }}>
              {justAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {justAdded ? 'Adicionado!' : 'Adicionar'}
            </button>
            {/* Direct WhatsApp */}
            {company.whatsapp && (
              <a href={buildWhatsAppUrl(company.whatsapp, msg)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center p-2 rounded-xl transition-all active:scale-95"
                style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.25)' }}
                title="Chamar direto no WhatsApp">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              </a>
            )}
          </div>
        ) : (
          <div className="w-full py-2 rounded-xl text-xs font-bold text-center"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            ESGOTADO
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page (wrapped with CartProvider) ────────────────────
export default function CatalogPage() {
  return (
    <CartProvider>
      <CatalogContent />
    </CartProvider>
  )
}

function CatalogContent() {
  const { slug } = useParams<{ slug: string }>()
  const [ageConfirmed, setAgeConfirmed] = useState<boolean | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const { isOpen: cartOpen, openCart, closeCart, totalItems } = useCart()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const stored = sessionStorage.getItem('age_confirmed')
    if (stored === 'true') setAgeConfirmed(true)
    else setAgeConfirmed(false)
    loadData()
    return () => { mountedRef.current = false }
  }, [slug])

  async function loadData() {
    setLoading(true)
    const { data: co } = await companiesService.getBySlug(slug)
    if (!co || !mountedRef.current) { setLoading(false); return }
    setCompany(co)
    const [th, cats, prods, promos] = await Promise.all([
      themesService.getByCompanyId(co.id),
      categoriesService.getActive(co.id),
      productsService.getAll(co.id, { isActive: true }),
      promotionsService.getActiveCatalog(co.id),
    ])
    if (!mountedRef.current) return
    if (th.data) setTheme(th.data)
    if (cats.data) setCategories(cats.data)
    if (prods.data) setProducts(prods.data)
    if (promos.data) setPromotions(promos.data)
    setLoading(false)
  }

  const primary = theme?.primary_color || '#6366f1'
  const secondary = theme?.secondary_color || '#8b5cf6'
  const bg = theme?.background_color || '#06060a'
  const surface = theme?.surface_color || '#0e0e16'
  const activePromo = promotions.length > 0 ? promotions[0] : null

  const filtered = products.filter(p => {
    const s = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
    const c = !activeCategory || p.category_id === activeCategory
    return s && c
  })
  const featured = filtered.filter(p => p.is_featured)
  const regular = filtered.filter(p => !p.is_featured)

  const catalogUrl = typeof window !== 'undefined' ? `${window.location.origin}/catalog/${slug}` : `/catalog/${slug}`

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-14 h-14">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 0 40px ${primary}60` }}>
            <Wind className="w-7 h-7 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        </div>
        <div className="flex gap-1.5">
          {[0,1,2,3].map(i => <div key={i} className="w-1.5 h-5 rounded-full animate-bounce" style={{ background: primary, animationDelay: `${i*0.1}s` }} />)}
        </div>
      </div>
    </div>
  )

  if (!company) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center"><Package className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
        <h1 className="text-white font-bold text-xl">Loja não encontrada</h1>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative" style={{ background: bg, color: '#fff' }}>
      {ageConfirmed === false && (
        <AgeGate primary={primary} secondary={secondary} bg={bg}
          onConfirm={() => { sessionStorage.setItem('age_confirmed', 'true'); setAgeConfirmed(true) }}
          onDeny={() => setAgeConfirmed(false)} />
      )}

      <VapeBackground primary={primary} secondary={secondary} />

      <div className="relative z-10">
        {promotions.length > 0 && <PromoBanner promotions={promotions} />}

        {/* HEADER */}
        <header className="sticky top-0 z-50" style={{ background: `${bg}e0`, backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, transparent)` }} />
          <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
            <a href={`/catalog/${company.slug}`} className="flex items-center gap-2.5 flex-shrink-0 group">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-7 w-auto" />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 0 16px ${primary}50` }}>
                    <Wind className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm hidden sm:inline">{company.name}</span>
                </>
              )}
            </a>

            <div className="hidden sm:flex flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input type="text" placeholder="Buscar produto ou marca..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm text-white rounded-full outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: search ? `1px solid ${primary}60` : '1px solid rgba(255,255,255,0.08)', fontSize: 16 }} />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} /></button>}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Search className="w-4 h-4 text-white" />
              </button>

              {/* Cart button in header */}
              <button onClick={openCart}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: totalItems > 0 ? `linear-gradient(135deg, ${primary}, ${secondary})` : 'rgba(255,255,255,0.07)', boxShadow: totalItems > 0 ? `0 4px 15px ${primary}40` : 'none' }}>
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0 && <span className="font-black">{totalItems}</span>}
              </button>

              {company.whatsapp && (
                <a href={buildWhatsAppUrl(company.whatsapp, company.whatsapp_message || 'Olá! Vim pelo catálogo online.')}
                  target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="sm:hidden px-3 pb-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} autoFocus
                  className="w-full pl-11 pr-4 py-3 text-sm text-white rounded-xl outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16 }} />
              </div>
            </div>
          )}
        </header>

        {/* HERO */}
        <div className="relative py-8 sm:py-16 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[80px]" style={{ background: `radial-gradient(circle, ${primary}, ${secondary})` }} />
          </div>
          <div className="relative max-w-2xl mx-auto space-y-3 sm:space-y-5">
            {company.tagline && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: `${primary}20`, border: `1px solid ${primary}40`, color: primary }}>
                <Wind className="w-3.5 h-3.5" />{company.tagline}
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl font-black leading-none tracking-tight"
              style={{ background: `linear-gradient(135deg, #ffffff 30%, ${primary} 80%, ${secondary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {company.name}
            </h1>
            {company.description && (
              <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>{company.description}</p>
            )}
            {activePromo && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-white text-sm"
                style={{ background: activePromo.highlight_color || '#ef4444', boxShadow: `0 8px 30px ${activePromo.highlight_color || '#ef4444'}50` }}>
                <Percent className="w-4 h-4" />
                {activePromo.discount_type === 'percentage' ? `${activePromo.discount_value}% OFF` : `R$ ${activePromo.discount_value} OFF`} em todos os produtos
              </div>
            )}
          </div>
        </div>

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <div className="sticky top-14 z-40" style={{ background: `${bg}cc`, backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="max-w-6xl mx-auto px-3 sm:px-4">
              <div className="flex gap-2 overflow-x-auto py-2.5 no-scrollbar">
                {[{ id: '', name: 'Todos' }, ...categories].map(cat => {
                  const active = activeCategory === cat.id
                  return (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id === activeCategory ? '' : cat.id)}
                      className="flex-shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all"
                      style={active
                        ? { background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: '#fff', boxShadow: `0 4px 12px ${primary}40` }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }
                      }>
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-8 sm:space-y-14">
          {featured.length > 0 && (
            <section>
              <SectionTitle icon="🔥" label="Destaques" primary={primary} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-4">
                {featured.map((p, i) => <ProductCard key={p.id} product={p} company={company} primary={primary} secondary={secondary} surface={surface} bg={bg} index={i} activePromo={activePromo} />)}
              </div>
            </section>
          )}
          {regular.length > 0 && (
            <section>
              <SectionTitle icon="💨" label={activeCategory ? categories.find(c => c.id === activeCategory)?.name || 'Produtos' : 'Todos os Produtos'} count={regular.length} primary={primary} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-4">
                {regular.map((p, i) => <ProductCard key={p.id} product={p} company={company} primary={primary} secondary={secondary} surface={surface} bg={bg} index={i} activePromo={activePromo} />)}
              </div>
            </section>
          )}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Package className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
              </div>
              <p className="text-lg font-bold text-white">Nenhum produto encontrado</p>
              {search && <button onClick={() => setSearch('')} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: `${primary}20`, color: primary, border: `1px solid ${primary}30` }}>Limpar busca</button>}
            </div>
          )}
        </main>

        <footer className="max-w-6xl mx-auto px-4 py-8 mt-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{company.name}</span>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
            <Zap className="w-3 h-3" /> Powered by Poditron
          </div>
        </footer>
      </div>

      {/* Cart FAB - bottom left */}
      <CartFAB primary={primary} secondary={secondary} />

      {/* Floating WhatsApp - bottom right */}
      {company.whatsapp && (
        <a href={buildWhatsAppUrl(company.whatsapp, company.whatsapp_message || 'Olá! Vim pelo catálogo online.')}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 group"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 8px 30px rgba(37,211,102,0.4)' }}>
          <MessageCircle className="w-5 h-5 fill-white" />
          <span className="hidden sm:inline">Fale conosco</span>
          <span className="absolute inset-0 rounded-xl sm:rounded-2xl animate-ping opacity-20" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', animationDuration: '2s' }} />
        </a>
      )}

      {/* Cart drawer */}
      <CartDrawer
        company={company}
        catalogUrl={catalogUrl}
        promotion={activePromo}
        primary={primary}
        secondary={secondary}
        bg={bg}
      />

      {/* PWA: banner de instalação, offline pill, update banner */}
      <PWAPrompts
        primary={primary}
        secondary={secondary}
        companyName={company.name}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes smokeRise { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 0.3; } 100% { transform: translateY(-80vh) scale(3); opacity: 0; } }
        @keyframes blobFloat1 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(3%,4%) scale(1.05); } 66% { transform: translate(-2%,2%) scale(0.97); } }
        @keyframes blobFloat2 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-4%,-3%) scale(1.08); } 66% { transform: translate(2%,-2%) scale(0.95); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerBanner { 0% { transform: translateX(-100%) skewX(-12deg); } 100% { transform: translateX(300%) skewX(-12deg); } }
        /* PWA: evita bounce/overscroll no iOS */
        html, body { overscroll-behavior: none; }
        /* Garante que o conteúdo respeite o safe-area do iPhone */
        .catalog-footer { padding-bottom: max(2rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  )
}
