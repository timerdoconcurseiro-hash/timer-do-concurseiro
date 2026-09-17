# Plano: Reconstrução do Timer do Concurseiro como PWA + Identidade Visual

## Contexto

O site atual (`https://www.timerdoconcurseiro.com.br/`) já está em produção e funcional: é um PWA simples em **HTML/CSS/JS vanilla** (sem framework), tudo concentrado em um único `index.html` com ~20KB de JS inline, persistindo dados em `localStorage`, sem login e sem backend. Ele já tem `manifest.json`, favicon e service worker registrados — ou seja, já é instalável.

Funcionalidades confirmadas no site atual (via leitura do HTML/JS servido):
- **Modo Temporizador** (Pomodoro): blocos de foco 25/30/50/60 min + pausas 5/10/15/30 min, opção "Ajustar", campo "Qual matéria você vai estudar?".
- **Modo Cronômetro** (estudo livre): contagem crescente, botão "Salvar" obrigatório para registrar no histórico.
- **Meta diária de "Horas Líquidas"** (conceito central do produto: tempo realmente focado vs. tempo bruto sentado), com barra de progresso e modal de "Meta Alcançada".
- **Streak** simples ("🔥 X dias na meta").
- **Sons configuráveis**: Suave, Despertador (Loop), Alerta Forte, ou silêncio.
- **Histórico** com exportação **Excel** e **PDF** (via jsPDF/jspdf-autotable carregados por CDN) e botão "Apagar Tudo".
- Conteúdo institucional: Como Usar, "Por que usar Timer para Concursos", "Técnica Pomodoro", Política de Privacidade, Termos de Uso, contato `timerdoconcurseiro@gmail.com`, Google Analytics.
- Cor de tema atual: `#0F172A` (azul-marinho escuro) — **já combina** com o fundo da logo nova.

O diretório local do projeto (`C:\Users\alanp\Documents\Projetos-IA\Timerdoconcurseiro`) está **vazio**, contendo apenas `docs/IMG-20260917-WA0000.jpg` (1254×1254px): a nova logomarca — um círculo com anel neon azul-claro/branco sobre fundo azul-marinho em gradiente radial, monograma "TC" em branco/prata com efeito metálico 3D, e uma seta laranja-avermelhada em curva ascendente atravessando o "C" (símbolo de progresso/crescimento).

**Objetivo deste trabalho**: (1) reconstruir o produto do zero com stack moderna, preservando as regras de negócio e a experiência atual, e adicionando login, gamificação mais forte e monetização (conforme confirmado com você); (2) criar `docs/identidade-visual.md` com a proposta de identidade visual derivada da logo, para guiar a UI do novo app.

Decisões já confirmadas com você:
- Stack moderna (não vanilla JS puro).
- Novas features: login/conta de usuário, gamificação mais forte (badges/ranking), monetização (free vs. premium).
- Deploy final no domínio atual `timerdoconcurseiro.com.br`.

---

## 1. Stack recomendada

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React 19** | SSR/SSG para as páginas institucionais (hoje indexadas no Google), API routes para backend leve, suporte de primeira classe a PWA. |
| Hosting | **Vercel** | Deploy via git push, domínio custom com SSL automático em minutos, tier free cobre a fase atual. |
| Estilo/UI | **Tailwind CSS v4 + shadcn/ui** | Produtividade para 1 dev, componentes acessíveis prontos (modal de meta, barra de progresso). |
| PWA | **`@ducanh2912/next-pwa`** (Workbox por baixo) | Gera o service worker com estratégias de cache configuráveis, compatível com App Router. |
| Timer engine | Web Worker + timestamps absolutos + Page Visibility API (lógica própria, sem lib) | Evita o bug clássico de `setInterval` perder precisão com a aba em background — crítico para o produto. |
| Backend | **Next.js API Routes** (serverless na Vercel) | Sem servidor separado para manter, adequado a 1 dev. |
| Banco de dados | **Supabase (Postgres gerenciado)** | Tier free generoso, Auth e Row Level Security embutidos, modelo relacional se encaixa bem em sessões/streaks/ranking (agregações SQL). |
| ORM | **Drizzle ORM** | Leve, SQL previsível, boa DX em TypeScript. |
| Autenticação | **Supabase Auth** (Google OAuth como login principal + email/senha como alternativa) | Mesmo provedor do banco, RLS nativo, evita custo extra de um serviço de auth à parte. Google OAuth reduz fricção de cadastro (maioria dos concurseiros já tem conta Google) e evita o app ter que lidar com reset de senha/verificação de e-mail na v1. |
| Pagamentos | **Stripe** (Checkout + Billing), com Pix habilitado para contas BR | SDKs maduros, assinatura recorrente pronta, e suporte a Pix resolve a maior objeção de usar Stripe no Brasil. Mercado Pago fica como alternativa a reavaliar depois, se a conversão via Stripe/Pix não for boa. |
| Export PDF/Excel | **jsPDF + jspdf-autotable** (via npm, não CDN) + **SheetJS (`xlsx`)** | Mantém paridade com o comportamento atual; migrar de CDN para dependência instalada é necessário para funcionar offline (CDN externo não é cacheável de forma confiável pelo service worker). |
| Analytics | Google Analytics 4 (mantido) + Vercel Analytics (opcional) | Preserva histórico de métricas já existente. |

