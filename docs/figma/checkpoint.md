# Ketris — Checkpoint do Figma

Estado da construção das telas no Figma. Serve para retomar exatamente de onde paramos.

Arquivo Figma: `https://www.figma.com/design/ATLFRX7xSEEdllto86Ayvj/Ketris`
File key: `ATLFRX7xSEEdllto86Ayvj`
Plano: **Starter** (limita a 3 páginas E impõe teto de chamadas via MCP — ambos os limites foram atingidos durante a construção).

---

## Concluído (existe no arquivo)

### Fundação
- Coleção de variáveis `Ketris/Colors` — 42 variáveis (navy, cyan, neutral, semantic, surface, text, border, common)
- 10 estilos de texto: `Heading/H1..H6`, `Body/Body1`, `Body/Body2`, `Body/Caption`, `Component/Button` (Space Grotesk nos títulos, Inter no corpo)
- 3 estilos de sombra: `Elevation/sm`, `Elevation/md`, `Elevation/lg`

### Página "Design System"
- Seção de cores (swatches vinculados às variáveis)
- Seção de tipografia (amostras da escala)

### Página "Components"
| Componente | ID | Observação |
|---|---|---|
| Button | 15:9 | variantes Type=Primary / Secondary / Text |
| Status Chip | 16:16 | variantes Status=Success/Warning/Error/Info/Neutral |
| Input Field | 16:2 | rótulo + campo + placeholder |
| Property Card | 16:17 | card de imóvel do marketplace |
| Sidebar | 29:75 | navegação lateral (navy) |
| Topbar | 29:99 | barra superior do dashboard |

### Página "Screens"
**Bloco 1 — Marketplace (mobile 375):**
- Home (id 19:2) — x:0
- Busca (id 19:35) — x:475 (chips de filtro já ajustados para raio 8)
- Detalhe do imóvel (id 21:52) — x:950

**Bloco 2 — Autenticação (mobile 375), linha y:1100:**
- Login (id 27:54) — x:0
- Recuperar senha (id 27:71) — x:475
- Cadastro com seleção de perfil (id 28:65) — x:950

**Bloco 3 — Dashboard / Admin (desktop 1440), linha y:2300:**
- Dashboard do corretor (id 30:75) — x:0 (KPIs, gráfico de barras, próximas visitas)
- Imóveis / Lista (id 33:102) — x:1540 (tabela + chips + botão "Novo imóvel") ✓ CONCLUÍDO nesta rodada

**Correções aplicadas:**
- Ícone "Manutenção" da Sidebar corrigido (glifo `⚒`) ✓

---

## Pendente

> Observação importante sobre o limite: o plano Starter libera **apenas ~1 chamada MCP por janela de reset**. Na prática, cada retomada consegue criar 1 tela antes de travar de novo. Concluir todos os blocos restantes assim levaria muitas rodadas. **Recomendado: upgrade para Professional** para terminar de uma vez.

1. **Cadastro de imóvel (multi-etapa)** — stepper + formulário (dados, endereço/mapa, características, mídia, valores). Posição sugerida: x:3080, y:2300.
4. **Bloco 4 — CRM (desktop):**
   - Pipeline (Kanban): Lead → Contato → Visita → Negociação → Proposta → Contrato → Cliente
   - Lista de contatos
   - Detalhe do contato (timeline de interações)
5. **Bloco 5 — Contratos e Financeiro (desktop):**
   - Lista de contratos
   - Detalhe do contrato (status de assinatura)
   - Painel financeiro (cobranças, gráficos, status de pagamento)

---

## Como retomar

Reusar sempre os componentes existentes (instâncias) e as variáveis de cor — não recriar. Novos frames de tela vão todos na página **"Screens"** (o plano Starter só permite 3 páginas, já usadas). Organizar por linhas: manter marketplace (y:0), auth (y:1100), dashboard/admin (y:2300), CRM (sugerido y:3300), contratos/financeiro (sugerido y:4300).

Padrão de tela desktop já estabelecido no Dashboard (30:75): `HORIZONTAL [ Sidebar(instância, FILL vertical) | main(VERTICAL: Topbar instância + content) ]`.

**Para destravar e concluir numa tacada:** subir o arquivo para o plano Professional do Figma (resolve o teto de chamadas MCP e o limite de 3 páginas). Alternativamente, aguardar o reset da janela do limite e retomar pelo item 1 acima.
