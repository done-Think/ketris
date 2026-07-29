# Prompt para o Claude no navegador (Figma) — Telas da Ketris

Copie o conteúdo do bloco abaixo e cole no Claude in Chrome com o Figma aberto. Ele é autossuficiente: contém o design system, o contexto do produto e as telas a criar.

> Dica: comece pedindo **um fluxo por vez** (ex.: só o marketplace público primeiro). Gerar tudo de uma vez costuma perder qualidade. O prompt já está estruturado para você rodar por blocos — descomente/escolha o bloco de telas que quer em cada rodada.

---

```
Você vai criar as telas de UI de um produto no Figma. Siga ESTRITAMENTE o design system abaixo. Não invente cores, fontes ou espaçamentos fora do que está definido.

## PRODUTO
Ketris — plataforma SaaS para o mercado imobiliário ("a infraestrutura digital do mercado imobiliário"). Conecta proprietários, corretores, imobiliárias, construtoras e locatários. Posicionamento: infraestrutura tecnológica, confiança, solidez — referências visuais como Stripe e Vercel. NÃO deve parecer imobiliária tradicional (evite clichês como casinhas, tons terrosos, serif decorativa).

## PRINCÍPIOS DE DESIGN
- Mobile-first: desenhe primeiro a versão mobile (375px de largura) e, quando eu pedir, a versão desktop (1440px).
- Limpo, moderno, com bastante respiro (whitespace). Densidade de informação controlada.
- Baseado no Material Design (o produto usa Material UI), mas com identidade própria via as cores da marca.
- Cantos suavemente arredondados. Sombras suaves e frias, nunca pesadas.

## CORES (use exatamente estes HEX)
Marca:
- Navy (primária): #052063
- Ciano (destaque): #01B1DA

Escala Navy: 50 #EBEDF3 · 100 #D2D7E3 · 200 #A5AFC7 · 300 #7887AB · 400 #415688 · 500 #052063 · 600 #041B53 · 700 #031643 · 800 #031135 · 900 #020D28
Escala Ciano: 50 #EBF9FC · 100 #D1F1F8 · 200 #A4E3F2 · 300 #76D5EB · 400 #3EC4E3 · 500 #01B1DA · 600 #0195B7 · 700 #017894 · 800 #016076 · 900 #004757
Neutros: 50 #EFF1F4 · 100 #E6E9EE · 200 #D4D9E0 · 300 #BCC3CE · 400 #9CA6B6 · 500 #607189 · 600 #4F5D71 · 700 #404B5C · 800 #323B49 · 900 #252C37

Semânticas: success #2E9E6B · warning #E0A11B · error #D64550 · info #01B1DA

Tokens de tela (light):
- Fundo da aplicação: #F7F8FA
- Superfície/cards: #FFFFFF
- Texto principal: #1A2233
- Texto secundário: #4F5D71
- Bordas/divisores: #E6E9EE
- Ações primárias: Navy #052063
- Destaques/links/estados ativos: Ciano #01B1DA (uso pontual, nunca em grandes áreas)

## USO DA COR
- Navy domina: navegação, texto, botões primários. É a cor de "estrutura".
- Ciano é acento pontual: link, item ativo, destaque de dado, badge. Não pintar grandes áreas de ciano.
- Neutros carregam a maior parte da UI (fundos, bordas, texto secundário).
- Cores semânticas só para feedback (sucesso/alerta/erro), nunca decorativas.

## TIPOGRAFIA
- Títulos (display): Space Grotesk
- Corpo e UI: Inter
Escala:
- H1: 40px / bold / line-height 1.15
- H2: 32px / bold / 1.2
- H3: 26px / semibold / 1.25
- H4: 21px / semibold / 1.3
- H5: 18px / semibold / 1.4
- H6: 16px / semibold / 1.4
- Body1: 16px / regular / 1.6
- Body2: 14px / regular / 1.55
- Caption: 12px / regular / 1.4
- Botão: 14px / semibold / SEM caixa alta (texto normal)

## ESPAÇAMENTO
Base 8px. Escala: 4, 8, 12, 16, 24, 32, 40, 48, 64.

## RAIO DE BORDA
- Inputs/chips: 6px
- Botões/cards pequenos: 10px
- Cards/modais: 16px
- Avatares/badges: totalmente arredondado

## SOMBRAS (frias, baseadas no navy)
- sm: 0 1px 2px rgba(5,32,99,0.06)
- md: 0 4px 12px rgba(5,32,99,0.08)
- lg: 0 12px 32px rgba(5,32,99,0.12)

## O QUE FAZER PRIMEIRO
1. Crie uma página no Figma chamada "Design System" com: paleta de cores (swatches com os HEX), amostras de tipografia (a escala acima), botões (primário navy, secundário ciano contornado, texto), campos de formulário (input, select, com máscara), chips/badges, e um card padrão. Use Auto Layout e monte componentes reutilizáveis.
2. Depois crie as telas que eu listar abaixo, reutilizando esses componentes. Cada tela em um frame próprio, nomeado com clareza. Agrupe por fluxo.

## COMPONENTES-CHAVE (crie como componentes reutilizáveis)
- Topbar / app bar
- Sidebar de navegação (com estado ativo em ciano)
- Card de imóvel (foto, preço, título, localização, tags)
- Campo de formulário (label, input, helper/erro)
- Botões (primário, secundário, texto, com ícone)
- Tabela/lista de dados
- Chip de status (usa cores semânticas)
- Estado vazio (empty state)
- Modal/dialog

## TELAS A CRIAR (mobile-first; peça-me o desktop depois)
Rode um bloco por vez. Neste momento, gere o BLOCO 1. Quando eu confirmar, seguimos.

### BLOCO 1 — Marketplace público (SEO, foco em conversão)
- Home: hero com busca, imóveis em destaque, seções de valor
- Busca de imóveis: filtros (tipo, preço, quartos, finalidade) + lista de cards + mapa
- Detalhe do imóvel: galeria, preço em destaque, características, mapa de localização, botão de proposta/contato

### BLOCO 2 — Autenticação
- Login
- Cadastro com seleção de perfil (proprietário, corretor, imobiliária, construtora, locatário)
- Recuperação de senha

### BLOCO 3 — Área do corretor/proprietário (dashboard)
- Shell autenticado (sidebar + topbar)
- Dashboard com indicadores e gráficos
- Lista de imóveis (tabela + status)
- Cadastro de imóvel (formulário multi-etapa)

### BLOCO 4 — CRM
- Pipeline (Kanban): Lead → Contato → Visita → Negociação → Proposta → Contrato → Cliente
- Lista de contatos
- Detalhe do contato com histórico de interações

### BLOCO 5 — Contratos e Financeiro
- Lista de contratos
- Detalhe do contrato com status de assinatura
- Painel financeiro (cobranças, gráficos, status de pagamento)

## REGRAS FINAIS
- Nomeie frames e componentes de forma organizada.
- Use Auto Layout em tudo que for possível.
- Mantenha consistência absoluta com os tokens acima entre todas as telas.
- Se algo não estiver especificado, escolha a opção mais simples e coerente com o posicionamento "infraestrutura tech".
- Ao final de cada bloco, liste o que criou e pergunte se pode seguir para o próximo.

Comece agora pela página "Design System" e, em seguida, o BLOCO 1.
```

---

## Observações para você (fora do prompt)

- **Rode por blocos.** O prompt pede explicitamente para o Claude gerar o Bloco 1 e esperar sua confirmação. Isso mantém qualidade e te dá controle. Troque "gere o BLOCO 1" pelo bloco que quiser em cada rodada.
- **Fontes no Figma:** Space Grotesk e Inter existem no Figma (Google Fonts). Se não aparecerem, o Claude pode cair para uma fonte padrão — nesse caso, peça para ativar/instalar essas duas.
- **Verifique os tokens.** Depois da primeira página "Design System", confira se as cores bateram com os HEX antes de deixar ele gerar as telas — assim qualquer desvio é corrigido cedo.
- **Ícones/imagens:** para fotos de imóveis, o Claude vai usar placeholders. Está ok para protótipo.
- Se quiser, posso gerar **variações desse prompt** focadas só em um fluxo (ex.: um prompt dedicado só ao marketplace, mais detalhado tela a tela), ou um prompt para gerar os **componentes como Variants** com todos os estados (hover, disabled, erro).
```
