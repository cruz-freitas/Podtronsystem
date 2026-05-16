import type { Metadata, Viewport } from 'next'
import { companiesService, themesService } from '@/services/companies'

// Viewport com safe-area para notch/home indicator do iOS
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

// Gera metadata dinâmica por slug da empresa (OG, PWA, etc.)
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params

  try {
    const { data: company } = await companiesService.getBySlug(slug)
    if (!company) {
      return {
        title: 'Catálogo não encontrado',
        robots: { index: false },
      }
    }

    const { data: theme } = await themesService.getByCompanyId(company.id)
    const primary = theme?.primary_color || '#6366f1'

    const title = company.name
    const description =
      company.description ||
      `Confira o catálogo digital de ${company.name}. Produtos, preços e promoções atualizados.`
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const canonical = `${baseUrl}/catalog/${slug}`

    return {
      title: {
        default: title,
        template: `%s — ${title}`,
      },
      description,
      keywords: [company.name, 'catálogo', 'produtos', 'comprar', 'whatsapp'],
      authors: [{ name: company.name }],
      creator: company.name,

      // Manifest dinâmico por empresa
      manifest: `/api/manifest/${slug}`,

      // Ícones
      icons: {
        icon: [
          { url: `/api/pwa-icon/${slug}?size=32`, sizes: '32x32', type: 'image/svg+xml' },
          { url: `/api/pwa-icon/${slug}?size=192`, sizes: '192x192', type: 'image/svg+xml' },
        ],
        apple: [
          { url: `/api/pwa-icon/${slug}?size=180`, sizes: '180x180', type: 'image/svg+xml' },
        ],
        shortcut: `/api/pwa-icon/${slug}?size=48`,
      },

      // Open Graph
      openGraph: {
        type: 'website',
        locale: 'pt_BR',
        url: canonical,
        title,
        description,
        siteName: company.name,
        images: company.logo_url
          ? [{ url: company.logo_url, width: 512, height: 512, alt: company.name }]
          : [{ url: `/api/pwa-icon/${slug}?size=512`, width: 512, height: 512, alt: company.name }],
      },

      // Twitter card
      twitter: {
        card: 'summary',
        title,
        description,
        images: company.logo_url
          ? [company.logo_url]
          : [`/api/pwa-icon/${slug}?size=512`],
      },

      // Meta tags extras para PWA/mobile
      other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent',
        'apple-mobile-web-app-title': company.name,
        'application-name': company.name,
        'msapplication-TileColor': primary,
        'msapplication-tap-highlight': 'no',
        'theme-color': primary,
      },

      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      },
    }
  } catch {
    return {
      title: 'Catálogo',
      description: 'Catálogo digital Poditron',
    }
  }
}

export default function CatalogSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