---

## 2. Modelo de dados (Postgres/Supabase)

Entidades principais: `profiles` (estende `auth.users`, guarda `plan`, `daily_goal_minutes`, `audio_preference`), `study_sessions` (matéria, modo, tempo líquido/bruto, timestamps), `daily_goals_log` (snapshot diário para calcular streak/ranking sem varrer todas as sessões), `streaks`, `badges` (catálogo estático) + `user_badges`, `subscriptions` (espelha o Stripe via webhook).

Regras de proteção: RLS por `user_id = auth.uid()` em todas as tabelas de dados pessoais; ranking exposto só via view agregada com `display_name` + total, nunca dados de sessão individuais de terceiros (e com opt-in de privacidade via `profiles.show_in_ranking`).

---

## 3. Estrutura de pastas proposta

```
timerdoconcurseiro/
├── app/
│   ├── (marketing)/        # home, política, termos, como usar
│   ├── (app)/              # /timer, /historico, /ranking, /conquistas, /conta
│   ├── api/stripe/webhook/
│   └── manifest.ts
├── components/{timer,goals,gamification,history,ui}/
├── lib/{timer-engine,supabase,stripe,export,gamification}/
├── workers/timer.worker.ts
├── db/{schema.ts,migrations}/
├── public/{icons,sounds}/
├── docs/                   # logo + identidade-visual.md
└── tests/{unit,e2e}/
```

`lib/timer-engine` e `lib/gamification` ficam desacoplados de React de propósito: são a lógica mais sensível (precisão de tempo, regras de badge) e devem ser testáveis isoladamente.

---

## 4. Migração das features críticas

- **Timer preciso em background**: fonte de verdade = `startEpochMs` absoluto, nunca contador incremental; tick roda em Web Worker; `visibilitychange` força ressincronização ao voltar o foco; Notification API via service worker avisa o fim do ciclo mesmo com a aba minimizada; estado persiste em localStorage/IndexedDB para sobreviver a reload.
- **Export Excel/PDF**: mesmas libs, agora via npm import em vez de `<script src="cdn">`.
- **PWA**: `app/manifest.ts` do Next 15 substitui o `manifest.json` estático; ícones (192/256/384/512 + maskable) gerados a partir de `docs/IMG-20260917-WA0000.jpg` com `pwa-asset-generator`; captura de `beforeinstallprompt` para manter o CTA "Instale o Aplicativo!".
- **Offline-first**: Workbox com `StaleWhileRevalidate` no app shell do `/timer` (precisa abrir sem internet), `CacheFirst` para sons/ícones, `NetworkFirst` + fila em IndexedDB para sincronizar sessões de estudo quando a conexão voltar.

---

## 5. Novas features

