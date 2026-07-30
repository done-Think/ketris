# Ketris — Design System

Fundação visual da plataforma, derivada da identidade da marca (logo: prédio + rede de conexão, magenta/fúcsia + grafite). Documento vivo.

Princípios: infraestrutura tecnológica moderna, confiança, personalidade ousada. A marca foge do azul/verde padrão do mercado imobiliário — o magenta é o diferencial de reconhecimento.

---

## 1. Cores da Marca

Extraídas diretamente da identidade visual:

| Papel | Nome | Hex | RGB |
|---|---|---|---|
| Primária | Magenta / Fúcsia | `#F30274` | rgb(243, 2, 116) |
| Neutro escuro | Grafite | `#212631` | rgb(33, 38, 49) |
| Base | Branco | `#FFFFFF` | rgb(255, 255, 255) |

O magenta é a cor de destaque e energia; o grafite é a cor de estrutura (texto, navegação, fundos escuros).

---

## 2. Escalas de Cor

### Magenta (primary)
| Token | Hex |
|---|---|
| magenta-50 | `#FEEBF4` |
| magenta-100 | `#FDD1E6` |
| magenta-200 | `#FBA4CD` |
| magenta-300 | `#F976B4` |
| magenta-400 | `#F63F95` |
| **magenta-500** | **`#F30274`** |
| magenta-600 | `#CC0261` |
| magenta-700 | `#A5014F` |
| magenta-800 | `#83013F` |
| magenta-900 | `#61012E` |

### Grafite (dark / structure)
| Token | Hex |
|---|---|
| graphite-50 | `#EDEEEF` |
| graphite-100 | `#D7D8DA` |
| graphite-200 | `#AFB1B5` |
| graphite-300 | `#878A90` |
| graphite-400 | `#565A62` |
| **graphite-500** | **`#212631`** |
| graphite-600 | `#1C2029` |
| graphite-700 | `#161A21` |
| graphite-800 | `#12151A` |
| graphite-900 | `#0D0F14` |

### Neutros (cool gray, leve tint grafite)
| Token | Hex |
|---|---|
| neutral-50 | `#EEEFF0` |
| neutral-100 | `#E5E7EA` |
| neutral-200 | `#D4D7DC` |
| neutral-300 | `#BCC2CB` |
| neutral-400 | `#9CA5B3` |
| neutral-500 | `#617086` |
| neutral-600 | `#505C6F` |
| neutral-700 | `#404B5A` |
| neutral-800 | `#333B47` |
| neutral-900 | `#262C35` |

---

## 3. Cores Semânticas (feedback)

Escolhidas para conviver com o magenta sem competir (evitando vermelho que se confunde com a marca):

| Papel | Hex | Uso |
|---|---|---|
| Success | `#12A150` | confirmações, pagamento aprovado, contrato assinado |
| Warning | `#E0A11B` | reajustes próximos, pendências |
| Error | `#E5484D` | inadimplência, falhas, validação |
| Info | `#3B82F6` | avisos informativos (azul, para não colidir com o magenta) |

