# 🧭 ROADMAP — Fluxo de Continuidade (Handoff)

> **Ponto de Restauração oficial do projeto.** Qualquer IA/sessão que assumir o projeto deve ler este arquivo **primeiro**, depois `AGENTS.md` (Next.js 16 tem breaking changes — consultar `node_modules/next/dist/docs/`).
> Atualize a seção **"Log de Execução"** ao terminar cada pacote.

- **Última atualização:** 2026-10-26 — v1.0 (Passos 0 a 9 implementados no código; aguardando execução da Migration 05 no Supabase pelo usuário)
- **Passo atual:** ✅ Código concluído e validado (`tsc` = 0 erros, `eslint` = 0 erros/warnings). Falta apenas aplicar `db/migrations/05_pivot_edital_semaforo.sql` no SQL Editor do Supabase e configurar as variáveis `ASAAS_*` em produção.
- **Stack:** Next.js 16.3.5 (App Router, `proxy.ts`) · React 19.2 · Tailwind 4 · Supabase (Auth + Postgres + RLS) · Asaas API v3 (Pix QR Code + Webhook autenticado) · Gemini (`@google/generative-ai`, importação de edital) · PWA (`@ducanh2912/next-pwa`)

---

## 1. Status Atual (Pós-Implementação — 2026-10-26)

### 1.1 O que já foi limpo e o que está funcionando
| Área | Estado |
|---|---|
| **Segurança e Webhook Asaas** | ✅ `app/api/webhooks/asaas/route.ts` valida `asaas-access-token` com `timingSafeEqual`, resolve usuário por `externalReference` (`tdc:<userId>:<planCode>`) → `asaas_customer_id` → API `/customers/{id}`, registra auditoria/idempotência em `payment_events` e trata estornos/chargebacks. |
| **Checkout Pix Nativo (Fricção Zero)** | ✅ `POST /api/checkout/pix` + `GET /api/checkout/status` + `components/billing/PixCheckoutModal.tsx`. Gera QR Code e Pix Copia-e-Cola na tela, faz polling a cada 3s e libera a Área VIP automaticamente. |
| **Limpeza de Código Zumbi** | ✅ Removidos: `AIStudyRoom`, `FlashcardViewer`, `CaixaDeFlashcards`, `AmbientSounds`, `SpacedReviewsWidget`, `DailyMissions`, `RadarNegligencia`, `EditalProjection`, `lib/storage/decks.ts`, `app/api/ai/study`, `app/api/ai/models`, `upgrade_admin.js`, `db/schema.ts` e deps não utilizadas (`drizzle-orm`, `drizzle-kit`, `postgres`). Tabelas legadas no banco foram preservadas sem uso (Decisão D3). |
| **Next.js 16 `proxy.ts` + Strict TS** | ✅ `middleware.ts` migrado para `proxy.ts` (excluindo `/api/webhooks` do matcher). Removido `typescript.ignoreBuildErrors` do `next.config.ts`. Zero erros de TypeScript e ESLint em todo o repositório. |
| **Timer do Concurseiro (Versão Grátis)** | ✅ `useTimerEngine` mantém `running: true` em reloads (timestamp absoluto), Web Worker agenda timeout exato de alarme, sincroniza entre abas via `storage`, persiste contexto completo (`session-context.ts`), possui anel SVG de progresso, atalho `Espaço` e fila offline idempotente (`sync-queue.ts` com `client_session_id`). |
| **Edital Verticalizado Inteligente (Área VIP)** | ✅ Componentizado em `components/edital/` (`EditalBoard`, `SubjectRow`, `TopicRow`, `TrafficLight`) com `React.memo`, `useDeferredValue`, `content-visibility: auto`, Semáforo de 4 cores (`none`, `red`, `yellow`, `green`) com update otimista e rollback versionado, e tempo líquido por tópico integrado ao Timer. |

---

## 2. Arquitetura Implementada

### 2.1 Estrutura de pastas
```
app/
  timer/page.tsx                  # Versão Grátis (anônimo ou logado)
  dashboard/page.tsx              # Free logado: upsell + Alocação de Tempo + Mapa de Consistência
  vip/page.tsx                    # Área VIP = Edital Verticalizado Inteligente
  pricing/page.tsx                # Planos + modal de Checkout Pix
  actions.ts                      # Server Actions com try/catch, validação e fallback pré-migration
  api/
    ai/edital/route.ts            # Importação de edital via Gemini
    checkout/pix/route.ts         # Cria cliente + cobrança Pix no Asaas e retorna QR Code
    checkout/status/route.ts      # Polling de confirmação da cobrança Pix
    webhooks/asaas/route.ts       # Webhook Asaas autenticado e idempotente
components/
  timer/                          # PomodoroPanel, StopwatchPanel, TimerApp, SoundSelect
  edital/                         # EditalBoard, SubjectRow, TopicRow, TrafficLight
  billing/                        # PixCheckoutModal
  dashboard/                      # FocusWrapper, PremiumObserver, VerifyPaymentButton, SubjectPieChart, ConsistencyHeatmap
lib/
  timer-engine/                   # engine.ts, useTimerEngine.ts, session-context.ts, types.ts
  storage/                        # sessions.ts, goals.ts, sync-queue.ts
  asaas/                          # client.ts, types.ts, webhook.ts
  supabase/                       # client.ts, server.ts, admin.ts
  plans.ts                        # Catálogo de planos, isPremium() e cálculo de expiração
db/migrations/
  05_pivot_edital_semaforo.sql    # Migration unificada (Billing + Semáforo + Tempo por Tópico + RPC)
proxy.ts                          # Convenção Next.js 16 (substitui middleware.ts)
docs/ROADMAP.md                   # Este documento de Handoff
```

