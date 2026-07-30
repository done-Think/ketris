# Prompt para a IA do Figma — Parte Complementar (Desktop/Web + Painel Administrativo)

Use este bloco DEPOIS de já ter gerado os blocos anteriores (Design System + Blocos 1 a 5). Ele reaproveita os mesmos componentes, tokens e direção de arte já criados — não recria o design system. Rode um bloco por vez.

---

```
Continue no MESMO arquivo, reutilizando os componentes, variáveis, tipografia e a direção de arte que você já criou (profundidade em camadas, gradiente no navy, detalhe gráfico de rede da marca, glass, ícones de traço fino, ciano como acento). NÃO recrie o design system. Mantenha consistência absoluta com o que já existe.

Agora vamos fazer DUAS coisas: (A) as versões DESKTOP/WEB das telas que foram feitas mobile-first, e (B) o PAINEL ADMINISTRATIVO.

## PRINCÍPIO DE RESPONSIVIDADE
O produto é mobile-first (a maioria acessa pelo celular), mas tem versão web completa. Para cada tela mobile já existente, crie a versão desktop correspondente — não é só "esticar", é reorganizar para telas largas:
- Aproveitar o espaço horizontal: conteúdo em colunas/grids, não uma coluna central esticada.
- Navegação: no mobile é bottom nav / menu hambúrguer; no desktop é header fixo (marketplace) ou sidebar (áreas logadas).
- Hero e seções ocupam largura total com conteúdo alinhado num container central (max ~1200-1280px).
- Cards em grid de múltiplas colunas (ex.: imóveis em 3-4 colunas no desktop vs 1 no mobile).
- Mantenha os MESMOS tokens, componentes e estética; muda o layout, não a identidade.

Larguras de frame: mobile 390px · desktop 1440px (container interno ~1200px).

## BLOCO 6 — Marketplace público em DESKTOP (1440)
Recrie em desktop as telas do Bloco 1:
- Home desktop: header transparente/glass fixo com logo, navegação (Comprar, Alugar, Anunciar, Entrar) e botão primário; hero navy full-width com gradiente + malha de rede da marca, título grande (48-56px), busca em card glass horizontal com múltiplos campos (finalidade, local, tipo, faixa de preço) lado a lado; seção "em destaque" com grid de 3-4 cards de imóvel; seção de categorias/cidades; faixa de confiança/números; rodapé rico em colunas.
- Busca desktop: layout de duas colunas — filtros à esquerda (painel fixo) OU barra de filtros no topo + resultados em grid (3 colunas) à esquerda e MAPA fixo à direita ocupando a altura (split view lista/mapa). Pins estilizados, card de imóvel aparece ao passar o mouse no pin.
- Detalhe do imóvel desktop: galeria em mosaico (1 foto grande + miniaturas), coluna principal com descrição/características/mapa e uma coluna lateral fixa (sticky) com card de preço, corretor responsável e botões "Agendar visita" / "Enviar proposta".

## BLOCO 7 — Área do usuário final (locatário) em desktop e mobile
- Painel do locatário: contrato ativo, próximas cobranças (com status), chamados de manutenção abertos, atalhos. Desktop com sidebar; mobile com bottom nav.
- Tela de proposta/negociação: acompanhamento do status da proposta.
- Meus contratos e pagamentos: lista + detalhe com boletos/PIX e histórico.

## BLOCO 8 — PAINEL ADMINISTRATIVO DA IMOBILIÁRIA/CONSTRUTORA (desktop 1440)
Este é o "admin" do TENANT (a empresa cliente gerencia sua própria operação). Reutiliza a sidebar, mas com seção administrativa:
- Visão geral corporativa: KPIs consolidados (imóveis, leads, contratos, receita, inadimplência), gráfico de desempenho por equipe, ranking de corretores.
- Gestão de usuários e equipes: tabela de membros (avatar, papel, status, último acesso), botão "Convidar usuário", modal de convite.
- Permissões e papéis: tela de configuração de papéis (Admin, Gestor, Corretor, Financeiro) com matriz de permissões (toggles por módulo).
- Distribuição de leads: regras de roteamento automático de leads para corretores.
- Relatórios: filtros + gráficos + tabela exportável.
- Auditoria: timeline/tabela de ações dos usuários (quem fez o quê e quando).
- Configurações do tenant: dados da empresa, identidade visual (white-label: logo, cor primária/secundária com preview ao vivo do tema), domínio próprio, plano/assinatura e billing.

## BLOCO 9 — PAINEL DO SUPER-ADMIN DA PLATAFORMA (Ketris) (desktop 1440)
Este é o admin INTERNO da Ketris (nível plataforma, acima dos tenants). Estética um pouco mais "sistema/console", ainda dentro da marca:
- Visão geral da plataforma: MRR, número de tenants ativos, novos cadastros, uso, gráficos de crescimento.
- Gestão de tenants: tabela de todas as imobiliárias/corretores clientes (nome, plano, status, MRR, usuários), com detalhe do tenant.
- Gestão de planos: definição de planos, preços, limites e feature flags por tier.
- Moderação de anúncios: fila de imóveis para revisão/aprovação.
- Suporte/tickets: lista de chamados de suporte dos clientes.
- Métricas financeiras da plataforma: receita, churn, inadimplência agregada.
- Feature flags: liberar/bloquear recursos por tenant ou por plano.

## ADAPTAÇÃO MOBILE DOS PAINÉIS
Para os painéis administrativos (Blocos 8 e 9), crie também versões mobile essenciais (390px) das telas mais consultadas (visão geral/KPIs e listas principais), com a navegação virando menu lateral deslizante (drawer) e as tabelas viram cards empilhados. Não precisa portar toda tela densa para mobile — priorize as de consulta rápida.

## PADRÕES DE COMPONENTE A REUTILIZAR/EXPANDIR
- Tabela de dados (arejada, cabeçalho em overline, status em chip, linha com hover, ações à direita) — crie como componente se ainda não existir.
- Modal/dialog (para convites, confirmações) com overlay escurecido e card elevado.
- Toggle/switch e matriz de permissões.
- Card de métrica com indicador de tendência.
- Preview de tema white-label (mostrando como as cores do tenant aplicam na marca).
- Bottom navigation (mobile) e Header de marketplace (desktop) como componentes.

## REGRAS FINAIS (mantidas)
- Mobile-first na concepção, mas entregue AMBAS as versões (mobile 390 + desktop 1440) para marketplace e área do usuário; painéis densos priorizam desktop com mobile essencial.
- Profundidade em camadas em todo card; nunca só borda. Seções alternam fundo. Ciano é acento. Ícones de traço fino, nunca emoji.
- Consistência absoluta com os tokens e componentes já criados.
- Ao fim de cada bloco, liste o que criou e pergunte se pode seguir para o próximo.

Comece pelo BLOCO 6 (marketplace desktop) e siga na ordem.
```

---

## Uma coisa que vale você decidir (afeta o Bloco 8 vs 9)

"Painel administrativo" tem **dois níveis** na Ketris, e por isso separei em dois blocos no prompt:

- **Bloco 8 — Admin do tenant:** a imobiliária/construtora administrando a própria operação (usuários, permissões, relatórios, white-label). É o "admin" que o seu cliente usa.
- **Bloco 9 — Super-admin da plataforma:** você/Ketris administrando todos os clientes, planos, MRR, moderação. É o "admin" interno de quem opera o SaaS.

Deixei os dois no prompt porque um SaaS multi-tenant como o seu normalmente precisa dos dois. Se por enquanto você só quer um deles, é só apagar o bloco que não interessa antes de colar. Se quiser, me diz qual é o foco agora e eu enxugo o prompt para ele.

Um lembrete honesto: esse complemento é grande (4 blocos). Assim como os anteriores, rode **um bloco por vez** e valide — jogar tudo de uma vez costuma derrubar a qualidade que você acabou de conquistar.
