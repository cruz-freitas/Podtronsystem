'use client'

import { useState } from 'react'
import { useCart } from './CartContext'
import type { Company, Promotion } from '@/types'
import {
  X, ShoppingCart, Minus, Plus, Trash2, Package,
  MessageCircle, Send, MapPin, User, ChevronRight,
  Check, ArrowLeft, Bike, ShoppingBag
} from 'lucide-react'
import { formatCurrency, buildWhatsAppUrl } from '@/lib/utils'

// ─── Build WhatsApp cart message ──────────────────────────────
function buildCartMessage(opts: {
  items: ReturnType<typeof useCart>['items']
  total: number
  name: string
  delivery: boolean
  address: string
  greeting: string
  catalogUrl: string
  promotion: Promotion | null
  companyName: string
}): string {
  const { items, total, name, delivery, address, greeting, catalogUrl, promotion, companyName } = opts
  const lines: string[] = []

  lines.push(greeting || `Olá, ${companyName}!`)
  lines.push('')
  lines.push(`👤 *${name}*`)
  if (delivery) {
    lines.push(`📦 *Entrega* em: ${address}`)
  } else {
    lines.push(`🏪 *Retirada* no local`)
  }
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push('🛒 *CARRINHO DE COMPRAS*')
  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  items.forEach((item, idx) => {
    const price = item.promoPrice ?? item.unitPrice
    lines.push(`*${idx + 1}. ${item.product.name}*`)
    if (item.product.brand) lines.push(`   Marca: ${item.product.brand}`)
    if (item.variation) {
      const vLabel = item.variation.flavor || item.variation.name
      lines.push(`   Sabor/Modelo: *${vLabel}*`)
    }
    lines.push(`   Qtd: *${item.quantity}x*  |  Unitário: ${formatCurrency(price)}`)
    lines.push(`   Subtotal: *${formatCurrency(price * item.quantity)}*`)
    if (item.product.sku) lines.push(`   Código: ${item.product.sku}`)
    // Product link
    const productUrl = `${catalogUrl}/product/${item.product.slug}`
    lines.push(`   🔗 ${productUrl}`)
    lines.push('')
  })

  lines.push('━━━━━━━━━━━━━━━━━━━━')
  if (promotion) {
    lines.push(`🎉 Promoção aplicada: *${promotion.name}*`)
  }
  lines.push(`💰 *TOTAL: ${formatCurrency(total)}*`)
  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('Aguardo confirmação! 😊')

  return lines.join('\n')
}

