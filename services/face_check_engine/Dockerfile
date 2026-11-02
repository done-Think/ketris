FROM python:3.12.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    FACE_CHECK_ENGINE_HOST=0.0.0.0 \
    FACE_CHECK_MODELS_DIR=/app/models \
    OMP_NUM_THREADS=2 \
    OPENBLAS_NUM_THREADS=2 \
    MKL_NUM_THREADS=2 \
    NUMEXPR_NUM_THREADS=2 \
    OPENCV_IO_MAX_IMAGE_PIXELS=16000000 \
    HOME=/tmp

WORKDIR /app
RUN apt-get update \
    && apt-get install --yes --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 engine \
    && useradd --uid 10001 --gid engine --no-create-home --home-dir /tmp engine

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --only-binary=:all: -r requirements.txt
COPY *.py ./
COPY licenses/ ./licenses/
# Only this explicit build step accesses model hosts. Startup never downloads.
# Verify the downloaded ONNX and the RapidOCR-bundled hashes, load/warm models.
RUN python download_models.py \
    && python -c "from match_server import load_engine; load_engine()" \
    && chmod -R a-w /app

USER 10001:10001
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=3s --start-period=90s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/health', timeout=2).close()"]
CMD ["python", "match_server.py", "--host", "0.0.0.0", "--port", "8765"]
