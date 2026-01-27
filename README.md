# Inovare – Médicos (Next.js + Cloudflare Pages)

Mini-site público para perfis de médicos (SSG) com rotas amigáveis e QR curto. Stack: Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion. Hospedagem em Cloudflare Pages com Functions para reviews do Google.

## Como rodar local
- Node 18.17+.
- Instale dependências: `npm install` (não executado aqui por ambiente restrito).
- Dev: `npm run dev`
- Build local: `npm run build`
- Build para Pages/Cloudflare: `npm run cf:build` (gera `.vercel/output` via next-on-pages; use este comando no pipeline do Pages).

## Dados (fonte única)
- Arquivo: `data/doctors.json`
- Estrutura:
  - `clinic`: `{ name, address, google: { placeId?, mapsUrl? } }` (fallback para reviews/maps).
  - `doctors[]`:
    - `slug` (único, permanente; use kebab-case, ex: `ana-silva`)
    - `name`, `crm`
    - `specialties[]`
    - `bio`
    - `clinicAddress` (opcional; senão usa endereço global)
    - `contacts`: `email?`, `phones?[]`, `whatsapp?[]`, `instagram?[]`, `links?[] {label,url}`
    - `google`: `placeId?`, `mapsUrl?`
    - `photos?[]` (URLs; domínio liberado em `next.config.mjs`)
    - `active` (boolean, padrão `true`; `false` mostra aviso “não atende mais”)
- Campos opcionais só aparecem quando preenchidos.
- QR curto: rota `/m/{slug}` redireciona para `/medicos/{slug}`.

## Reviews do Google
- Function: `functions/api/reviews.ts`
- Querystring: `placeId` (se não vier, usa `CLINIC_PLACE_ID` global).
- Resposta: `rating`, `user_ratings_total`, `url`, `reviews[]`.
- Cache na edge: 6h por `placeId`.
- Se falhar, UI esconde blocos e mantém botão “Ver no Google” quando houver URL.
- Em `next dev` o endpoint `/api/reviews` não roda; use Cloudflare Pages (deploy) ou `npx wrangler pages dev .vercel/output/static --compatibility-date=2024-07-01` após `npm run cf:build` para testar.

### Variáveis de ambiente (Cloudflare Pages/Workers)
- `GOOGLE_PLACES_API_KEY` (Google Places Details)
- `CLINIC_PLACE_ID` (fallback da clínica)
- Opcional: defina também em `wrangler.toml`/Painel Pages para dev local com `wrangler pages dev`.

## Deploy no Cloudflare Pages
- Repositório conectado ao GitHub.
- Build command: `npm run cf:build`
- Output directory: `.vercel/output/static`
- Functions: `functions/` (já no repositório; inclui `/api/reviews`).
- Domínio: configure `medicos.inovare.med.br` como custom domain no Pages e mantenha DNS no Cloudflare.

## QR Codes
- Gere QR Codes apontando para `https://medicos.inovare.med.br/m/{slug}` (rota curta e permanente).
- Recomende exportar em SVG para impressão (melhor nitidez) e testar a leitura em dispositivos móveis antes de mandar para gráfica.

## Ambiente de teste (ctrls.dev.br)
- Variáveis no Cloudflare Pages: `GOOGLE_PLACES_API_KEY`, `CLINIC_PLACE_ID`, `SITE_BASE_URL` (ex: `https://medicos-test.ctrls.dev.br`), opcional `QR_BASE_URL`.
- `SITE_BASE_URL` e `QR_BASE_URL` têm fallback para `https://medicos-test.ctrls.dev.br`.
- Geração de QRs em SVG: `npm run qr:gen` (lê `data/doctors.json`, salva em `qrcodes/` e gera `qrcodes/index.csv`; cada QR aponta para `https://<BASE>/m/{slug}`).
- API `/api/reviews` não funciona em `next dev`; use Pages ou `npx wrangler pages dev .vercel/output/static --compatibility-date=2024-07-01` após `npm run cf:build`.

## Personalização de identidade
- Cores: primária `#f5ab4d`, secundária `#fad5aa` (definidas no Tailwind).
- Logo: substitua `public/Logo.png` pela arte oficial.
- Tipografia: Manrope via `next/font/google`; espaçamento generoso e cards leves.

## Adicionar/alterar médicos (passo a passo)
1) Crie/edite um bloco em `data/doctors.json`.
2) Gere `slug` em minúsculas com hífens, sem acentos (ex: `joao-pereira`).
3) Preencha contatos e redes apenas quando existirem.
4) Opcional: `active: false` mantém a página publicada com aviso de indisponibilidade.
5) Commits são a única forma de alterar conteúdo (sem painel).

## Rotas e SEO
- Lista: `/`
- Perfil: `/medicos/{slug}` (canônico, SSG + meta/OG dinâmicos)
- Curto para QR: `/m/{slug}` → redirect
- Open Graph usa a primeira foto do médico ou `Logo.png` como fallback.

## Testes rápidos
- `npm run lint` (Next/TypeScript)
- `npm run dev` e acesse `http://localhost:3000`
- Para testar Function local: `npx wrangler pages dev .vercel/output/static --compatibility-date=2024-07-01` após `npm run cf:build`

## Notas
- UI polish: footer com logo maior e botões de contatos/redes com ícones padronizados.
- Reviews: use `google.placeId` real no `data/doctors.json` quando existir; se faltar, o worker usa `clinic.google.placeId` como fallback.
