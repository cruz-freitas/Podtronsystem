'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { categoriesService } from '@/services/companies'
import { productsService, variationsService } from '@/services/products'
import type { Category } from '@/types'
import { slugify } from '@/lib/utils'
import { ImageUpload } from '@/components/ui/ImageUpload'
import {
  ArrowLeft, Plus, Trash2, Save, Package,
  Star, Tag, DollarSign, Settings2
} from 'lucide-react'
import { toast } from 'sonner'

interface VariationForm {
  name: string
  flavor: string
  color: string
  puffs: string
  price: string
  stock_quantity: string
  is_active: boolean
  image_url: string
}

const emptyVar: VariationForm = {
  name: '', flavor: '', color: '', puffs: '', price: '', stock_quantity: '0', is_active: true, image_url: ''
}

export default function NewProductPage() {
  const { company } = useAuth()
  const router = useRouter()
  const mountedRef = useRef(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [hasVariations, setHasVariations] = useState(false)
  const [variations, setVariations] = useState<VariationForm[]>([{ ...emptyVar }])
  const [form, setForm] = useState({
    name: '', slug: '', brand: '', model: '', category_id: '',
    description: '', price: '', original_price: '', stock_quantity: '0',
    sku: '', is_active: true, is_featured: false, is_available: true,
    tags: '',
  })

  useEffect(() => {
    mountedRef.current = true
    if (!company?.id) return
    categoriesService.getAll(company.id).then(({ data }) => {
      if (mountedRef.current && data) setCategories(data)
    })
    return () => { mountedRef.current = false }
  }, [company?.id])

  function setField(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function updateVar(i: number, field: keyof VariationForm, value: any) {
    setVariations(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  function addVariation() {
    setVariations(prev => [...prev, { ...emptyVar }])
  }

  function removeVar(index: number) {
    setVariations(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form.name) { toast.error('Nome é obrigatório'); return }
    if (!form.price) { toast.error('Preço é obrigatório'); return }
    if (!company?.id) return
    setSaving(true)
    try {
      const { data: product, error } = await productsService.create({
        company_id: company.id,
        name: form.name,
        slug: form.slug || slugify(form.name),
        brand: form.brand || undefined,
        model: form.model || undefined,
        category_id: form.category_id || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : undefined,
        stock_quantity: hasVariations ? 0 : parseInt(form.stock_quantity) || 0,
        sku: form.sku || undefined,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_available: form.is_available,
        has_variations: hasVariations,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: [],
      })

      if (error || !product) throw new Error(error || 'Erro ao criar')

      if (hasVariations) {
        for (const v of variations) {
          if (!v.name && !v.flavor) continue
          await variationsService.create({
            product_id: product.id,
            company_id: company.id,
            name: v.name || v.flavor,
            flavor: v.flavor || undefined,
            color: v.color || undefined,
            puffs: v.puffs ? parseInt(v.puffs) : undefined,
            price: v.price ? parseFloat(v.price) : parseFloat(form.price),
            stock_quantity: parseInt(v.stock_quantity) || 0,
            is_active: v.is_active,
            is_available: parseInt(v.stock_quantity) > 0,
            image_url: v.image_url || undefined,
            images: v.image_url ? [v.image_url] : [],
          })
        }
      }

      toast.success('Produto criado!')
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar produto')
    }
    setSaving(false)
  }

  const inputClass = "w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
  const labelClass = "block text-sm font-medium text-zinc-400 mb-1.5"

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Novo Produto</h1>
            <p className="text-zinc-400 text-sm">Preencha os dados do produto</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" /> Informações Básicas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome do Produto *</label>
                <input value={form.name}
                  onChange={e => { setField('name', e.target.value); setField('slug', slugify(e.target.value)) }}
                  placeholder="Ex: Ignite V150" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Marca</label>
                <input value={form.brand} onChange={e => setField('brand', e.target.value)}
                  placeholder="Ex: Ignite" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Modelo</label>
                <input value={form.model} onChange={e => setField('model', e.target.value)}
                  placeholder="Ex: V150" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Categoria</label>
                <select value={form.category_id} onChange={e => setField('category_id', e.target.value)} className={inputClass}>
                  <option value="">Sem categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>SKU</label>
                <input value={form.sku} onChange={e => setField('sku', e.target.value)}
                  placeholder="Código interno" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição</label>
                <textarea value={form.description} onChange={e => setField('description', e.target.value)}
                  rows={3} placeholder="Descreva o produto..."
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Tags <span className="text-zinc-600 text-xs">(separadas por vírgula)</span></label>
                <input value={form.tags} onChange={e => setField('tags', e.target.value)}
                  placeholder="destaque, promoção, novo" className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Preço e Estoque
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Preço *</label>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setField('price', e.target.value)}
                  placeholder="0,00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Preço Original <span className="text-zinc-600 text-xs">(riscado)</span></label>
                <input type="number" min="0" step="0.01" value={form.original_price}
                  onChange={e => setField('original_price', e.target.value)}
                  placeholder="0,00" className={inputClass} />
              </div>
              {!hasVariations && (
                <div>
                  <label className={labelClass}>Estoque</label>
                  <input type="number" min="0" value={form.stock_quantity}
                    onChange={e => setField('stock_quantity', e.target.value)}
                    className={inputClass} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-400" /> Variações
              </h3>
              <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${hasVariations ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                onClick={() => setHasVariations(!hasVariations)}>
                <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${hasVariations ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {hasVariations && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">Adicione os sabores, cores ou tamanhos. Cada variação pode ter sua própria foto.</p>
                {variations.map((v, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Variação {i + 1}</span>
                      {variations.length > 1 && (
                        <button onClick={() => removeVar(i)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Foto da variação */}
                      <div className="flex-shrink-0">
                        <label className="block text-xs text-zinc-500 mb-1.5">📷 Foto</label>
                        <ImageUpload
                          value={v.image_url}
                          onChange={url => updateVar(i, 'image_url', url)}
                          onRemove={() => updateVar(i, 'image_url', '')}
                          bucket="products"
                          folder="variations"
                          size="md"
                        />
                      </div>

                      {/* Campos da variação */}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1">Sabor / Nome *</label>
                          <input value={v.flavor} onChange={e => updateVar(i, 'flavor', e.target.value)}
                            placeholder="Ex: Blueberry Ice" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Puffs</label>
                          <input type="number" value={v.puffs} onChange={e => updateVar(i, 'puffs', e.target.value)}
                            placeholder="15000" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Preço</label>
                          <input type="number" step="0.01" value={v.price} onChange={e => updateVar(i, 'price', e.target.value)}
                            placeholder={form.price || '0.00'} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Estoque</label>
                          <input type="number" min="0" value={v.stock_quantity}
                            onChange={e => updateVar(i, 'stock_quantity', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Cor</label>
                          <input value={v.color} onChange={e => updateVar(i, 'color', e.target.value)}
                            placeholder="Ex: Azul" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addVariation}
                  className="flex items-center gap-2 w-full py-2.5 border border-dashed border-zinc-700 hover:border-indigo-500 text-zinc-500 hover:text-indigo-400 rounded-xl text-sm transition-colors justify-center">
                  <Plus className="w-4 h-4" /> Adicionar variação
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" /> Status
            </h3>
            {[
              { label: 'Produto Ativo', desc: 'Visível no sistema', key: 'is_active' },
              { label: 'Disponível', desc: 'Pode ser comprado', key: 'is_available' },
              { label: 'Destaque', desc: 'Aparece em destaque', key: 'is_featured' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-1.5">
                    {item.label}
                    {item.key === 'is_featured' && <Star className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-xs text-zinc-500">{item.desc}</div>
                </div>
                <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${(form as any)[item.key] ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  onClick={() => setField(item.key, !(form as any)[item.key])}>
                  <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${(form as any)[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm">URL do Produto</h3>
            <input value={form.slug} onChange={e => setField('slug', slugify(e.target.value))}
              placeholder="url-do-produto"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            <p className="text-xs text-zinc-600">Gerado automaticamente pelo nome</p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Produto
          </button>
        </div>
      </div>
    </div>
  )
}
