import { NextRequest, NextResponse } from 'next/server'
import { companiesService, themesService } from '@/services/companies'

// Gera manifest.json dinâmico por empresa para o catálogo PWA
// GET /api/manifest/[slug]
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    const { data: company } = await companiesService.getBySlug(slug)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { data: theme } = await themesService.getByCompanyId(company.id)

    const primary = theme?.primary_color || '#6366f1'
    const bg = theme?.background_color || '#06060a'

    const manifest = {
      name: company.name,
      short_name: company.name.split(' ')[0],
      description: company.description || `Catálogo digital de ${company.name}`,
      start_url: `/catalog/${slug}`,
      scope: `/catalog/${slug}`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: bg,
      theme_color: primary,
      lang: 'pt-BR',
      categories: ['shopping', 'business'],
      icons: [
        // Ícone gerado dinamicamente com as cores da empresa
        {
          src: `/api/pwa-icon/${slug}?size=192`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `/api/pwa-icon/${slug}?size=512`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `/api/pwa-icon/${slug}?size=192&maskable=1`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: `/api/pwa-icon/${slug}?size=512&maskable=1`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        // Se a empresa tem logo, inclui também
        ...(company.logo_url
          ? [{ src: company.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any' }]
          : []),
      ],
      screenshots: [],
      shortcuts: [
        {
          name: `Ver produtos de ${company.name}`,
          short_name: 'Produtos',
          url: `/catalog/${slug}`,
          description: `Catálogo completo de ${company.name}`,
        },
      ],
      share_target: {
        action: `/catalog/${slug}`,
        method: 'GET',
        params: { text: 'search' },
      },
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600', // 1h cache
      },
    })
  } catch (err) {
    console.error('[manifest]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
