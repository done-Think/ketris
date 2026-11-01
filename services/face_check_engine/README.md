# Ketris face_check engine

Motor Python privado e stateless derivado de `facecheck-pilot` `3d9357a/bench`.
Executa YuNet, SFace, MiniFASNet V2/V1SE e RapidOCR em CPU, em um processo.
Sessões, tokens de usuários, armazenamento, auditoria e decisões pertencem ao
backend Ketris. Os escores são experimentais, sem calibração populacional;
`passed` de liveness é uma métrica do piloto, não uma decisão de aprovação.

## Execução local

Requer Python 3.12 e as versões em `requirements.txt`. Linux precisa de
`libgomp1`; o Dockerfile já instala a biblioteca. Comandos a partir desta pasta:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install --only-binary=:all: -r requirements.txt
.venv/bin/python download_models.py
# Defina FACE_CHECK_ENGINE_TOKEN pelo gerenciador local de segredos.
.venv/bin/python match_server.py --host 127.0.0.1 --port 8765
```

O token é obrigatório, não deve conter espaços e deve ser aleatório de pelo
menos 32 bytes. Ele autentica o backend, não o usuário final. Use o mesmo valor
na configuração privada do adapter HTTP do Ketris. Não o exponha em variáveis
`NEXT_PUBLIC_*`, navegador, URL, argumentos de linha de comando ou arquivos Git.

`download_models.py` é uma etapa explícita de preparação com SHA-256 fixos. O
servidor **não baixa modelos**. Além dos quatro modelos de rosto/anti-spoof, o
script preserva os dois modelos legados do adaptador `text_regions.py`. O OCR
de produção usa os três modelos que acompanham `rapidocr==3.10.0`, também
verificados por SHA-256 antes da criação do OCR. Ausência ou alteração de hash
encerra o processo sem abrir a porta. Cada processo carrega uma instância dos
modelos; não configure múltiplos workers sem dimensionar memória.

## Docker

Da raiz do repositório, após provisionar `FACE_CHECK_ENGINE_TOKEN` no ambiente:

```sh
docker build -t ketris-face-check-engine services/face_check_engine
docker run --rm --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --cap-drop ALL --security-opt no-new-privileges --cpus=2 --memory=1536m \
  --pids-limit 64 -p 127.0.0.1:8765:8765 \
  -e FACE_CHECK_ENGINE_TOKEN ketris-face-check-engine