// ─── Checkout modal ───────────────────────────────────────────
function CheckoutModal({
  company, catalogUrl, promotion, primary, secondary, bg,
  onClose, onSent,
}: {
  company: Company
  catalogUrl: string
  promotion: Promotion | null
  primary: string
  secondary: string
  bg: string
  onClose: () => void
  onSent: () => void
}) {
  const { items, totalPrice, clearCart } = useCart()
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [name, setName] = useState('')
  const [delivery, setDelivery] = useState<boolean | null>(null)
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Informe seu nome'
    if (delivery === null) e.delivery = 'Escolha uma opção'
    if (delivery && !address.trim()) e.address = 'Informe o endereço de entrega'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSend() {
    if (!validate()) return
    const message = buildCartMessage({
      items,
      total: totalPrice,
      name: name.trim(),
      delivery: !!delivery,
      address: address.trim(),
      greeting: company.whatsapp_message || `Olá, ${company.name}!`,
      catalogUrl,
      promotion,
      companyName: company.name,
    })
    const url = buildWhatsAppUrl(company.whatsapp || '', message)
    window.open(url, '_blank')
    clearCart()
    onSent()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: bg, border: '1px solid rgba(255,255,255,0.08)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Color bar */}
        <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {step === 'review' && (
              <button onClick={() => setStep('form')} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <div>
              <h2 className="text-base font-black text-white">Finalizar Pedido</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {step === 'form' ? 'Dados para entrega' : 'Revise e envie'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/10">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {step === 'form' ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <User className="w-3.5 h-3.5 inline mr-1.5" style={{ color: primary }} />
                  Seu nome *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  placeholder="Como prefere ser chamado?"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: errors.name ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    fontSize: 16,
                  }}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Delivery or pickup */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Como vai receber? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: false, label: 'Retirar', sub: 'Busco no local', icon: ShoppingBag },
                    { value: true, label: 'Entrega', sub: 'Quero receber', icon: Bike },
                  ].map(opt => (
                    <button key={String(opt.value)}
                      onClick={() => { setDelivery(opt.value); setErrors(p => ({ ...p, delivery: '', address: '' })) }}
                      className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all"
                      style={delivery === opt.value
                        ? { background: `${primary}20`, border: `2px solid ${primary}`, boxShadow: `0 0 20px ${primary}30` }
                        : { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)' }
                      }>
                      <opt.icon className="w-6 h-6" style={{ color: delivery === opt.value ? primary : 'rgba(255,255,255,0.4)' }} />
                      <div className="text-center">
                        <div className="text-sm font-bold text-white">{opt.label}</div>
                        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
                      </div>
                      {delivery === opt.value && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: primary }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {errors.delivery && <p className="text-red-400 text-xs mt-1">{errors.delivery}</p>}
              </div>

              {/* Address - only if delivery */}
              {delivery === true && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-red-400" />
                    Endereço de entrega *
                  </label>
                  <textarea
                    value={address}
                    onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })) }}
                    placeholder="Rua, número, bairro, complemento, cidade..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none resize-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: errors.address ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                      fontSize: 16,
                    }}
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                </div>
              )}

              {/* Cart summary preview */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Resumo do Pedido</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {item.variation?.image_url || item.product.thumbnail_url
                          ? <img src={item.variation?.image_url || item.product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          : <Package className="w-4 h-4 m-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{item.product.name}</div>
                        {item.variation && (
                          <div className="text-[10px]" style={{ color: primary }}>{item.variation.flavor || item.variation.name}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-white">{item.quantity}x</div>
                        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {formatCurrency((item.promoPrice ?? item.unitPrice) * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                  <span className="text-base font-black text-white">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </>
          ) : (
            /* Review step */
            <div className="space-y-4">
              {/* Customer info */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4" style={{ color: primary }} />
                  <span className="text-sm font-bold text-white">Dados do Pedido</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Nome</span>
                  <span className="font-semibold text-white">{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Tipo</span>
                  <span className="font-semibold text-white">{delivery ? '🚴 Entrega' : '🏪 Retirada'}</span>
                </div>
                {delivery && (
                  <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Endereço:</div>
                    <div className="text-sm text-white mt-0.5">{address}</div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{items.length} produto{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {item.variation?.image_url || item.product.thumbnail_url
                          ? <img src={item.variation?.image_url || item.product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white leading-tight">{item.product.name}</div>
                        {item.variation && (
                          <div className="text-xs mt-0.5 font-medium" style={{ color: primary }}>{item.variation.flavor || item.variation.name}</div>
                        )}
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.quantity}x {formatCurrency(item.promoPrice ?? item.unitPrice)}</div>
                      </div>
                      <div className="text-sm font-black text-white flex-shrink-0">
                        {formatCurrency((item.promoPrice ?? item.unitPrice) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {promotion ? `Total c/ ${promotion.name}` : 'Total'}
                    </span>
                    <span className="text-xl font-black text-white">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Ao enviar, você será redirecionado para o WhatsApp com o pedido completo já formatado.
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-6 pt-3 flex-shrink-0 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: bg }}>
          {step === 'form' ? (
            <button onClick={() => { if (validate()) setStep('review') }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, boxShadow: `0 8px 30px ${primary}40` }}>
              Revisar pedido <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSend}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 8px 30px rgba(37,211,102,0.4)' }}>
              <MessageCircle className="w-5 h-5 fill-white" />
              Enviar pedido no WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Cart Drawer ──────────────────────────────────────────────
export function CartDrawer({
  company, catalogUrl, promotion, primary, secondary, bg,
}: {
  company: Company
  catalogUrl: string
  promotion: Promotion | null
  primary: string
  secondary: string
  bg: string
}) {
  const { items, isOpen, closeCart, removeItem, updateQty, totalItems, totalPrice } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  if (sent) return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Pedido enviado!</h2>
        <p className="text-zinc-400">Você foi redirecionado para o WhatsApp com seu pedido completo.</p>
        <button onClick={() => { setSent(false); closeCart() }}
          className="px-8 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
          Continuar comprando
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm"
        onClick={closeCart} />

      {/* Drawer - bottom on mobile, right on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-[9998] sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto sm:w-[400px] sm:h-full flex flex-col"
        style={{
          background: bg,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          animation: 'drawerUp 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        // On desktop override
      >
        {/* Top bar */}
        <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: primary }}>
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-base font-black text-white">Carrinho</span>
          </div>
          <button onClick={closeCart} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <ShoppingCart className="w-14 h-14 mb-4" style={{ color: 'rgba(255,255,255,0.08)' }} />
              <p className="font-semibold text-white">Carrinho vazio</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Adicione produtos para começar</p>
              <button onClick={closeCart}
                className="mt-5 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-80"
                style={{ background: `${primary}25`, border: `1px solid ${primary}40`, color: primary }}>
                Ver produtos
              </button>
            </div>
          ) : (
            items.map(item => {
              const price = item.promoPrice ?? item.unitPrice
              const img = item.variation?.image_url || item.product.thumbnail_url || item.product.images?.[0]
              return (
                <div key={item.id} className="flex gap-3 p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {img
                      ? <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-1">{item.product.name}</p>
                    {item.variation && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${primary}20`, color: primary }}>
                        {item.variation.flavor || item.variation.name}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <Minus className="w-3 h-3 text-white" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{formatCurrency(price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 px-4 pb-6 pt-3 space-y-3 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
              <span className="text-xl font-black text-white">{formatCurrency(totalPrice)}</span>
            </div>
            <button onClick={() => setShowCheckout(true)}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                boxShadow: '0 8px 30px rgba(37,211,102,0.35)',
              }}>
              <Send className="w-5 h-5" />
              Enviar pedido
            </button>
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          company={company}
          catalogUrl={catalogUrl}
          promotion={promotion}
          primary={primary}
          secondary={secondary}
          bg={bg}
          onClose={() => setShowCheckout(false)}
          onSent={() => { setShowCheckout(false); setSent(true) }}
        />
      )}

      <style>{`
        @keyframes drawerUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes drawerUp {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        }
      `}</style>
    </>
  )
}