> Nota: o magenta NÃO é usado como cor semântica — ele é a identidade. Erros usam um vermelho distinto o suficiente (#E5484D) para não se confundir com o fúcsia.

---

## 4. Tokens Semânticos (light mode)

| Token | Valor | Uso |
|---|---|---|
| background.default | #F7F8FA | fundo geral da aplicação |
| background.paper | #FFFFFF | cards, superfícies |
| text.primary | #212631 (grafite-500) | texto principal |
| text.secondary | #505C6F (neutral-600) | texto de apoio |
| text.disabled | #9CA5B3 (neutral-400) | desabilitado |
| divider | #E5E7EA (neutral-100) | bordas e separadores |
| primary.main | #F30274 | ações primárias, destaque |
| secondary.main | #212631 | estrutura, botões escuros |

### Dark mode (grafite protagonista — como o app-icon escuro da marca)
| Token | Valor |
|---|---|
| background.default | #0D0F14 (graphite-900) |
| background.paper | #161A21 (graphite-700) |
| text.primary | #F2F3F5 |
| text.secondary | #AFB1B5 (graphite-200) |
| primary.main | #F63F95 (magenta-400 — mais vibrante no escuro) |
| secondary.main | #FFFFFF |

---

## 5. Tipografia

- Display / títulos: Space Grotesk ou Sora
- Corpo / UI: Inter
- Dados / mono: JetBrains Mono ou Roboto Mono

### Escala de tipo
| Papel | Tamanho | Peso | Line-height |
|---|---|---|---|
| h1 | 40px / 2.5rem | 700 | 1.15 |
| h2 | 32px / 2rem | 700 | 1.2 |
| h3 | 26px / 1.625rem | 600 | 1.25 |
| h4 | 21px / 1.3125rem | 600 | 1.3 |
| h5 | 18px / 1.125rem | 600 | 1.4 |
| h6 | 16px / 1rem | 600 | 1.4 |
| body1 | 16px / 1rem | 400 | 1.6 |
| body2 | 14px / 0.875rem | 400 | 1.55 |
| caption | 12px / 0.75rem | 400 | 1.4 |
| overline | 12px / 0.75rem | 600 | 1.4 (caixa alta, tracking +) |
| button | 14px / 0.875rem | 600 | 1 (sem uppercase) |

Títulos grandes com tracking levemente negativo (-1% a -2%).

---

## 6. Espaçamento
Base de 8px. Escala: 4, 8, 12, 16, 24, 32, 40, 48, 64.

## 7. Raio de borda
| Token | Valor | Uso |
|---|---|---|
| sm | 8px | inputs, chips |
| md | 12px | botões, cards pequenos |
| lg | 16px | cards, modais |
| xl | 20px | seções de destaque |
| full | 9999px | avatares, badges/pills |

## 8. Sombras (elevation)
| Nível | Valor |
|---|---|
| sm | 0 1px 2px rgba(33, 38, 49, 0.06) |
| md | 0 4px 16px rgba(33, 38, 49, 0.08), 0 1px 2px rgba(33, 38, 49, 0.06) |
| lg | 0 16px 40px rgba(33, 38, 49, 0.14), 0 2px 4px rgba(33, 38, 49, 0.06) |

Glow de acento (sobre grafite): magenta #F30274 a ~24% de opacidade com blur.

## 9. Breakpoints (mobile-first)
xs 0 · sm 600 · md 900 · lg 1200 · xl 1536

---

## 10. Configuração MUI (createTheme)

\`\`\`ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#F30274', light: '#F63F95', dark: '#A5014F', contrastText: '#FFFFFF' },
    secondary: { main: '#212631', light: '#565A62', dark: '#12151A', contrastText: '#FFFFFF' },
    success: { main: '#12A150' },
    warning: { main: '#E0A11B' },
    error: { main: '#E5484D' },
    info: { main: '#3B82F6' },
    background: { default: '#F7F8FA', paper: '#FFFFFF' },
    text: { primary: '#212631', secondary: '#505C6F', disabled: '#9CA5B3' },
    divider: '#E5E7EA',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h1: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.15 },
    h2: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
    h3: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.625rem', fontWeight: 600, lineHeight: 1.25 },
    h4: { fontWeight: 600, fontSize: '1.3125rem', lineHeight: 1.3 },
    h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
})
\`\`\`

---

## 11. Diretrizes de Uso da Cor

- **Grafite** carrega a estrutura: texto, navegação (sidebar), fundos escuros, botões secundários. Cor de "seriedade".
- **Magenta** é a identidade e o acento energético: botões primários, links, estados ativos, destaques, glow. Grandes áreas de magenta funcionam em heros pontuais; na UI densa ele é acento, não preenchimento geral.
- **Neutros** carregam a maior parte da UI.
- Semânticas só para feedback — o vermelho de erro é distinto do magenta de propósito.
- Combinação de assinatura: **magenta sobre grafite** (e vice-versa) — o par mais forte, para heros e destaques.

## 12. Pendências para validar
- [ ] Confirmar fonte display (Space Grotesk vs Sora)
- [ ] Validar dark mode (grafite protagonista)
- [ ] Validar cores semânticas contra a nova paleta