---

## 3. Passo a Passo da Implementação (To-Do List)

- ✅ **Passo 0 — Baseline e rede de segurança:** checkpoint git, revisão de env vars (`.env.example`), diagnóstico de tipos.
- ✅ **Passo 1 — Segurança do pagamento (hotfix):** `lib/supabase/admin.ts`, `lib/plans.ts`, `lib/asaas/*` e reescrita de `app/api/webhooks/asaas/route.ts`.
- ✅ **Passo 2 — Limpeza de código zumbi:** remoção de componentes/rotas/deps descartados, migração `middleware.ts` → `proxy.ts`, remoção de `ignoreBuildErrors`.
- ✅ **Passo 3 — Timer blindado (Versão Grátis):** persistência de `running` no reload, `session-context.ts`, alarme exato no Web Worker, `sync-queue.ts` offline idempotente, anel SVG e atalho `Espaço`.
- ✅ **Passo 4 — Migration 05:** script SQL idempotente criado em `db/migrations/05_pivot_edital_semaforo.sql` *(aguardando execução no SQL Editor do Supabase pelo usuário)*.
- ✅ **Passo 5 — Edital (camada de dados):** `setTopicStatus`, `saveExamNameAction`, `saveGeneratedEdital` via RPC transacional com fallback, e agregação de `studied_seconds` por tópico.
- ✅ **Passo 6 — Edital (UI e performance):** `TrafficLight`, `TopicRow`, `SubjectRow`, `EditalBoard` com `React.memo`, `useDeferredValue`, filtro por cor do semáforo e barra multicolorida.
- ✅ **Passo 7 — Integração Timer ↔ Edital:** botão "Estudar" no tópico envia `topicId` ao Timer; modal de fim de sessão permite escolher a cor do semáforo e soma o tempo líquido no tópico.
- ✅ **Passo 8 — Checkout Pix via API Asaas:** rotas `/api/checkout/pix` e `/api/checkout/status` + `PixCheckoutModal` integrado em `/pricing`.
- ✅ **Passo 9 — QA e documentação:** `tsc --noEmit` (0 erros) e `eslint` (0 erros, 0 warnings), atualização deste Roadmap.

---

## 4. Dependências Críticas e Configuração de Ambiente

| Variável | Onde configurar | Finalidade |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel | Chave anônima (client/SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` / Vercel | Chave admin (usada exclusivamente no servidor pelo Webhook e Checkout) |
| `ASAAS_API_URL` | `.env.local` / Vercel | `https://api-sandbox.asaas.com/v3` (testes) ou `https://api.asaas.com/v3` (produção) |
| `ASAAS_API_KEY` | `.env.local` / Vercel | Chave da API Asaas (`$aact_...`) |
| `ASAAS_WEBHOOK_TOKEN` | `.env.local` / Vercel | Segredo configurado no painel Asaas → Integrações → Webhooks → "Token de autenticação" |
| `NEXT_PUBLIC_SALES_OPEN` | `.env.local` / Vercel | `"true"` para habilitar os botões de compra na página `/pricing` |
| `GEMINI_API_KEY` | `.env.local` / Vercel | Chave da API Google Gemini para importação de editais |

---

## 5. Log de Execução
| Data | Passo | Resumo | Commit |
|---|---|---|---|
| 2026-10-26 | Análise | Diagnóstico estrutural, mapeamento B1–B17 e criação do `docs/ROADMAP.md` v0 | `fe1d2d1` |
| 2026-10-26 | Passos 0 e 1 | Blindagem do webhook Asaas, `lib/plans.ts`, `lib/supabase/admin.ts`, `lib/asaas/*` | `f3da0af` |
| 2026-10-26 | Passo 2 | Remoção de código zumbi, migração `middleware.ts` → `proxy.ts`, limpeza de deps e copy | `2ada7fb` |
| 2026-10-26 | Passo 3 | Timer blindado (`session-context.ts`, worker alarm, `sync-queue.ts`, anel SVG, atalho Espaço) | `7e3bbc7` |
| 2026-10-26 | Passos 4 a 9 | Migration 05, Edital com Semáforo e performance, integração Timer↔Edital, Checkout Pix API e QA | *(commit final)* |

---

## 6. Decisões Registradas (Aprovadas pelo Usuário)
- **D1:** Removidos Radar de Negligência e Projeção até a Prova; mantidos Alocação de Tempo e Mapa de Consistência no Dashboard Grátis.
- **D2:** Semáforo de 4 cores: ⚪ Não iniciado (`none`), 🔴 Não domino (`red`), 🟡 Preciso revisar (`yellow`), 🟢 Domino (`green`).
- **D3:** Tabelas/colunas legadas (`spaced_reviews`, `ai_flashcard_count`, `exam_goals`) mantidas intactas no banco (apenas descontinuadas no código).
- **D4:** Checkout Pix dinâmico via API do Asaas com QR Code na tela e liberação automática.
