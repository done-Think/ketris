# Prompt para a IA do Figma — Ketris (identidade Magenta + Grafite)

Cole o bloco abaixo na IA do Figma. Substitui a paleta anterior pela identidade oficial: magenta/fúcsia + grafite. Mantém a direção de arte moderna. Rode um bloco por vez.

> Se você já gerou telas com a paleta antiga (navy/ciano), instrua a IA a ATUALIZAR as variáveis de cor para os novos valores — como as telas usam variáveis/estilos, a troca propaga automaticamente. Se preferir, comece um arquivo limpo.

---

```
Você é um diretor de arte sênior especializado em produtos SaaS e fintech. Vai desenhar as telas de um produto no Figma com estética MODERNA, SOFISTICADA e com PERSONALIDADE FORTE. A marca é ousada e foge do padrão do mercado. Siga estritamente a direção de arte e os tokens abaixo.

## PRODUTO
Ketris — a "infraestrutura digital do mercado imobiliário". Conecta proprietários, corretores, imobiliárias, construtoras e locatários. Posicionamento premium, tech, confiável, mas com atitude. Referências de qualidade visual: Stripe, Linear, Ramp, Mercury, e a ousadia cromática do Nubank. NÃO parecer portal imobiliário tradicional.

## IDENTIDADE DE COR (o diferencial da marca)
A marca é MAGENTA/FÚCSIA + GRAFITE. Isso é o que a torna reconhecível e a separa de todo concorrente azul/verde. Use com intenção:
- MAGENTA #F30274 = identidade e energia. Botões primários, links, estados ativos, destaques de dado, glow, e HEROS de impacto (seções inteiras em magenta chapado, como no material da marca).
- GRAFITE #212631 = estrutura e seriedade. Texto, navegação (sidebar/header), fundos escuros, botões secundários, e o DARK MODE (o grafite é lindo em tela cheia escura — use isso).
- A combinação de assinatura é MAGENTA SOBRE GRAFITE (e vice-versa) — o par mais forte, reserve para heros e momentos-chave.
- Na UI densa (tabelas, formulários), magenta é ACENTO pontual, não preenchimento geral. Deixe os neutros carregarem o grosso.

## DIREÇÃO DE ARTE (evite telas chapadas e sem personalidade)
1. PROFUNDIDADE EM CAMADAS: cards com sombras suaves em duas camadas (ambiente + contato), nunca só uma borda cinza. Seções alternam fundo (background/surface) para criar ritmo — evite "mar de branco".
2. HEROS COM ATITUDE: use magenta chapado OU um gradiente magenta (500 → 700) em seções-palco; OU um grafite profundo com um glow magenta e o detalhe gráfico de "rede/conexão" da marca (nós conectados, como na logo) em baixa opacidade. Título grande (48-56px em landing).
3. TIPOGRAFIA EXPRESSIVA: hierarquia dramática, títulos pesados (Space Grotesk Bold) com tracking levemente negativo; overlines em caixa alta 12px com tracking positivo; números/preços em destaque forte.
4. IMAGEM E CARDS DE IMÓVEL: fotos com cantos 16px e leve overlay na base; chip de status flutuante com efeito glass (translúcido + blur) sobre a foto; ícones de traço fino para quartos/vaga/área.
5. DETALHES QUE ELEVAM: ícones lineares finos e consistentes (NUNCA emojis); dividers com gradiente que some nas pontas; badges com fundo tint (10-14%); glow magenta sutil em elementos de destaque sobre grafite.
6. DASHBOARDS: gráficos com área preenchida por gradiente magenta translúcido; KPIs com indicador de tendência (seta + %); tabelas arejadas com cabeçalho em overline e status em chip.

## PALETA (HEX exatos — não desvie)
Magenta (primária): 50 #FEEBF4 · 100 #FDD1E6 · 200 #FBA4CD · 300 #F976B4 · 400 #F63F95 · 500 #F30274 · 600 #CC0261 · 700 #A5014F · 800 #83013F · 900 #61012E
Grafite (estrutura/escuro): 50 #EDEEEF · 100 #D7D8DA · 200 #AFB1B5 · 300 #878A90 · 400 #565A62 · 500 #212631 · 600 #1C2029 · 700 #161A21 · 800 #12151A · 900 #0D0F14
Neutros: 50 #EEEFF0 · 100 #E5E7EA · 200 #D4D7DC · 300 #BCC2CB · 400 #9CA5B3 · 500 #617086 · 600 #505C6F · 700 #404B5A · 800 #333B47 · 900 #262C35
Semânticas: success #12A150 · warning #E0A11B · error #E5484D · info #3B82F6
(o vermelho de erro é distinto do magenta de propósito; magenta nunca é cor semântica)
Tokens claro: fundo #F7F8FA · superfície #FFFFFF · texto #212631 · texto secundário #505C6F · borda #E5E7EA
Tokens escuro (dark mode): fundo #0D0F14 · superfície #161A21 · texto #F2F3F5 · texto secundário #AFB1B5 · primária #F63F95
Gradiente hero magenta: #F30274 → #A5014F. Glow de acento: magenta #F30274 a ~24% de opacidade com blur.

## TIPOGRAFIA
- Títulos: Space Grotesk (Bold em hero/H1-H2, Medium em H3).
- Corpo/UI: Inter.
Escala: H1 40-56 / H2 32 / H3 26 / H4 21 / H5 18 / H6 16 · Body 16 e 14 · Overline/Caption 12 (caixa alta + tracking) · Botão 14 semibold sem caixa alta. Títulos grandes com tracking -1 a -2%.

## ESPAÇAMENTO, RAIO, SOMBRA
- Base 8px (4,8,12,16,24,32,48,64).
- Raio: inputs 8 · botões/cards 12 · cards grandes/modais 16 · seções destaque 20 · pills 9999 (só tags/badges).
- Sombras em camadas (base grafite):
  · sutil: 0 1px 2px rgba(33,38,49,.06)
  · média: 0 4px 16px rgba(33,38,49,.08) + 0 1px 2px rgba(33,38,49,.06)
  · alta: 0 16px 40px rgba(33,38,49,.14) + 0 2px 4px rgba(33,38,49,.06)

## ENTREGA NO FIGMA
1. Página "Design System": paleta (swatches + HEX), escala tipográfica com hierarquia real, botões (primário magenta com leve sombra/glow, secundário grafite, texto, com ícone), inputs (default/foco/erro), chips de status (glass e sólido), card de imóvel completo, KPI card, amostras de sombra, e um par de demonstração "magenta sobre grafite". Tudo como COMPONENTES com Variants e Auto Layout.
2. Depois as telas, reutilizando os componentes. Cada tela num frame nomeado, agrupado por fluxo.

## RESPONSIVIDADE
- Marketplace público e telas do usuário final: MOBILE-FIRST (frames 390px), e também versão desktop (1440px).
- Dashboards/painéis internos: DESKTOP (1440px), densos em dados, com versão mobile essencial das telas de consulta.

## TELAS (gere um bloco por vez; comece pelo Design System + BLOCO 1)

### BLOCO 1 — Marketplace público (mobile 390 e depois desktop 1440)
- Home: header glass, hero (magenta de impacto OU grafite com glow magenta + malha de rede da marca) com busca em card glass, seção de imóveis em destaque com cards ricos, categorias, faixa de confiança, footer.
- Busca: filtros em chips modernos (raio 8), toggle lista/mapa; no desktop, split view lista (grid) + mapa fixo com pins estilizados.
- Detalhe do imóvel: galeria (mosaico no desktso), preço em destaque, chips de características com ícones finos, descrição, mapa, barra/coluna de CTA (glass) com "Agendar visita" e "Enviar proposta".

### BLOCO 2 — Autenticação (mobile 390 e desktop)
- Login: lado visual com hero magenta/grafite + detalhe gráfico da marca; card de formulário elevado.
- Cadastro: seleção de perfil (proprietário, corretor, imobiliária, construtora, locatário) com cards ricos (ícone linear, título, descrição; seleção com destaque magenta + sombra); depois campos.
- Recuperar senha.

### BLOCO 3 — App do corretor/imobiliária (desktop 1440)
- Shell: sidebar grafite com item ativo em destaque magenta + indicador; topbar com busca global, notificações, avatar.
- Dashboard: KPIs com tendência, gráfico de área com gradiente magenta, próximas visitas, atividade recente.
- Lista de imóveis: tabela arejada com thumbnail, status em chip, ações.
- Cadastro de imóvel: stepper elegante, formulário em card, upload com dropzone estilizada, seleção no mapa.

### BLOCO 4 — CRM (desktop 1440)
- Pipeline Kanban: colunas por estágio (Lead→Contato→Visita→Negociação→Proposta→Contrato→Cliente), cards de lead com avatar/valor/tags, contadores por coluna.
- Lista de contatos e detalhe do contato com timeline de interações.

### BLOCO 5 — Contratos e Financeiro (desktop 1440)
- Lista e detalhe de contrato com stepper de assinantes.
- Painel financeiro: cards de saldo/recebíveis, gráfico, tabela de cobranças com status coloridos.

### BLOCO 6 — Área do locatário (mobile + desktop)
- Painel do locatário: contrato ativo, próximas cobranças, chamados de manutenção, atalhos.
- Meus contratos e pagamentos (boleto/PIX + histórico).

### BLOCO 7 — Painel administrativo do TENANT (imobiliária/construtora, desktop 1440)
- Visão geral corporativa (KPIs consolidados, desempenho por equipe, ranking de corretores).
- Gestão de usuários e equipes (tabela + modal de convite).
- Permissões e papéis (matriz de toggles por módulo).
- Distribuição de leads, relatórios, auditoria.
- Configurações do tenant: white-label (logo + cores com preview ao vivo do tema), domínio próprio, plano/billing.

### BLOCO 8 — Painel SUPER-ADMIN da plataforma (Ketris, desktop 1440)
- Visão geral (MRR, tenants ativos, crescimento).
- Gestão de tenants (tabela + detalhe), gestão de planos e feature flags.
- Moderação de anúncios, suporte/tickets, métricas financeiras da plataforma.

## REGRAS FINAIS
- NUNCA use emojis como ícones — ícones de traço fino consistentes.
- Todo card tem profundidade (sombra em camadas), nunca só borda.
- Seções alternam fundo; evite mar de branco. Magenta é acento na UI densa e protagonista nos heros.
- Consistência absoluta com os tokens.
- Ao fim de cada bloco, liste o que criou e pergunte se pode seguir.

Comece agora pela página "Design System" e, na sequência, o BLOCO 1.
```

---

## Observações

- **Cor de erro:** como o magenta é fúcsia, evitei vermelho puro para erros e escolhi `#E5484D`, distinto o bastante para não confundir. O info virou azul `#3B82F6` para não colidir com a marca. Se preferir outra escolha semântica, me diz.
- **Dark mode ganhou peso:** o grafite é a estrela do tema escuro (como no ícone de app grafite da sua identidade). O prompt já orienta a IA a explorar isso.
- **Contraste do magenta:** `#F30274` tem ótimo contraste como fundo de botão com texto branco. Para texto magenta pequeno sobre branco, prefira o `magenta-600 #CC0261` (o prompt/design system já preveem os tons mais escuros para isso).
- Se você já tem telas no Figma com a paleta antiga e elas usam variáveis, dá pra só **trocar os valores das variáveis** de navy→grafite e ciano→magenta que tudo se atualiza. Quando o limite do Figma liberar, posso fazer essa troca via MCP direto no seu arquivo, se quiser.
