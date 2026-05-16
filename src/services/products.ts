import { supabase } from '@/lib/supabase'
import type { Product, ProductVariation, ApiResponse } from '@/types'

export const productsService = {
  async getAll(companyId: string, filters?: {
    categoryId?: string
    isActive?: boolean
    isFeatured?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<Product[]>> {
    try {
      let query = supabase
        .from('products')
        .select(`*, category:categories(id, name, slug, color, icon), variations:product_variations(*)`, { count: 'exact' })
        .eq('company_id', companyId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive)
      if (filters?.isFeatured) query = query.eq('is_featured', true)
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`)

      const limit = filters?.limit || 100
      const page = filters?.page || 1
      const from = (page - 1) * limit
      query = query.range(from, from + limit - 1)

      const { data, error, count } = await query
      if (error) throw error
      return { data: data as Product[], error: null, count: count || 0 }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getBySlug(companyId: string, slug: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:categories(*), variations:product_variations(*)`)
        .eq('company_id', companyId)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (error) throw error
      await supabase.from('products').update({ views_count: (data.views_count || 0) + 1 }).eq('id', data.id)
      return { data: data as Product, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getFeatured(companyId: string, limit = 8): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:categories(id, name, slug), variations:product_variations(*)`)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(limit)
      if (error) throw error
      return { data: data as Product[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async create(product: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase.from('products').insert(product).select().single()
      if (error) throw error
      return { data: data as Product, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
      if (error) throw error
      return { data: data as Product, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      return { data: null, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getLowStock(companyId: string): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, variations:product_variations(*)')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true })
        .limit(20)
      if (error) throw error
      // Filter: products where total stock (own or sum of variations) <= min_stock_alert
      const lowStock = (data as Product[]).filter(p => {
        if (p.has_variations && p.variations?.length) {
          const total = p.variations.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
          return total <= p.min_stock_alert
        }
        return p.stock_quantity <= p.min_stock_alert
      })
      return { data: lowStock, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getStats(companyId: string) {
    try {
      // Get all products with variations
      const { data: products } = await supabase
        .from('products')
        .select('id, is_active, is_featured, has_variations, stock_quantity, min_stock_alert, variations:product_variations(stock_quantity)')
        .eq('company_id', companyId)

      if (!products) return { total: 0, active: 0, featured: 0, outOfStock: 0, lowStock: 0 }

      const total = products.length
      const active = products.filter(p => p.is_active).length
      const featured = products.filter(p => p.is_featured).length

      let outOfStock = 0
      let lowStock = 0

      products.filter(p => p.is_active).forEach(p => {
        let stock = 0
        if (p.has_variations && (p.variations as any[])?.length) {
          stock = (p.variations as any[]).reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0)
        } else {
          stock = p.stock_quantity || 0
        }
        if (stock === 0) outOfStock++
        else if (stock <= (p.min_stock_alert || 5)) lowStock++
      })

      return { total, active, featured, outOfStock, lowStock }
    } catch {
      return { total: 0, active: 0, featured: 0, outOfStock: 0, lowStock: 0 }
    }
  },
}

export const variationsService = {
  async create(variation: Partial<ProductVariation>): Promise<ApiResponse<ProductVariation>> {
    try {
      const { data, error } = await supabase.from('product_variations').insert(variation).select().single()
      if (error) throw error
      return { data: data as ProductVariation, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async update(id: string, updates: Partial<ProductVariation>): Promise<ApiResponse<ProductVariation>> {
    try {
      const { data, error } = await supabase.from('product_variations').update(updates).eq('id', id).select().single()
      if (error) throw error
      return { data: data as ProductVariation, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('product_variations').delete().eq('id', id)
      if (error) throw error
      return { data: null, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}
