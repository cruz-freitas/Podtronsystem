'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import {
  Building2, User, Key, ArrowLeft, CheckCircle,
  Copy, Check, ExternalLink, Zap, Eye, EyeOff,
  DollarSign, FileText
} from 'lucide-react'
import { toast } from 'sonner'

type Step = 'form' | 'success'

interface CreatedAccess {
  company_name: string; slug: string
  email: string; password: string
  catalog_url: string; admin_url: string
  sale_value: number
}

export default function NewCompanyPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [createdAccess, setCreatedAccess] = useState<CreatedAccess | null>(null)

  const [form, setForm] = useState({
    company_name: '', slug: '', email_company: '',
    whatsapp: '', description: '', notes: '',
    sale_value: '', admin_name: '', admin_email: '', admin_password: '',
  })

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name || !form.slug || !form.admin_email || !form.admin_password) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (form.admin_password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    setLoading(true)

    try {
      // Check slug
      const { data: existing } = await supabase.from('companies').select('id').eq('slug', form.slug).single()
      if (existing) { toast.error('Slug já em uso. Escolha outro.'); setLoading(false); return }

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: form.company_name,
          slug: form.slug,
          email: form.email_company || form.admin_email,
          whatsapp: form.whatsapp || null,
          description: form.description || null,
          notes: form.notes || null,
          sale_value: form.sale_value ? parseFloat(form.sale_value) : 0,
          sold_at: new Date().toISOString(),
          plan: 'basic', // irrelevant, kept for compatibility
          is_active: true,
          whatsapp_message: `Olá! Tenho interesse em um produto da ${form.company_name}.`,
        })
        .select().single()

      if (companyError) throw new Error('Erro ao criar empresa: ' + companyError.message)

      // Create default theme
      await supabase.from('themes').insert({ company_id: company.id })

      // Create auth user via API route
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.admin_email,
          password: form.admin_password,
          full_name: form.admin_name || form.company_name + ' Admin',
          company_id: company.id,
          role: 'company_admin',
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        await supabase.from('companies').delete().eq('id', company.id)
        throw new Error(result.error || 'Erro ao criar usuário')
      }

      setCreatedAccess({
        company_name: form.company_name,
        slug: form.slug,
        email: form.admin_email,
        password: form.admin_password,
        catalog_url: `${window.location.origin}/catalog/${form.slug}`,
        admin_url: `${window.location.origin}/auth/login`,
        sale_value: parseFloat(form.sale_value) || 0,
      })
      setStep('success')
      toast.success('Empresa criada!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar empresa')
    }
    setLoading(false)
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputClass = "w-full px-3 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"

  // ── SUCCESS ──
  if (step === 'success' && createdAccess) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-5">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Venda Registrada!</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {createdAccess.sale_value > 0
              ? `Receita de R$ ${createdAccess.sale_value.toFixed(2).replace('.', ',')} adicionada`
              : 'Empresa criada com sucesso'
            }
          </p>
        </div>

        {/* Access card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #10b981)' }} />
          <div className="p-5 space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dados de acesso do cliente</p>
            {[
              { label: 'URL de Login', value: createdAccess.admin_url, id: 'login' },
              { label: 'Email', value: createdAccess.email, id: 'email' },
              { label: 'Senha', value: createdAccess.password, id: 'password', secret: true },
              { label: 'Link do Catálogo', value: createdAccess.catalog_url, id: 'catalog' },
            ].map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-600 mb-0.5">{item.label}</div>
                  <div className="text-sm text-white font-mono truncate">
                    {item.secret && !showPassword ? '••••••••••••' : item.value}
                  </div>
                </div>
                {item.secret && (
                  <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button onClick={() => copyText(item.value, item.id)} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors">
                  {copied === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <button onClick={() => copyText(
              `🏪 ${createdAccess.company_name}\n\n🔗 Login: ${createdAccess.admin_url}\n📧 Email: ${createdAccess.email}\n🔑 Senha: ${createdAccess.password}\n🛒 Catálogo: ${createdAccess.catalog_url}`,
              'all'
            )} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#a855f7' }}>
              {copied === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied === 'all' ? 'Copiado!' : 'Copiar tudo para enviar ao cliente'}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">Guarde a senha agora. Ela não pode ser recuperada depois.</p>
        </div>

        <div className="flex gap-3">
          <a href={`/catalog/${createdAccess.slug}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            <ExternalLink className="w-4 h-4" /> Ver Catálogo
          </a>
          <a href="/super-admin/companies/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <Building2 className="w-4 h-4" /> Nova venda
          </a>
          <a href="/super-admin/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            Dashboard
          </a>
        </div>
      </div>
    )
  }

  // ── FORM ──
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/super-admin/companies"
          className="p-2 rounded-xl transition-colors hover:opacity-70"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </a>
        <div>
          <h1 className="text-2xl font-black text-white">Registrar Nova Venda</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Crie a empresa e gere os acessos para o cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Company info */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" /> Dados da Empresa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome da Empresa *</label>
              <input value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value, slug: slugify(e.target.value) }))}
                required placeholder="Ex: Vape Store Premium" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Slug * <span className="text-zinc-600 text-xs">(URL do catálogo)</span>
              </label>
              <input value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                required placeholder="vape-store-premium" className={`${inputClass} font-mono`} />
              {form.slug && (
                <p className="text-[10px] text-zinc-600 mt-1">/catalog/<span className="text-purple-400">{form.slug}</span></p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">WhatsApp</label>
              <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="5511999999999" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email da Empresa</label>
              <input type="email" value={form.email_company} onChange={e => setForm(f => ({ ...f, email_company: e.target.value }))}
                placeholder="contato@empresa.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição que aparece no catálogo" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Sale value */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0c0c14', border: '1px solid rgba(16,185,129,0.15)' }}>
          <h3 className="text-white font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Valor da Venda
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Valor cobrado do cliente
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">R$</span>
                <input type="number" min="0" step="0.01" value={form.sale_value}
                  onChange={e => setForm(f => ({ ...f, sale_value: e.target.value }))}
                  placeholder="0,00"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <p className="text-xs text-zinc-600 mt-1">Esse valor entra na sua receita total</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Observações internas</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: cliente do Instagram, pago via PIX..." className={inputClass} />
            </div>
          </div>
        </div>

        {/* Admin user */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" /> Acesso do Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
              <input value={form.admin_name} onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))}
                placeholder="Nome do responsável" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email de Login *</label>
              <input type="email" value={form.admin_email}
                onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                required placeholder="email@cliente.com" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Senha *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={showPassword ? 'text' : 'password'} value={form.admin_password}
                    onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                    required placeholder="Mínimo 6 caracteres"
                    className={`${inputClass} font-mono pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, admin_password: generatePassword() }))}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                  Gerar
                </button>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-black text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 30px rgba(124,58,237,0.3)' }}>
          {loading
            ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando...</>
            : <><Key className="w-5 h-5" /> Registrar Venda e Criar Acesso</>
          }
        </button>
      </form>
    </div>
  )
}
