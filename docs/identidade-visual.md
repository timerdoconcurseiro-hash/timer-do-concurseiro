# Identidade Visual — Timer do Concurseiro

Baseado na logomarca oficial (`docs/IMG-20260917-WA0000.jpg`): um monograma "TC" em branco/prata com efeito metálico 3D, sobre um círculo com anel neon azul-claro, fundo em gradiente azul-marinho profundo, atravessado por uma seta em gradiente laranja→vermelho em curva ascendente.

## 1. Conceito da marca

A logo comunica três ideias centrais do produto:
- **Foco/ambiente controlado** → fundo azul-marinho escuro e fechado, sem ruído visual.
- **Precisão/tecnologia** → anel neon, efeito metálico no monograma, estética "tech/gamer" limpa.
- **Progresso/conquista** → a seta ascendente cruzando o "C", símbolo direto de evolução e resultado (a aprovação).

Essa tríade (foco → precisão → progresso) deve guiar qualquer decisão visual do produto: a UI é escura e sóbria por padrão, com o laranja reservado para os momentos em que o usuário está avançando ou conquistando algo.

## 2. Paleta de cores

| Papel | Cor | Hex | Token Tailwind aprox. |
|---|---|---|---|
| Fundo principal (app shell) | Azul-marinho profundo | `#0F172A` | `slate-900` |
| Fundo secundário / cards | Azul-marinho médio | `#1E293B` | `slate-800` |
| Borda / divisores sutis | Azul-marinho claro acinzentado | `#334155` | `slate-700` |
| Destaque / glow / links / foco ativo | Ciano neon | `#38BDF8` | `sky-400` |
| Destaque forte (hover, ícones ativos) | Ciano mais saturado | `#0EA5E9` | `sky-500` |
| Texto principal / monograma | Branco levemente frio | `#F8FAFC` | `slate-50` |
| Texto secundário | Cinza-azulado claro | `#94A3B8` | `slate-400` |
| Ação primária / CTA / progresso (início) | Laranja | `#F97316` | `orange-500` |
| Ação primária / CTA / progresso (fim do gradiente) | Vermelho-alaranjado | `#EF4444` | `red-500` |
| Sucesso / meta batida | Verde | `#22C55E` | `green-500` |
| Erro / alerta | Vermelho | `#DC2626` | `red-600` |

**Regra de uso**: o gradiente laranja→vermelho da seta é a cor de **ação e progresso** — usar em botões primários ("Iniciar"), barra de progresso da meta diária, e badges/conquistas desbloqueadas. O ciano neon é **destaque de estado ativo** — usar em focos de input, ícone do modo selecionado (Temporizador/Cronômetro), bordas com glow em cards ativos. Nunca competir os dois num mesmo elemento pequeno (ex. um botão não deve ser ciano E laranja ao mesmo tempo).

**Contraste/acessibilidade**: `#F8FAFC` sobre `#0F172A` e `#1E293B` passa WCAG AA confortavelmente. `#94A3B8` (texto secundário) sobre `#0F172A` também passa AA para texto grande; evitar usá-lo para texto pequeno crítico. O laranja `#F97316` sobre fundo escuro tem bom contraste para texto/ícone, mas texto branco sobre laranja deve ser testado (usar `#0F172A` como texto sobre fundos laranja sólidos, se necessário).

### 2.1 Tema claro (modo claro)

O produto é **dark-first** (a identidade nasce do fundo azul-marinho da logo), mas oferece um modo claro alternativo via seletor de tema. Os mesmos papéis semânticos (fundo, superfície, borda, destaque, texto, ação, sucesso, erro) trocam de valor — nunca de função:

| Papel | Cor (modo claro) | Hex | Token Tailwind aprox. |
|---|---|---|---|
| Fundo principal (app shell) | Branco-azulado | `#F8FAFC` | `slate-50` |
| Fundo secundário / cards | Branco puro | `#FFFFFF` | `white` |
| Borda / divisores sutis | Cinza-azulado claro | `#E2E8F0` | `slate-200` |
| Destaque / links / foco ativo | Ciano | `#0EA5E9` | `sky-500` |
| Destaque forte (hover, ícones ativos) | Ciano escuro | `#0284C7` | `sky-600` |
| Texto principal | Azul-marinho profundo (a mesma cor do fundo escuro) | `#0F172A` | `slate-900` |
| Texto secundário | Cinza-azulado médio | `#64748B` | `slate-500` |
| Ação primária / CTA / progresso (início) | Laranja | `#F97316` | `orange-500` |
| Ação primária / CTA / progresso (fim do gradiente) | Vermelho-alaranjado | `#EF4444` | `red-500` |
| Sucesso / meta batida | Verde escuro | `#16A34A` | `green-600` |
| Erro / alerta | Vermelho | `#DC2626` | `red-600` |

O texto principal do modo claro usar exatamente o `#0F172A` do fundo escuro reforça a marca nos dois temas (a mesma cor "protagonista" muda de papel, nunca desaparece). O gradiente laranja→vermelho da ação primária **não muda** entre temas — é a cor mais reconhecível da marca e deve funcionar igual nos dois contrastes (já validado: passa AA em ambos os fundos).