```

O build acessa os hosts dos modelos, verifica os hashes e exercita a carga e
warmup; o runtime escuta `0.0.0.0:8765` dentro do container com UID/GID 10001.
Publique a porta apenas em loopback ou rede privada do backend. O processo usa
duas threads de CPU por padrão (`--cpu-threads` aceita 1..4) e um pipeline por
vez. Os limites de memória acima são uma configuração inicial a medir, não uma
garantia de uso máximo. Nenhum arquivo de imagem é gravado pelo motor.

O healthcheck interno consulta `/health`. A porta só é aberta depois da carga
e warmup; um `200` indica que a inicialização terminou. É permitido usar a
imagem com filesystem somente leitura e `/tmp` efêmero. Nenhum volume de fotos
é necessário. Os modelos fazem parte da imagem, nunca do repositório.

## Contrato HTTP

Todas as análises exigem `Authorization: Bearer <FACE_CHECK_ENGINE_TOKEN>`,
`Content-Type: application/json` e um único `Content-Length`. Não se aceita
`Transfer-Encoding`. Não há cookies, login, CORS, sessões ou decisões de negócio.

| Método e rota | JSON de entrada | JSON de saída preservado do piloto |
| --- | --- | --- |
| `GET /health` | sem corpo/auth | `status: "ok"`, `experimental: true`, `calibrated: false` |
| `POST /match` | `document`, `selfie`: base64 | `similarity`, `document`, `selfie`, `engine` |
| `POST /inspect` | `kind`: `front`/`back`/`selfie`, `image`: base64, `expected?`: `{name?, cpf?}` | `issues`, `hashes`, `document`, `liveScore`, `limits`, `metrics` |
| `POST /document-regions` | `image`: base64 | `regions` |
| `POST /liveness` | `selfie`: base64, `frames`: `[{challenge, image}]` | `passed`, `issues`, `limits`, `liveScore`, `frames` |
| `POST /proximity` | `selfie`, `image`: base64 | `ready`, `closerRatio` |

Toda saída de análise acrescenta `experimental: true` e `calibrated: false` no
nível superior. Os schemas Zod que removem chaves extras continuam compatíveis.
Limites e thresholds de negócio do piloto foram preservados em
`inspection.py` e `liveness.py`; nenhuma taxa de acerto é inferida desses testes.

Limites de entrada:

- Corpo JSON total: 12 MiB, incluindo base64. Duas fotos de 3 MiB cabem; um
  pedido de liveness com selfie e três frames precisa respeitar o mesmo teto.
- Cada foto: até 3 MiB decodificados, base64 estrito sem prefixo `data:` ou
  espaços. Apenas JPEG, PNG e WebP; dimensões são verificadas antes do decoder e
  novamente depois da decodificação, até 16.000.000 pixels por imagem.
- Liveness: 1..3 frames, desafios únicos `turnLeft`, `turnRight`, `closer`.
  A sessão Ketris é responsável por exigir a sequência e a quantidade esperadas.
- `expected.name`: até 200 caracteres; `expected.cpf`: até 14. Campos extras,
  chaves JSON duplicadas, constantes não finitas e tipos inesperados são recusados.
- Leitura do corpo: prazo total de 5 segundos. Há timeout de socket para o
  cabeçalho e no máximo 8 conexões atendidas simultaneamente.
- OCR: até 24 inferências de vistas por análise e orçamento cooperativo de
  20 segundos; até 256 regiões de texto e 512 caracteres por região. Cache OCR
  é limpo ao final de cada pedido, inclusive em erro.

| Status | `code` | Significado |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | JSON, imagem ou campos inválidos; sem eco de valores |
| 401 | `UNAUTHORIZED` | Bearer ausente/incorreto/duplicado |
| 404 | `NOT_FOUND` | Rota desconhecida |
| 408 | `REQUEST_TIMEOUT` | Prazo de leitura do corpo excedido |
| 413 | `PAYLOAD_TOO_LARGE` | Corpo, foto ou pixels excederam o limite |
| 415 | `JSON_REQUIRED` | Content-Type incorreto |
| 429 | `ENGINE_BUSY` | Pipeline ou conexões ocupados; `Retry-After: 1` |
| 503 | `ANALYSIS_LIMIT_EXCEEDED` | Orçamento de OCR excedido |
| 500 | `ANALYSIS_FAILED` | Falha interna sanitizada |

A autenticação usa `hmac.compare_digest`. O semáforo é adquirido sem espera e
envolve todo o pipeline nativo, incluindo OpenCV e OCR. Um pedido concorrente
recebe `429` imediatamente; `/health` pode responder durante uma análise. Não
há logs de imagens, texto OCR, identidade, cabeçalhos, tokens ou request body.
Falhas internas registram apenas a classe da exceção.

O limite de tempo do OCR é cooperativo entre chamadas nativas. Não se tenta
matar uma thread dentro do OpenCV/ONNX Runtime: uma inferência nativa bloqueada
continua segurando o pipeline e novos pedidos recebem `429`. Configure timeout
no adapter do backend e supervisão/restart do processo para falhas nativas.
O `200 /health` não mede a duração nem o sucesso de uma análise em andamento.

## Verificação

Testes sem dependências nativas e sem modelos:

```sh
python3 -m unittest discover -s tests -p 'test_request_limits.py' -v
python3 -m unittest discover -s tests -p 'test_http_service.py' -v
python3 -m unittest discover -s tests -p 'test_startup.py' -v
python3 -m unittest discover -s tests -p 'test_metrics.py' -v
```

Com as dependências instaladas, a suíte reaproveitada do piloto usa arrays e
fakes para validar regras geométricas, OCR e liveness, sem fotos de pessoas:

```sh
.venv/bin/python -m unittest discover -s tests -v
```

Os testes dos modelos reais só executam quando explicitamente habilitados e
usam imagens geradas por código, sem capturas de pessoas:

```sh
FACE_CHECK_NATIVE_TESTS=1 .venv/bin/python -m unittest discover -s tests -p 'test_native_models.py' -v
```

As licenças e atribuições dos modelos estão em `licenses/NOTICE.md`. Arquivos
de modelos, ambientes virtuais e capturas são ignorados pelo Git, e o contexto
Docker permite apenas fontes Python, requirements e licenças.
