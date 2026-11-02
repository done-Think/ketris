# Motor Python do face_check

O Ketris chama um serviço Python privado na porta 8765. O código está em
[`services/face_check_engine`](../services/face_check_engine/README.md) e foi
extraído dos módulos reais `bench` do piloto `facecheck-pilot`, commit
`3d9357a`. O serviço roda em processo/container persistente; não utiliza Lambda.

O motor calcula comparação facial, qualidade, regiões de documento, OCR,
movimento e escores anti-spoof. O backend Ketris continua responsável por
autenticação de usuários, sessões, desafios, storage, revisão, auditoria e
decisões. O token privado do motor, `FACE_CHECK_ENGINE_TOKEN`, autentica somente
o backend via Bearer. Ele não é um token público nem de sessão de usuário.

A orientação do rosto no RG antigo pode ser diferente da orientação do texto.
O motor mantém a foto do titular na posição correta para detecção/comparação
facial e orienta separadamente o quadro usado pelo OCR. A contagem de regiões
de texto e a medição de luminosidade usam esse mesmo quadro legível; texto
girado não deve ser tratado como texto ausente. Os limites de qualidade,
detecção de rosto, comparação e revisão manual permanecem iguais.

A prévia do documento preserva a proporção real do vídeo e mostra o mesmo
quadro que será fotografado. O controle retrato/paisagem muda a guia de
enquadramento. Solicitar uma resolução ideal maior não aumenta a resolução
nativa da câmera; para documentos pequenos, o fluxo permite continuar no
celular também durante a captura.

O contrato do piloto foi mantido em `POST /match`, `/inspect`,
`/document-regions`, `/liveness` e `/proximity`. O Ketris acrescenta `/framing`
para orientar o posicionamento inicial da selfie com detecção YuNet. As prévias
são reduzidas para até 640 pixels no lado maior e não são armazenadas. O BFF
exige consentimento, frente e verso do documento e uma sessão de captura vigente,
com cota separada para não consumir as tentativas de envio. O navegador compara
o rosto com o oval visível, compensando recorte e espelhamento, e adapta as
instruções a computador ou celular em português, inglês e espanhol.

Os resultados incluem as
métricas originais e `experimental: true`, `calibrated: false`. O resultado
`passed` de liveness não autoriza aprovação automática: há bypass conhecido no
cenário t3 do piloto e nenhuma validação de robustez ou taxa de erro é alegada.
Mantenha a aprovação automática do backend desligada até calibração e validação
independentes. Os thresholds originais permanecem explícitos nos módulos para
permitir essa avaliação, sem inventar novas taxas.

O servidor só abre a porta após validar SHA-256 dos modelos, carregar as redes
e aquecer o OCR. O healthcheck público e mínimo `GET /health` retorna `status:
"ok"`. Os modelos são baixados e verificados durante o build ou por comando
explícito de preparação; não há download no startup nem em requisições. A
imagem carrega os modelos uma única vez por processo, roda como UID 10001 e
suporta filesystem somente leitura com `/tmp` efêmero.

O Docker deve publicar apenas `127.0.0.1:8765:8765`, ou usar rede privada
equivalente entre backend e engine. A chamada do backend envia JSON e
`Authorization: Bearer <FACE_CHECK_ENGINE_TOKEN>`. Configure o mesmo segredo
privado dos dois lados; não use `NEXT_PUBLIC_*`. O container escuta `0.0.0.0`
internamente. Receitas locais/Docker e detalhes de cada endpoint estão no
[README do motor](../services/face_check_engine/README.md).

As proteções da borda limitam corpo a 12 MiB, foto a 3 MiB e imagem a 16 milhões
de pixels; base64 e campos são validados antes do pipeline. Liveness aceita
1..3 frames com desafios válidos e únicos. O pipeline OpenCV/ONNX é serializado,
com `429 ENGINE_BUSY` imediato para concorrência, no máximo 8 conexões e leitura
do corpo limitada a 5 segundos. OCR tem orçamento de 24 inferências/20 segundos
por análise e limites para saída de texto. Esse prazo é cooperativo: uma chamada
nativa em andamento depende de timeout do cliente e supervisão do processo.

O motor não grava fotos, não contém storage, não registra tokens, corpo de
requests, nomes, CPF, imagens ou texto OCR. Erros HTTP têm códigos fixos e as
falhas internas registram apenas a categoria da exceção. A suíte transporta
apenas imagens sintéticas ou fakes; os smoke tests de modelos reais são opt-in.
O serviço não inclui demos, ferramentas de captura, relatórios do piloto,
Supabase, Node app, credenciais ou arquivos binários dos modelos no Git.

Para validar sem instalar o stack nativo, execute na pasta do motor:

```sh
python3 -m unittest discover -s tests -p 'test_request_limits.py' -v
python3 -m unittest discover -s tests -p 'test_http_service.py' -v
python3 -m unittest discover -s tests -p 'test_startup.py' -v
python3 -m unittest discover -s tests -p 'test_metrics.py' -v
```

As versões diretas são fixadas em `requirements.txt`: NumPy 2.0.2, OpenCV
headless 4.13.0.92, RapidOCR 3.10.0 e ONNX Runtime 1.31.1. A imagem usa Python
3.12.12 slim Bookworm com libgomp1. Licenças de YuNet, SFace, MiniFASNet, OCR e
adaptadores legados estão preservadas em
[`licenses/NOTICE.md`](../services/face_check_engine/licenses/NOTICE.md).
