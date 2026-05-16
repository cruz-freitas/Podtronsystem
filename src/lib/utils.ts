import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

/**
 * Builds a rich WhatsApp message with product details
 * The greeting template from company settings is used as opening,
 * then product details are appended automatically.
 */
export function buildProductWhatsAppMessage(options: {
  productName: string
  brand?: string
  sku?: string
  variation?: string
  price?: number
  catalogUrl?: string
  greeting?: string // company's custom greeting/template
}): string {
  const { productName, brand, sku, variation, price, catalogUrl, greeting } = options

  const lines: string[] = []

  // Use company greeting or default
  lines.push(greeting || 'Olá! Vi seu catálogo online e tenho interesse em um produto.')
  lines.push('')

  // Product details block
  lines.push('🛍️ *Produto:*')
  if (brand) lines.push(`Marca: ${brand}`)
  lines.push(`Produto: *${productName}*`)
  if (variation) lines.push(`Sabor/Variação: *${variation}*`)
  if (price) lines.push(`Preço: *${formatCurrency(price)}*`)
  if (sku) lines.push(`Código: ${sku}`)

  // Product link
  if (catalogUrl) {
    lines.push('')
    lines.push(`🔗 *Link do produto:*`)
    lines.push(catalogUrl)
  }

  lines.push('')
  lines.push('Poderia me dar mais informações? 😊')

  return lines.join('\n')
}

export function calculateDiscount(original: number, current: number): number {
  if (!original || original <= current) return 0
  return Math.round(((original - current) / original) * 100)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function generateSKU(prefix: string, id: string): string {
  return `${prefix.toUpperCase()}-${id.substring(0, 8).toUpperCase()}`
}
