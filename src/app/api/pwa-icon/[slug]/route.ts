import { NextRequest, NextResponse } from 'next/server'
import { companiesService, themesService } from '@/services/companies'

// Gera ícone PWA dinamicamente com as cores e iniciais da empresa
// GET /api/pwa-icon/[slug]?size=192&maskable=1
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const size = parseInt(req.nextUrl.searchParams.get('size') || '192')
  const maskable = req.nextUrl.searchParams.get('maskable') === '1'

  try {
    const { data: company } = await companiesService.getBySlug(slug)
    const { data: theme } = company
      ? await themesService.getByCompanyId(company.id)
      : { data: null }

    const primary = theme?.primary_color || '#6366f1'
    const secondary = theme?.secondary_color || '#8b5cf6'
    const name = company?.name || 'P'
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join('')

    // Padding para ícone maskable (zona segura ~10%)
    const pad = maskable ? Math.round(size * 0.1) : 0
    const inner = size - pad * 2
    const cx = size / 2
    const cy = size / 2
    const r = inner / 2
    const fontSize = Math.round(inner * 0.38)
    const iconSize = Math.round(inner * 0.3)
    const iconY = cy - inner * 0.04

    // SVG do ícone com gradiente e texto
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>

  <!-- Fundo escuro (para maskable mostrar cor atrás do círculo) -->
  ${maskable ? `<rect width="${size}" height="${size}" fill="#06060a"/>` : ''}

  <!-- Círculo principal com gradiente -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bg)" filter="url(#shadow)"/>

  <!-- Brilho superior -->
  <ellipse cx="${cx}" cy="${cy - r * 0.2}" rx="${r * 0.75}" ry="${r * 0.4}" fill="url(#shine)" opacity="0.6"/>

  <!-- Ícone de vento / símbolo -->
  <g transform="translate(${cx - iconSize / 2}, ${iconY - iconSize * 1.1})" opacity="0.9">
    <!-- Wind icon simplificado -->
    <path d="M${iconSize * 0.05} ${iconSize * 0.35} Q${iconSize * 0.4} ${iconSize * 0.15} ${iconSize * 0.7} ${iconSize * 0.35} Q${iconSize * 0.85} ${iconSize * 0.45} ${iconSize * 0.7} ${iconSize * 0.55} Q${iconSize * 0.55} ${iconSize * 0.65} ${iconSize * 0.35} ${iconSize * 0.55}"
          stroke="white" stroke-width="${iconSize * 0.09}" stroke-linecap="round" fill="none"/>
    <path d="M${iconSize * 0.05} ${iconSize * 0.55} Q${iconSize * 0.3} ${iconSize * 0.38} ${iconSize * 0.55} ${iconSize * 0.55} Q${iconSize * 0.65} ${iconSize * 0.63} ${iconSize * 0.55} ${iconSize * 0.72} Q${iconSize * 0.45} ${iconSize * 0.82} ${iconSize * 0.35} ${iconSize * 0.72}"
          stroke="white" stroke-width="${iconSize * 0.09}" stroke-linecap="round" fill="none" opacity="0.7"/>
  </g>

  <!-- Iniciais da empresa -->
  <text x="${cx}" y="${cy + fontSize * 0.55}"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${fontSize}"
        font-weight="900"
        fill="white"
        letter-spacing="-1">
    ${initials}
  </text>
</svg>`

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // 24h cache
      },
    })
  } catch (err) {
    console.error('[pwa-icon]', err)
    // Fallback: ícone genérico Poditron
    const fallback = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#6366f1"/>
      <text x="${size/2}" y="${size*0.62}" text-anchor="middle" font-size="${size*0.4}" font-weight="900" fill="white">P</text>
    </svg>`
    return new NextResponse(fallback, {
      headers: { 'Content-Type': 'image/svg+xml' },
    })
  }
}
