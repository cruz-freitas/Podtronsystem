#!/bin/bash
# ═══════════════════════════════════════════════════════
#  Gera os ícones PNG do PWA Poditron a partir do SVG
#  Precisa do `sharp-cli` ou `svgexport` instalado:
#    npm install -g sharp-cli
# ═══════════════════════════════════════════════════════

cd "$(dirname "$0")"

echo "Gerando ícones PWA..."

# Usando sharp-cli
npx sharp-cli --input icon.svg --output icon-192.png resize 192 192
npx sharp-cli --input icon.svg --output icon-512.png resize 512 512
npx sharp-cli --input icon.svg --output apple-icon-180.png resize 180 180

# Fallback com svgexport se sharp não estiver disponível
# npx svgexport icon.svg icon-192.png 192:192
# npx svgexport icon.svg icon-512.png 512:512

echo "✅ Ícones gerados em public/icons/"
