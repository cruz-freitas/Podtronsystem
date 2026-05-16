'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Product, ProductVariation } from '@/types'

export interface CartItem {
  id: string
  product: Product
  variation: ProductVariation | null
  quantity: number
  unitPrice: number
  promoPrice: number | null
}

interface CartCtx {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, variation: ProductVariation | null, unitPrice: number, promoPrice: number | null) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartCtx>({} as CartCtx)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  function makeId(product: Product, variation: ProductVariation | null) {
    return `${product.id}__${variation?.id ?? 'base'}`
  }

  function addItem(product: Product, variation: ProductVariation | null, unitPrice: number, promoPrice: number | null) {
    const id = makeId(product, variation)
    setItems(prev => {
      const found = prev.find(i => i.id === id)
      if (found) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { id, product, variation, quantity: 1, unitPrice, promoPrice }]
    })
    setIsOpen(true)
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeItem(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  function clearCart() { setItems([]) }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + (i.promoPrice ?? i.unitPrice) * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem, removeItem, updateQty, clearCart,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
