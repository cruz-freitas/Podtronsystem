'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { companiesService, themesService, promotionsService } from '@/services/companies'
import { productsService } from '@/services/products'
import type { Company, Theme, Product, ProductVariation, Promotion } from '@/types'
import {
  ArrowLeft, MessageCircle, CheckCircle, XCircle,
  Package, Share2, Wind, Zap, Tag, Percent, Star
} from 'lucide-react'
import { formatCurrency, buildWhatsAppUrl, buildProductWhatsAppMessage, calculateDiscount } from '@/lib/utils'

// Apply promo discount
function applyPromo(price: number, promo: Promotion | null) {
  if (!promo) return { final: price, original: null }
  if (promo.discount_type === 'percentage') {
    return { final: Math.max(0, price * (1 - promo.discount_value / 100)), original: price }
  }
  return { final: Math.max(0, price - promo.discount_value), original: price }
}

// Smoke particle
function SmokeParticle({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{
      background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
      filter: 'blur(20px)',
      animation: 'smokeRise 10s ease-out infinite',
      ...style,
    }} />
  )
}

export default function ProductDetailPage() {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [copied, setCopied] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadData()
    return () => { mountedRef.current = false }
  }, [slug, productSlug])

  // Auto-switch image when variation changes
  useEffect(() => {
    setCurrentImage(0)
  }, [selectedVariation?.id])

  async function loadData() {
    const { data: co } = await companiesService.getBySlug(slug)
    if (!co || !mountedRef.current) { setLoading(false); return }
    setCompany(co)

    const [themeRes, productRes, promoRes] = await Promise.all([
      themesService.getByCompanyId(co.id),
      productsService.getBySlug(co.id, productSlug),
      promotionsService.getActiveCatalog(co.id),
    ])

    if (!mountedRef.current) return
    if (themeRes.data) setTheme(themeRes.data)
    if (promoRes.data?.[0]) setPromotion(promoRes.data[0])
    if (productRes.data) {
      setProduct(productRes.data)
      const first = productRes.data.variations?.find(v => v.is_active)
      if (first) setSelectedVariation(first)
    }
    setLoading(false)
  }

  async function share() {
    if (navigator.share) {
      navigator.share({ title: product?.name || '', url: window.location.href })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const primary = theme?.primary_color || '#6366f1'
  const secondary = theme?.secondary_color || '#8b5cf6'
  const bg = theme?.background_color || '#06060a'
  const surface = theme?.surface_color || '#0e0e16'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 0 40px ${primary}60` }}>
            <Wind className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        </div>
        <div className="flex gap-1.5">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-1.5 h-5 rounded-full animate-bounce"
              style={{ background: primary, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!product || !company) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <Package className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
        <h1 className="text-white font-bold text-xl mb-2">Produto não encontrado</h1>
        <a href={`/catalog/${slug}`} className="text-sm font-semibold hover:opacity-80 transition-opacity"
          style={{ color: primary }}>← Voltar ao catálogo</a>
      </div>
    </div>
  )

  const variations = product.variations?.filter(v => v.is_active) || []
  const basePrice = selectedVariation?.price || product.price
  const baseOriginal = selectedVariation?.original_price || product.original_price

  // Apply promotion
  const { final: finalPrice, original: promoOriginal } = applyPromo(basePrice, promotion)
  const displayOriginal = promoOriginal || baseOriginal
  const discount = calculateDiscount(displayOriginal || 0, finalPrice)

  const isOutOfStock = selectedVariation
    ? selectedVariation.stock_quantity === 0
    : product.stock_quantity === 0

  // Build images array (variation image first)
  const images: string[] = []
  if (selectedVariation?.image_url) images.push(selectedVariation.image_url)
  if (product.thumbnail_url && !images.includes(product.thumbnail_url)) images.push(product.thumbnail_url)
  ;(product.images || []).forEach(img => { if (!images.includes(img)) images.push(img) })
  if (images.length === 0) images.push('')

  const productUrl = typeof window !== 'undefined' ? window.location.href : ''

  const whatsappMessage = buildProductWhatsAppMessage({
    productName: product.name,
    brand: product.brand || undefined,
    sku: product.sku || undefined,
    variation: selectedVariation?.flavor || selectedVariation?.name || undefined,
    price: finalPrice,
    catalogUrl: productUrl,
    greeting: company.whatsapp_message || undefined,
  })

  const puffs = selectedVariation?.puffs || (product.variations?.[0]?.puffs)

  return (
    <div className="min-h-screen relative" style={{ background: bg, color: '#fff' }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-0 w-[50vw] h-[50vw] opacity-[0.08] blur-[80px]"
          style={{ background: `radial-gradient(circle, ${primary}, transparent)` }} />
        <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] opacity-[0.06] blur-[80px]"
          style={{ background: `radial-gradient(circle, ${secondary}, transparent)` }} />
        {[...Array(4)].map((_, i) => (
          <SmokeParticle key={i} style={{
            width: `${60 + i * 30}px`, height: `${60 + i * 30}px`,
            left: `${20 + i * 18}%`, bottom: '-5%',
            animationDelay: `${i * 2}s`, animationDuration: `${10 + i * 2}s`,
          }} />
        ))}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Promotion top bar */}
      {promotion && !isOutOfStock && (
        <div className="relative z-20 text-center py-2 text-sm font-bold text-white overflow-hidden"
          style={{ background: promotion.highlight_color || '#ef4444' }}>
          <div className="absolute inset-0 -skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmerBanner 3s ease-in-out infinite' }} />
          🔥 {promotion.name} — {promotion.discount_type === 'percentage' ? `${promotion.discount_value}% OFF` : `R$ ${promotion.discount_value} OFF`}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50" style={{
        background: `${bg}e0`, backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${primary}, ${secondary}, transparent)` }} />
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href={`/catalog/${slug}`}
            className="flex items-center gap-1.5 text-sm font-semibold transition-all hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </a>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-zinc-700">/</span>
            {product.brand && <span className="text-xs text-zinc-500 truncate">{product.brand}</span>}
            {product.brand && <span className="text-zinc-700">/</span>}
            <span className="text-sm font-semibold text-white truncate">{product.name}</span>
          </div>

          <button onClick={share}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: copied ? '#10b981' : 'rgba(255,255,255,0.6)' }}>
            <Share2 className="w-3.5 h-3.5" />
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ── LEFT: Images ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{
                aspectRatio: '1',
                background: surface,
                border: `1px solid ${primary}20`,
                boxShadow: `0 0 60px ${primary}15`,
              }}>
              {images[currentImage] ? (
                <img src={images[currentImage]} alt={product.name}
                  className="w-full h-full object-contain p-4 transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Package className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Sem imagem</span>
                </div>
              )}

              {/* Discount badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1.5 rounded-xl font-black text-white text-sm"
                    style={{
                      background: promotion ? (promotion.highlight_color || '#ef4444') : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      boxShadow: '0 4px 15px rgba(239,68,68,0.5)',
                    }}>
                    -{discount}%{promotion ? ' OFF' : ''}
                  </div>
                </div>
              )}

              {/* Glow on image */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 80%, ${primary}10, transparent 70%)` }} />
            </div>

            {/* Thumbnails */}
            {images.filter(Boolean).length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.filter(Boolean).map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImage(idx)}
                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all"
                    style={{
                      border: idx === currentImage ? `2px solid ${primary}` : '2px solid rgba(255,255,255,0.06)',
                      opacity: idx === currentImage ? 1 : 0.5,
                      boxShadow: idx === currentImage ? `0 0 15px ${primary}40` : 'none',
                    }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="space-y-6">

            {/* Brand + name */}
            <div>
              {product.brand && (
                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{ background: `${primary}20`, border: `1px solid ${primary}30`, color: primary }}>
                  <Zap className="w-3 h-3" />
                  {product.brand}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{product.name}</h1>
              {product.model && (
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Modelo: {product.model}</p>
              )}
            </div>

            {/* Price block */}
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: surface, border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Promo label */}
              {promotion && !isOutOfStock && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: promotion.highlight_color || '#ef4444' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: promotion.highlight_color || '#ef4444' }}>
                    {promotion.name} — {promotion.discount_type === 'percentage' ? `${promotion.discount_value}% OFF` : `R$ ${promotion.discount_value} OFF`}
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black"
                  style={{ color: promotion ? (promotion.highlight_color || '#ef4444') : 'white' }}>
                  {formatCurrency(finalPrice)}
                </span>
                {displayOriginal && displayOriginal > finalPrice && (
                  <div className="flex flex-col">
                    <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {formatCurrency(displayOriginal)}
                    </span>
                    {discount > 0 && (
                      <span className="text-xs font-bold" style={{ color: '#10b981' }}>
                        Economia: {formatCurrency(displayOriginal - finalPrice)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className={`flex items-center gap-2 text-sm font-semibold ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOutOfStock
                  ? <><XCircle className="w-4 h-4" /> Produto esgotado</>
                  : <><CheckCircle className="w-4 h-4" /> Em estoque</>
                }
              </div>
            </div>

            {/* Variations / Flavors */}
            {variations.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Sabor selecionado: <span className="text-white">{selectedVariation?.flavor || selectedVariation?.name || 'Selecione'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variations.map(v => {
                    const active = selectedVariation?.id === v.id
                    const soldOut = v.stock_quantity === 0
                    return (
                      <button key={v.id} onClick={() => !soldOut && setSelectedVariation(v)}
                        disabled={soldOut}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                        style={active
                          ? { background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: '#fff', boxShadow: `0 4px 20px ${primary}50` }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
                        }>
                        {v.flavor || v.name}
                        {soldOut && <span className="ml-1 text-[10px] opacity-60">(esgotado)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Puffs + SKU info pills */}
            <div className="flex flex-wrap gap-2">
              {puffs && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                  style={{ background: `${primary}15`, border: `1px solid ${primary}25`, color: primary }}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {puffs.toLocaleString('pt-BR')} puffs
                </div>
              )}
              {product.sku && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  SKU: {product.sku}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="rounded-2xl p-4"
                style={{ background: surface, border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Descrição</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{product.description}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              {!isOutOfStock && company.whatsapp ? (
                <a href={buildWhatsAppUrl(company.whatsapp, whatsappMessage)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    boxShadow: '0 8px 30px rgba(37,211,102,0.35)',
                  }}>
                  <MessageCircle className="w-5 h-5 fill-white" />
                  CHAMAR NO WHATSAPP
                </a>
              ) : isOutOfStock ? (
                <div className="w-full py-4 rounded-2xl text-base font-black text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  PRODUTO ESGOTADO
                </div>
              ) : null}

              <a href={`/catalog/${slug}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <ArrowLeft className="w-4 h-4" />
                Voltar ao catálogo
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes smokeRise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.2; }
          100% { transform: translateY(-60vh) scale(3); opacity: 0; }
        }
        @keyframes shimmerBanner {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
      `}</style>
    </div>
  )
}