- **Login com Google (OAuth)**: botão "Entrar com Google" como principal método de autenticação, com email/senha como alternativa secundária. Fluxo técnico:
  1. Criar um projeto/credencial OAuth 2.0 no [Google Cloud Console](https://console.cloud.google.com/) (tipo "Web application"), configurar a tela de consentimento (nome do app, logo, domínio `timerdoconcurseiro.com.br`) e registrar as Authorized redirect URIs apontando para o callback do Supabase (`https://<seu-projeto>.supabase.co/auth/v1/callback`) e para `http://localhost:3000/auth/callback` em desenvolvimento.
  2. Copiar o Client ID e Client Secret gerados e cadastrá-los no painel do Supabase em Authentication → Providers → Google.
  3. No frontend, chamar `supabase.auth.signInWithOAuth({ provider: 'google' })`, que redireciona para a tela de login do Google e retorna para `app/api/auth/callback` (route handler que troca o código pela sessão via `supabase.auth.exchangeCodeForSession`).
  4. Ao primeiro login, criar automaticamente o registro em `profiles` (via trigger no Postgres ou verificação no callback) usando nome/avatar vindos do perfil Google.
  - Modo convidado continua existindo (localStorage) — login é opt-in, com oferta de "migrar histórico local para a nuvem" no primeiro acesso.
- **Gamificação**: streak recalculado a cada sessão salva (upsert em `daily_goals_log`); badges com regras simples (`lib/gamification/rules.ts`, função pura testável) — ex. primeira sessão, 7/30 dias de streak, 10h/100h líquidas; ranking semanal/mensal via view agregada, com opt-in de privacidade.
- **Monetização**: Free preserva 100% da experiência atual (para não frustrar a base existente); Premium adiciona sync multi-dispositivo, estatísticas avançadas, badges exclusivas. Fluxo: botão "Virar Premium" → Stripe Checkout → webhook atualiza `subscriptions`/`profiles.plan` → frontend faz gate de features lendo o plano do usuário.
- **Seletor de tema claro/escuro**: botão (ícone sol/lua) na página principal que alterna entre claro, escuro e "seguir sistema". Paleta clara documentada em `docs/identidade-visual.md` (seção 2.1) — os mesmos tokens semânticos (`app-bg`, `app-surface`, `text-primary`, etc.) trocam de valor conforme o tema, nunca de função. Preferência persistida em `localStorage` (`tc:theme`) e aplicada via atributo `data-theme` no `<html>`, definido antes da primeira pintura (script inline no `<head>`) para evitar "flash" do tema errado. Sem dependência de backend — funciona já na Fase 0, independe de login.

---

## 6. Roadmap faseado

1. **Fase 0 — Fundação**: setup Next.js/Tailwind/shadcn, deploy inicial na Vercel no domínio, projeto Supabase + schema Drizzle, geração dos ícones PWA a partir da logo, `manifest.ts` + service worker básico, **seletor de tema claro/escuro** na página principal (paleta clara + persistência, sem depender de backend). **Inclui a criação de `docs/identidade-visual.md`** (ver seção 7).
2. **Fase 1 — MVP com paridade de features**: timer engine novo, meta diária, streak local, histórico com export, páginas institucionais migradas — substitui o site atual sem regressão.
3. **Fase 2 — Login e Sync**: Supabase Auth com **Google OAuth** como método principal (+ email/senha secundário), migração do histórico local para a nuvem, sincronização multi-dispositivo com fila offline.
4. **Fase 3 — Gamificação**: streaks/badges no servidor, tela de conquistas, ranking com opt-in.
5. **Fase 4 — Monetização**: integração Stripe completa, página de planos, gate de features premium.
6. **Fase 5 (opcional/pós-lançamento)**: ranking entre amigos, push notifications, temas customizáveis, app mobile via Capacitor reaproveitando o mesmo código PWA.

---

## 7. `docs/identidade-visual.md` — o que o arquivo vai conter

Criado na Fase 0, com base na leitura visual da logo (`docs/IMG-20260917-WA0000.jpg`):

- **Paleta de cores**: extraída da logo — azul-marinho profundo como base (`#0F172A`, já usado no site atual), azul-claro/ciano do anel neon como cor de destaque/glow, branco/prata para textos e o monograma, e laranja-avermelhado (gradiente) da seta como cor de ação/CTA e indicador de progresso — com códigos hex sugeridos e papéis de uso (fundo, texto, ação primária, sucesso/progresso). Inclui também a **paleta do tema claro** (mesmos papéis semânticos, valores invertidos) para o seletor claro/escuro/sistema.
- **Tipografia sugerida**: uma fonte sans-serif geométrica/tech para títulos (ecoando o efeito 3D metálico do "TC") e uma sans-serif de alta legibilidade para corpo de texto, ambas via Google Fonts.
- **Elementos gráficos**: uso do anel/glow neon como motivo recorrente (ex. bordas de cards, indicadores de foco ativo), a seta ascendente como ícone de progresso/conquista reutilizável na gamificação.
- **Tom de voz**: motivacional e direto, mantendo o vocabulário já estabelecido do produto ("horas líquidas", "ambiente blindado contra distrações").
- **Aplicações**: como usar a logo em favicon/ícone PWA, splash screen, cabeçalho do app, e variações (fundo claro vs. escuro, versão monocromática para casos de baixo contraste).

---

## Verificação

- **Fase 0**: abrir o deploy da Vercel no domínio de staging/produção e confirmar que o PWA aparece instalável (prompt "Instalar app") com os ícones corretos gerados da logo; clicar no seletor de tema e confirmar que claro/escuro/sistema aplicam a paleta correta, persistem após reload e não há "flash" do tema errado ao carregar a página.
- **Fase 1**: rodar o app localmente (`npm run dev`), testar os dois modos (Pomodoro e Cronômetro) incluindo o cenário de deixar a aba em background por alguns minutos e confirmar que o tempo não diverge; testar exportação de Excel/PDF chamando a função de geração diretamente (não clicar no botão de download via automação de navegador, conforme preferência já registrada) e inspecionar o arquivo gerado.
- **Fase 2**: testar o login "Entrar com Google" de ponta a ponta (redirect → consentimento → callback → sessão criada → `profiles` populado); logar em dois navegadores/dispositivos diferentes e confirmar que o histórico sincroniza.
- **Fase 3**: forçar cenários de streak (simular dias consecutivos com meta batida) e confirmar desbloqueio correto de badges; conferir que o ranking não vaza dados de sessão de outros usuários.
- **Fase 4**: testar assinatura em modo teste do Stripe (cartão de teste + Pix sandbox) e confirmar que o webhook atualiza o plano do usuário e libera as features gated.