**Seletor de tema**: um botão simples (ícone sol/lua) no cabeçalho da página principal alterna entre claro/escuro/sistema. Persistir a escolha do usuário (ex. `localStorage`) e, na ausência de escolha explícita, respeitar `prefers-color-scheme` do sistema operacional. Evitar "flash" do tema errado no carregamento (aplicar o tema antes da primeira pintura, via atributo no `<html>`).

## 3. Tipografia

- **Títulos / números do timer / marca**: uma sans-serif geométrica e técnica, com números tabulares (fundamental para o timer não "tremer" a cada segundo). Sugestão: **Space Grotesk** ou **Sora** (Google Fonts) — ecoam o efeito metálico/tech do monograma sem parecer futurista demais.
- **Corpo de texto / UI geral**: sans-serif de alta legibilidade em telas. Sugestão: **Inter** (Google Fonts) — já é o padrão de fato em produtos SaaS modernos e combina com shadcn/ui.
- **Números do cronômetro/temporizador**: usar `font-variant-numeric: tabular-nums` (ou a variante tabular da fonte escolhida) para que os dígitos não desloquem a cada tick.

Hierarquia sugerida: Space Grotesk/Sora para H1/H2 e o display do timer; Inter para H3 em diante, corpo, labels e botões.

## 4. Elementos gráficos

- **Anel neon**: reaproveitar como motivo de "estado ativo" — ex. um anel de progresso circular ao redor do timer (em vez de só uma barra linear), bordas com glow sutil (`box-shadow` ciano) em cards de sessão em andamento.
- **Seta ascendente**: usar como ícone de progresso/conquista em contextos de gamificação (desbloqueio de badge, subida no ranking, gráfico de evolução de horas líquidas) — não precisa ser a seta exata da logo, mas manter o ângulo ascendente e o gradiente laranja→vermelho como "assinatura" desse tipo de indicador.
- **Gradiente radial azul** do fundo da logo pode inspirar fundos de seções hero/splash screen, mas na UI do app do dia a dia prefira fundo sólido `#0F172A` (gradientes custam performance/consistência em uso prolongado de tela).
- **Cantos e formas**: a logo é circular e "gaming"; refletir isso com cantos arredondados generosos (`rounded-xl`/`rounded-2xl`) em cards e botões, evitando cantos totalmente retos (que destoariam do círculo da marca).

## 5. Tom de voz

Mantém o tom já estabelecido no produto: **motivacional, direto, sem infantilizar**. Frases curtas, linguagem de quem entende a rotina de estudo para concurso (cansaço, procrastinação, ansiedade com o tempo). Vocabulário já consagrado a preservar: "horas líquidas" vs. "horas brutas", "ambiente blindado contra distrações", "sua aprovação de amanhã". Evitar gírias passageiras ou tom excessivamente lúdico/infantil mesmo nas telas de gamificação — o público quer ser levado a sério.

## 6. Aplicações da logo

| Contexto | Orientação |
|---|---|
| Favicon / ícone PWA | Logo completa (círculo + anel + monograma + seta), sem cortes, fundo `#0F172A` preservado — gerar 192/256/384/512px a partir do arquivo fonte em `docs/IMG-20260917-WA0000.jpg`. |
| Ícone maskable (PWA/Android) | Manter margem de segurança (safe zone ~20%) ao redor do círculo para não cortar o anel neon quando o SO aplicar máscara circular/squircle. |
| Splash screen | Logo centralizada sobre fundo sólido `#0F172A`, sem texto adicional — o gradiente radial já existe na própria arte. |
| Cabeçalho do app (header) | Versão compacta: apenas o círculo pequeno (24–32px) ao lado do texto "Timer do Concurseiro" em Space Grotesk/Sora. |
| Fundo claro (páginas institucionais, e-mails) | Variante da logo com fundo transparente e o anel/monograma mantidos — testar legibilidade do branco/prata sobre claro; se necessário, usar uma versão com anel em `#0EA5E9` e monograma em `#0F172A` para fundo claro. |
| Monocromática (baixo contraste, watermark, impressão P&B) | Versão em um único tom (branco ou `#0F172A`), sem os gradientes — usar apenas o contorno do círculo, anel e monograma. |
| Redes sociais / avatar | Logo completa centralizada, respeitando a área de corte circular das plataformas (Instagram, etc.). |

## 7. O que evitar

- Não distorcer as proporções do círculo (sempre 1:1).
- Não recolorir o gradiente da seta para fora da família laranja→vermelho (perde o significado de "progresso").
- Não colocar a logo sobre fundos coloridos que conflitem com o azul-marinho (ex. fundos verdes, roxos) — se precisar de fundo alternativo, usar branco, preto ou tons de cinza neutro.
- Não usar a logo em tamanhos muito pequenos sem a versão simplificada (abaixo de ~32px, o anel neon e o efeito metálico do "TC" perdem legibilidade — nesses casos, considerar uma versão reduzida só com "TC" sólido).
