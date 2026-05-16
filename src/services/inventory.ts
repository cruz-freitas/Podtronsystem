import { supabase } from '@/lib/supabase'
import type { InventoryMovement, ApiResponse } from '@/types'

export const inventoryService = {
  async getMovements(companyId: string, productId?: string): Promise<ApiResponse<InventoryMovement[]>> {
    try {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          product:products(id, name, slug, thumbnail_url),
          variation:product_variations(id, name, flavor)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query
      if (error) throw error
      return { data: data as InventoryMovement[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async addMovement(movement: {
    company_id: string
    product_id: string
    variation_id?: string
    user_id: string
    type: 'entrada' | 'saida' | 'ajuste' | 'devolucao'
    quantity: number
    reason?: string
    notes?: string
  }): Promise<ApiResponse<InventoryMovement>> {
    try {
      // Get current stock
      let currentStock = 0
      if (movement.variation_id) {
        const { data } = await supabase
          .from('product_variations')
          .select('stock_quantity')
          .eq('id', movement.variation_id)
          .single()
        currentStock = data?.stock_quantity || 0
      } else {
        const { data } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', movement.product_id)
          .single()
        currentStock = data?.stock_quantity || 0
      }

      let quantityAfter = currentStock
      if (movement.type === 'entrada' || movement.type === 'devolucao') {
        quantityAfter = currentStock + movement.quantity
      } else if (movement.type === 'saida') {
        quantityAfter = Math.max(0, currentStock - movement.quantity)
      } else if (movement.type === 'ajuste') {
        quantityAfter = movement.quantity
      }

      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          ...movement,
          quantity_before: currentStock,
          quantity_after: quantityAfter,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as InventoryMovement, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}
