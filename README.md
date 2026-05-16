# 🚀 Sistema Poditron

SaaS multiempresa para catálogos digitais com integração WhatsApp.

## Stack

- **Frontend**: Next.js 14 + TypeScript
- **Estilização**: TailwindCSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hospedagem**: Vercel
- **Ícones**: Lucide React
- **Charts**: Recharts
- **Notificações**: Sonner

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── admin/              # Painel administrativo
│   │   ├── dashboard/      # Dashboard com métricas
│   │   ├── products/       # Gestão de produtos
│   │   ├── categories/     # Categorias
│   │   ├── inventory/      # Controle de estoque
│   │   ├── promotions/     # Promoções
│   │   ├── banners/        # Banners
│   │   ├── appearance/     # Personalização visual
│   │   ├── users/          # Usuários
│   │   └── settings/       # Configurações + WhatsApp
│   ├── auth/login/         # Autenticação
│   └── catalog/[slug]/     # Catálogo público da empresa
├── components/
│   ├── admin/              # Componentes do painel
│   └── catalog/            # Componentes do catálogo
├── context/
│   └── AuthContext.tsx     # Contexto de autenticação
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   └── utils.ts            # Utilitários
├── services/
│   ├── companies.ts        # Companies, themes, categories, banners
│   ├── products.ts         # Produtos e variações
│   └── inventory.ts        # Controle de estoque
└── types/
    └── index.ts            # TypeScript types
```

---

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

O arquivo `.env.local` já está configurado com o Supabase do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qkfptzxiibymtanyrchf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Criar usuário administrador

Acesse o Supabase Dashboard → Authentication → Users → Create User.

Depois execute no SQL Editor:

```sql
INSERT INTO users (id, full_name, role, is_active)
VALUES (
  'UUID_DO_USUARIO_CRIADO',
  'Super Admin',
  'super_admin',
  true
);
```

Para criar um admin de empresa:

```sql
INSERT INTO users (id, company_id, full_name, role, is_active)
VALUES (
  'UUID_DO_USUARIO',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- ID da empresa demo
  'Admin Vape Store',
  'company_admin',
  true
);
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Redirect para /admin/dashboard |
| `/auth/login` | Login admin |
| `/admin/dashboard` | Dashboard com métricas |
| `/admin/products` | Gestão de produtos |
| `/admin/categories` | Categorias |
| `/admin/inventory` | Controle de estoque |
| `/admin/appearance` | Personalização visual |
| `/catalog/[slug]` | Catálogo público da empresa |
| `/catalog/[slug]/product/[productSlug]` | Detalhe do produto |

---

## Banco de Dados

### Tabelas criadas:
- `companies` — Empresas do SaaS
- `themes` — Personalização visual por empresa
- `users` — Usuários com roles
- `categories` — Categorias de produtos
- `products` — Produtos
- `product_variations` — Variações (sabores, cores, etc.)
- `inventory_movements` — Histórico de estoque
- `promotions` — Promoções
- `promotion_products` — Produtos em promoção
- `banners` — Banners do catálogo
- `settings` — Configurações por empresa

### RLS (Row Level Security):
Todas as tabelas têm RLS ativo com políticas separando dados por empresa.

---

## Deploy na Vercel

1. Suba o projeto para um repositório GitHub
2. Conecte no Vercel
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## Empresa Demo

ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`  
Catálogo: `/catalog/vapestore`

---

## Funcionalidades

### Painel Admin
- ✅ Dashboard com gráficos e métricas
- ✅ Gestão de produtos com variações
- ✅ Filtros e busca de produtos
- ✅ Toggle featured/active/available
- ✅ Controle de estoque com histórico
- ✅ Personalização visual (cores, temas)
- ✅ Sidebar com navegação completa

### Catálogo Público
- ✅ Design premium dark mode
- ✅ Banner slider automático
- ✅ Filtro por categorias
- ✅ Busca de produtos
- ✅ Cards com variações (sabores)
- ✅ Botão "Chamar no WhatsApp" com mensagem personalizada
- ✅ Produto em destaque separado
- ✅ Botão WhatsApp flutuante
- ✅ Página de detalhe do produto
- ✅ Galeria de imagens com navegação
- ✅ Mobile first / totalmente responsivo

### Multiempresa
- ✅ Dados isolados por company_id
- ✅ RLS no Supabase
- ✅ Temas individuais por empresa
- ✅ WhatsApp próprio por empresa

---

## Próximos passos sugeridos

- [ ] Upload de imagens via Supabase Storage
- [ ] Página de categorias no admin
- [ ] Gestão de banners no admin
- [ ] Sistema de promoções completo
- [ ] Gestão de usuários
- [ ] Configurações completas de WhatsApp
- [ ] PWA (Progressive Web App)
- [ ] Analytics de visualizações
- [ ] Checkout / Carrinho
- [ ] PIX integration
