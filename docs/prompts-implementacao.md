# Prompts de Implementação — Timer do Concurseiro

Prompts prontos para colar no Claude Code, um por fase do `docs/guia-implementacao.md`. Use-os em sequência — cada prompt já referencia os documentos de contexto (`docs/guia-implementacao.md` e `docs/identidade-visual.md`), então pode ser colado em uma sessão nova sem perder contexto. Rode cada fase, valide com a seção "Verificação" antes de colar o prompt da fase seguinte.

---

## Fase 0 — Fundação (setup + identidade visual aplicada)

```
Leia docs/guia-implementacao.md e docs/identidade-visual.md antes de começar.

Implemente a Fase 0 do roadmap: fundação do projeto "Timer do Concurseiro".

1. Inicialize um projeto Next.js 15 (App Router, TypeScript) com Tailwind CSS v4 e shadcn/ui, seguindo a estrutura de pastas da seção 3 do guia.
2. Configure a paleta de cores e tipografia de docs/identidade-visual.md no tema do Tailwind (cores como tokens nomeados, não hex soltos pelo código) e carregue as fontes Space Grotesk/Sora + Inter via next/font.
3. Gere o conjunto de ícones PWA (192/256/384/512 + maskable) a partir de docs/IMG-20260917-WA0000.jpg e salve em public/icons/.
4. Crie app/manifest.ts com theme_color/background_color #0F172A, display standalone, e os ícones gerados.
5. Configure o service worker básico com @ducanh2912/next-pwa (estratégias de cache ainda simples, serão refinadas na Fase 1).
6. Configure o projeto no Supabase (apenas criação do projeto e variáveis de ambiente — ainda sem schema, isso é da Fase 2) e prepare o repositório git.
7. Implemente o seletor de tema claro/escuro/sistema (seção 5 do guia e seção 2.1 da identidade visual): botão com ícone sol/lua na página principal, paleta clara aplicada via tokens semânticos (mesmos nomes de token do tema escuro, valores diferentes), preferência persistida em localStorage (tc:theme) e aplicada via atributo data-theme no <html> antes da primeira pintura (script inline no <head>) para não haver "flash" do tema errado.
8. Faça o deploy inicial na Vercel.

Não implemente ainda nenhuma feature de produto (timer, histórico etc.) — só a fundação, com uma página inicial simples usando a identidade visual (logo, cores, tipografia) para eu conferir visualmente, incluindo o seletor de tema funcionando nos dois modos.

Ao final, rode a verificação da Fase 0 do guia: confirme que o PWA aparece como instalável no navegador com os ícones corretos, e que o seletor de tema alterna corretamente entre claro/escuro/sistema e persiste após reload.
```

---

## Fase 1 — MVP com paridade de features

```
Leia docs/guia-implementacao.md (seções 1, 3 e 4) antes de começar. A Fase 0 (setup Next.js/Tailwind/PWA/identidade visual) já está pronta.

Implemente a Fase 1: reconstrução do produto com paridade total em relação ao site atual (https://www.timerdoconcurseiro.com.br/), na stack nova.

Funcionalidades a implementar:
1. Timer engine em lib/timer-engine + workers/timer.worker.ts: Web Worker com timestamps absolutos (Date.now(), nunca contador incremental), ressincronização via Page Visibility API ao voltar o foco, e notificação (Notification API via service worker) quando o ciclo termina mesmo com a aba em background. Modos: Temporizador (contagem regressiva, blocos de foco 25/30/50/60 min + pausas 5/10/15/30 min, opção "Ajustar" tempo customizado) e Cronômetro (contagem crescente livre).
2. Campo "Qual matéria você vai estudar?" e botão Salvar obrigatório no modo Cronômetro para registrar a sessão.
3. Meta diária de Horas Líquidas configurável, barra/anel de progresso (reaproveitando o motivo do anel neon da identidade visual), modal de "Meta Alcançada" com confetti.
4. Streak simples ("dias na meta"), calculado e persistido em localStorage/IndexedDB por enquanto (sem backend ainda).
5. Configuração de sons (Suave, Despertador em loop, Alerta Forte, silêncio) via Web Audio API, arquivos em public/sounds/, cacheados pelo service worker.
6. Histórico de sessões com exportação para Excel (xlsx via npm) e PDF (jsPDF + jspdf-autotable via npm, não CDN) e botão "Apagar Tudo".
7. Páginas institucionais: Como Usar, "Por que usar Timer para Concursos", Técnica Pomodoro, Política de Privacidade, Termos de Uso — migre o conteúdo do site atual, adaptando à identidade visual nova.
8. Refine as estratégias de cache do service worker (Workbox): StaleWhileRevalidate no app shell do /timer, CacheFirst para sons/ícones.

Ao terminar, teste a lógica de geração de Excel/PDF chamando as funções diretamente (não clique no botão de download via automação de navegador — isso abre o diálogo nativo "Salvar como" e trava o teste). Rode o app localmente e valide os dois modos do timer, incluindo deixar a aba em background por alguns minutos para confirmar que o tempo não diverge.
```

---

## Fase 2 — Login e Sync

