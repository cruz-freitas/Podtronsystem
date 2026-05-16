// =============================================
// SISTEMA PODITRON - Types
// =============================================

export type UserRole = 'super_admin' | 'company_admin' | 'seller'
export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'devolucao'
export type DiscountType = 'percentage' | 'fixed'

// =============================================
// COMPANY
// =============================================
export interface Company {
  id: string
  name: string
  slug: string
  logo_url?: string
  favicon_url?: string
  whatsapp?: string
  whatsapp_message?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  website?: string
  description?: string
  tagline?: string
  is_active: boolean
  plan: string
  sale_value?: number
  sold_at?: string
  notes?: string
  custom_domain?: string
  created_at: string
  updated_at: string
}

// =============================================
// THEME
// =============================================
export interface Theme {
  id: string
  company_id: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  surface_color: string
  text_color: string
  text_muted_color: string
  font_family: string
  border_radius: string
  dark_mode: boolean
  card_style: 'modern' | 'minimal' | 'glass'
  layout_style: 'grid' | 'list' | 'masonry'
  created_at: string
  updated_at: string
}

// =============================================
// USER
// =============================================
export interface User {
  id: string
  company_id?: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

// =============================================
// CATEGORY
// =============================================
export interface Category {
  id: string
  company_id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  icon?: string
  color?: string
  is_active: boolean
  sort_order: number
  parent_id?: string
  created_at: string
  updated_at: string
  products_count?: number
}

// =============================================
// PRODUCT
// =============================================
export interface Product {
  id: string
  company_id: string
  category_id?: string
  name: string
  slug: string
  description?: string
  short_description?: string
  sku?: string
  brand?: string
  model?: string
  price: number
  original_price?: number
  cost_price?: number
  images: string[]
  thumbnail_url?: string
  is_active: boolean
  is_featured: boolean
  is_available: boolean
  has_variations: boolean
  stock_quantity: number
  min_stock_alert: number
  tags: string[]
  whatsapp_message?: string
  views_count: number
  sort_order: number
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
  category?: Category
  variations?: ProductVariation[]
}

// =============================================
// PRODUCT VARIATION
// =============================================
export interface ProductVariation {
  id: string
  product_id: string
  company_id: string
  name: string
  sku?: string
  flavor?: string
  color?: string
  color_hex?: string
  size?: string
  puffs?: number
  price?: number
  original_price?: number
  image_url?: string
  images: string[]
  stock_quantity: number
  is_active: boolean
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// =============================================
// INVENTORY MOVEMENT
// =============================================
export interface InventoryMovement {
  id: string
  company_id: string
  product_id: string
  variation_id?: string
  user_id?: string
  type: MovementType
  quantity: number
  quantity_before: number
  quantity_after: number
  reason?: string
  notes?: string
  created_at: string
  product?: Product
  variation?: ProductVariation
  user?: User
}

// =============================================
// PROMOTION
// =============================================
export interface Promotion {
  id: string
  company_id: string
  name: string
  description?: string
  discount_type: DiscountType
  discount_value: number
  start_date?: string
  end_date?: string
  is_active: boolean
  banner_url?: string
  highlight_color: string
  created_at: string
  updated_at: string
  products?: Product[]
}

// =============================================
// BANNER
// =============================================
export interface Banner {
  id: string
  company_id: string
  title?: string
  subtitle?: string
  image_url: string
  mobile_image_url?: string
  link_url?: string
  link_text?: string
  link_type?: string
  link_reference_id?: string
  is_active: boolean
  sort_order: number
  starts_at?: string
  ends_at?: string
  created_at: string
  updated_at: string
}

// =============================================
// SETTINGS
// =============================================
export interface Setting {
  id: string
  company_id: string
  key: string
  value?: string
  created_at: string
  updated_at: string
}

// =============================================
// API RESPONSE
// =============================================
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

// =============================================
// DASHBOARD STATS
// =============================================
export interface DashboardStats {
  total_products: number
  active_products: number
  out_of_stock: number
  low_stock: number
  featured_products: number
  total_categories: number
  total_views: number
  active_promotions: number
}
