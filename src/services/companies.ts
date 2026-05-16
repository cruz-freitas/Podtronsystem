import { supabase } from '@/lib/supabase'
import type { Company, Theme, Category, Banner, Promotion, ApiResponse } from '@/types'

// =============================================
// COMPANIES SERVICE
// =============================================

export const companiesService = {
  async getAll(): Promise<ApiResponse<Company[]>> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')
      if (error) throw error
      return { data: data as Company[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getBySlug(slug: string): Promise<ApiResponse<Company>> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (error) throw error
      return { data: data as Company, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getById(id: string): Promise<ApiResponse<Company>> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return { data: data as Company, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async create(company: Partial<Company>): Promise<ApiResponse<Company>> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single()
      if (error) throw error

      // Create default theme
      await themesService.createDefault(data.id)
      return { data: data as Company, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async update(id: string, updates: Partial<Company>): Promise<ApiResponse<Company>> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { data: data as Company, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}

// =============================================
// THEMES SERVICE
// =============================================

export const themesService = {
  async getByCompanyId(companyId: string): Promise<ApiResponse<Theme>> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('company_id', companyId)
        .single()
      if (error) throw error
      return { data: data as Theme, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async createDefault(companyId: string): Promise<ApiResponse<Theme>> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert({ company_id: companyId })
        .select()
        .single()
      if (error) throw error
      return { data: data as Theme, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async update(companyId: string, updates: Partial<Theme>): Promise<ApiResponse<Theme>> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .update(updates)
        .eq('company_id', companyId)
        .select()
        .single()
      if (error) throw error
      return { data: data as Theme, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}

// =============================================
// CATEGORIES SERVICE
// =============================================

export const categoriesService = {
  async getAll(companyId: string): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order')
      if (error) throw error
      return { data: data as Category[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getActive(companyId: string): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return { data: data as Category[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async create(category: Partial<Category>): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single()
      if (error) throw error
      return { data: data as Category, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async update(id: string, updates: Partial<Category>): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { data: data as Category, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      return { data: null, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}

// =============================================
// BANNERS SERVICE
// =============================================

export const bannersService = {
  async getActive(companyId: string): Promise<ApiResponse<Banner[]>> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return { data: data as Banner[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getAll(companyId: string): Promise<ApiResponse<Banner[]>> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order')
      if (error) throw error
      return { data: data as Banner[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async create(banner: Partial<Banner>): Promise<ApiResponse<Banner>> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert(banner)
        .select()
        .single()
      if (error) throw error
      return { data: data as Banner, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async update(id: string, updates: Partial<Banner>): Promise<ApiResponse<Banner>> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { data: data as Banner, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
      return { data: null, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}

// =============================================
// PROMOTIONS SERVICE
// =============================================

export const promotionsService = {
  // Get active promotions for catalog (checks date range too)
  async getActiveCatalog(companyId: string): Promise<ApiResponse<Promotion[]>> {
    try {
      const now = new Date().toISOString()
      let query = supabase
        .from('promotions')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error

      // Filter by date range if set
      const active = (data as Promotion[]).filter(p => {
        if (p.start_date && new Date(p.start_date) > new Date()) return false
        if (p.end_date && new Date(p.end_date) < new Date()) return false
        return true
      })

      return { data: active, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },

  async getAll(companyId: string): Promise<ApiResponse<Promotion[]>> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { data: data as Promotion[], error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  },
}