```
Leia docs/guia-implementacao.md (seções 2 e 5) antes de começar. A Fase 1 (MVP com timer, histórico local, export) já está pronta.

Implemente a Fase 2: autenticação e sincronização na nuvem.

1. Configure Supabase Auth com Google OAuth como método principal (email/senha como alternativa secundária), seguindo o passo a passo da seção 5 do guia: credencial OAuth 2.0 no Google Cloud Console (tela de consentimento com nome/logo do app, redirect URIs para o callback do Supabase e para localhost em dev), Client ID/Secret cadastrados em Authentication → Providers → Google no painel do Supabase.
2. Implemente o botão "Entrar com Google" chamando supabase.auth.signInWithOAuth({ provider: 'google' }) e crie app/api/auth/callback (route handler) que troca o código pela sessão via supabase.auth.exchangeCodeForSession.
3. Crie o schema Drizzle em db/schema.ts com as tabelas profiles, study_sessions e daily_goals_log da seção 2 do guia, com Row Level Security (policy user_id = auth.uid() em todas). No primeiro login, popule profiles automaticamente com nome/avatar vindos do perfil Google.
4. Mantenha o "modo convidado" existente (localStorage) — login é opt-in.
5. No primeiro login, ofereça migrar o histórico local (localStorage/IndexedDB) para a nuvem (import único para study_sessions).
6. Depois de logado, toda sessão salva deve gravar direto em study_sessions via Supabase client; se offline, cai numa fila local (IndexedDB) e sincroniza ao reconectar.
7. Tela/seção de conta do usuário (perfil, meta diária, preferência de áudio, logout).

Ao terminar, valide o fluxo de login Google de ponta a ponta (redirect → tela de consentimento do Google → callback → sessão criada → profiles populado), logando em dois navegadores/perfis diferentes e confirmando que o histórico sincroniza entre eles, e teste o cenário offline (registrar uma sessão sem internet e confirmar que sincroniza ao voltar a conexão).
```

---

## Fase 3 — Gamificação

```
Leia docs/guia-implementacao.md (seções 2 e 5) e docs/identidade-visual.md (seção 4, elementos gráficos) antes de começar. As Fases 1 e 2 (produto completo com login/sync) já estão prontas.

Implemente a Fase 3: gamificação.

1. Crie as tabelas streaks, badges (catálogo estático) e user_badges no schema Drizzle, com seed inicial de badges (ex: primeira sessão, 7 dias de streak, 30 dias de streak, 10h líquidas totais, 100h líquidas totais).
2. Implemente lib/gamification/rules.ts como funções puras e testáveis: cálculo/atualização de streak a cada sessão salva (upsert em daily_goals_log, incrementa streaks.current_streak_days se o dia anterior também bateu a meta, senão reseta) e verificação de desbloqueio de badges.
3. Chame essas regras após cada sessão salva e após cada atualização de streak.
4. Crie a tela de Conquistas (badges desbloqueadas/bloqueadas) usando a seta ascendente da identidade visual como ícone de progresso/conquista.
5. Crie o Ranking semanal/mensal: view agregada somando net_seconds por usuário, expondo só display_name + total (nunca dados de sessão individuais de terceiros). Adicione profiles.show_in_ranking (opt-in) e a UI para o usuário ativar/desativar sua participação.

Ao terminar, escreva testes unitários para lib/gamification/rules.ts cobrindo cenários de streak (dias consecutivos, quebra de streak) e desbloqueio de badges, e valide manualmente que o ranking não vaza dados de sessão de outros usuários — apenas nome e total agregado.
```

---

## Fase 4 — Monetização

```
Leia docs/guia-implementacao.md (seções 1 e 5) antes de começar. As Fases 1-3 (produto completo com login, sync e gamificação) já estão prontas.

Implemente a Fase 4: monetização com Stripe.

1. Crie a tabela subscriptions no schema Drizzle (stripe_customer_id, stripe_subscription_id, status, plan, current_period_end) e o campo profiles.plan ('free' | 'premium').
2. Configure Stripe Checkout + Billing para assinatura mensal/anual, com Pix habilitado além de cartão.
3. Crie app/api/stripe/checkout (cria a Checkout Session) e app/api/stripe/webhook (escuta checkout.session.completed e customer.subscription.updated/deleted, atualizando subscriptions e profiles.plan).
4. Defina o que é exclusivo do plano Premium (conforme seção 5 do guia: sync multi-dispositivo, estatísticas avançadas, badges exclusivas) e implemente o gate de features no frontend lendo profiles.plan.
5. Crie a página de Planos/Pricing usando a identidade visual (o laranja→vermelho como cor de CTA para "Virar Premium").

IMPORTANTE: use as chaves de teste do Stripe (test mode) em todo o desenvolvimento — não use chaves de produção sem eu confirmar explicitamente antes do lançamento real de cobrança.

Ao terminar, teste uma assinatura completa em modo teste do Stripe (cartão de teste 4242 4242 4242 4242 e, se possível, o fluxo de Pix em sandbox) e confirme que o webhook atualiza o plano do usuário e libera as features gated.
```

---

## Fase 5 (opcional, pós-lançamento) — Refinos

```
Leia docs/guia-implementacao.md (seção 6, Fase 5) antes de começar. O produto completo (Fases 1-4) já está em produção.

Escolha com o usuário qual refino priorizar antes de implementar, já que a Fase 5 é opcional e aberta:
- Ranking entre amigos (tabela friendships)
- Push notifications de lembrete de estudo (via service worker + Notification API)
- Temas customizáveis (variações de cor sobre a paleta base da identidade visual)
- App mobile via Capacitor reaproveitando o código PWA existente

Não implemente nenhum desses sem antes confirmar com o usuário qual(is) quer priorizar.
```
