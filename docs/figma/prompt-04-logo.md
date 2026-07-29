# Prompt para a IA do Figma — Incorporar a Logo Oficial

Use este prompt DEPOIS de já ter a logo definida disponível como imagem (você vai anexar/colar a logo na conversa com a IA do Figma, ou já tê-la subido como imagem no arquivo). Ele instrui a IA a integrar a marca de verdade ao design já existente, em vez de continuar com o texto "Ketris" solto em Space Grotesk.

---

```
Continue no MESMO arquivo Figma, reutilizando os componentes, variáveis e telas já criados. NÃO recrie o design system do zero.

Vou te fornecer a LOGO OFICIAL da Ketris (anexada/colada nesta mensagem). Ela é composta por: um símbolo (prédio estilizado + rede de nós conectados) e o wordmark "Ketris" em tipografia geométrica, nas cores oficiais da marca — magenta #F30274 e grafite #212631. Existem variações: símbolo + wordmark horizontal, símbolo isolado em fundo magenta (app icon), símbolo isolado em fundo grafite (app icon dark).

## TAREFA
Substitua todo texto placeholder "Ketris" (atualmente representado apenas como texto em Space Grotesk Bold) pela LOGO REAL nos seguintes lugares:

1. **Página "Design System"**: adicione uma seção "Logo" no topo, mostrando:
   - A logo principal (símbolo + wordmark) em tamanho grande, sobre fundo branco
   - A versão da logo sobre fundo grafite (para uso em telas escuras/dark mode)
   - A versão do símbolo isolado (para favicon, app icon, avatar da marca)
   - A área de proteção mínima ao redor da logo (respiro que não pode ser invadido por outros elementos) — use como referência 1x a altura do símbolo em todos os lados
   - O tamanho mínimo recomendado de uso (para não perder legibilidade do wordmark)
   - Exemplo de USO INCORRETO ao lado: não distorcer, não mudar as cores, não separar símbolo do texto em contextos de marca cheia, não aplicar sobre fundos que quebrem o contraste (ex.: magenta sobre magenta)

2. **Header / Topbar do marketplace (mobile e desktop)**: troque o texto "Ketris" pela logo real (símbolo + wordmark horizontal), mantendo a altura proporcional à topbar (a logo não deve ocupar mais que ~60% da altura da barra).

3. **Sidebar do dashboard**: troque o texto "Ketris" no topo da sidebar pela logo. Como a sidebar é grafite, use a versão da logo adequada para fundo escuro (wordmark em branco ou magenta, símbolo com contraste correto — ajuste conforme a variação que eu enviar).

4. **Telas de autenticação (Login, Cadastro, Recuperar senha)**: troque o texto "Ketris" no topo pela logo real, tamanho médio, centralizada ou alinhada como já está no layout atual.

5. **Favicon / App icon**: crie um frame separado "Brand / App Icon" com o símbolo isolado nas duas variações (fundo magenta e fundo grafite), em formato quadrado com cantos arredondados (raio ~22% da largura, padrão de ícone de app), nos tamanhos 512x512 e 192x192, para eu poder exportar depois.

6. **Landing/Home (hero)**: se houver uma versão da logo adequada para fundo escuro/colorido (ex.: wordmark em branco), use-a no header transparente/glass sobre o hero. Caso a logo não tenha essa variação, aplique a logo original sobre um chip/fundo branco pequeno para garantir contraste, em vez de forçar a logo colorida sobre fundo que quebra a legibilidade.

## REGRAS DE APLICAÇÃO
- NÃO redesenhe a logo — use a imagem/vetor fornecido exatamente como está, apenas redimensionando proporcionalmente (nunca esticando desproporcionalmente).
- Mantenha a área de proteção mínima ao redor da logo em toda aplicação — não deixe outros elementos (textos, ícones, bordas) invadirem esse espaço.
- Sempre que a logo estiver sobre uma cor sólida, garanta contraste suficiente. Se a variação de cor correta não estiver disponível para aquele fundo, me avise em vez de aplicar uma versão com baixo contraste.
- Depois de aplicar a logo em todos os lugares acima, revise a página "Screens" inteira e substitua qualquer outro texto "Ketris" solto que ainda exista por uma instância da logo.
- Ao terminar, liste todos os lugares onde a logo foi aplicada e me avise se algum uso ficou com contraste ou proporção duvidosos.
```

---

## Antes de usar este prompt

Você precisa **anexar a logo** na mesma mensagem em que colar este prompt (a IA do Figma precisa "ver" o arquivo de imagem/vetor real da logo, não só a descrição em texto). Algumas dicas práticas:

- Se você tiver a logo em **SVG**, é melhor que PNG — mantém nitidez em qualquer tamanho e a IA consegue trazer como vetor editável no Figma.
- Se só tiver o PNG que você me mandou antes (o print com o mockup), vale primeiro **isolar a logo limpa** (símbolo + wordmark, sem o mockup de fachada e sem o fundo de amostras de cor) antes de mandar pra IA — assim ela aplica só o ativo de marca, sem "colar" o restante da composição.
- Se você tiver as variações separadas (símbolo isolado, versão para fundo escuro, versão para fundo claro), anexe todas — o prompt já assume que elas existem e diz onde usar cada uma. Se só tiver uma versão única, é só avisar a IA no início da conversa que ela vai precisar adaptar/recolorir com cuidado, ou você me pede que eu gere as variações antes.
