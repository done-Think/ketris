from __future__ import annotations

import hashlib
import os
import sys
import urllib.request
from pathlib import Path

ZOO_MEDIA_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models"
ANTI_SPOOF_URL = "https://github.com/yakhyo/face-anti-spoofing/releases/download/weights"

MODELS = {
    "face_detection_yunet_2023mar.onnx": (
        f"{ZOO_MEDIA_URL}/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    ),
    "face_recognition_sface_2021dec.onnx": (
        f"{ZOO_MEDIA_URL}/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
    ),
    "text_detection_en_ppocrv3_2023may.onnx": (
        f"{ZOO_MEDIA_URL}/text_detection_ppocr/text_detection_en_ppocrv3_2023may.onnx",
        "03f550c6b406fda8bf54bd8327815f6c7e2edd98cea02348c93d879254366587",
    ),
    "text_recognition_CRNN_EN_2021sep.onnx": (
        f"{ZOO_MEDIA_URL}/text_recognition_crnn/text_recognition_CRNN_EN_2021sep.onnx",
        "a84b1f6e11a65c2d733cb0cc1f014aae3f99051e3f11447dc282faa678eee544",
    ),
    "MiniFASNetV2.onnx": (
        f"{ANTI_SPOOF_URL}/MiniFASNetV2.onnx",
        "b32929adc2d9c34b9486f8c4c7bc97c1b69bc0ea9befefc380e4faae4e463907",
    ),
    "MiniFASNetV1SE.onnx": (
        f"{ANTI_SPOOF_URL}/MiniFASNetV1SE.onnx",
        "ebab7f90c7833fbccd46d3a555410e78d969db5438e169b6524be444862b3676",
    ),
}

MODELS_DIR = Path(os.environ.get("FACE_CHECK_MODELS_DIR", str(Path(__file__).resolve().parent / "models")))


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_model(name: str, url: str, expected_sha256: str) -> None:
    target = MODELS_DIR / name
    if target.exists() and sha256_of(target) == expected_sha256:
        print(f"ok  {name} (já baixado, hash confere)")
        return

    partial = target.with_suffix(".part")
    print(f"... baixando {name}")
    # Ketris adaptation: downloading happens only in an explicit build/setup
    # command, never during server startup or an analysis request.
    try:
        with urllib.request.urlopen(url, timeout=60) as response, partial.open("wb") as output:
            while chunk := response.read(1 << 20):
                output.write(chunk)
    except Exception:
        partial.unlink(missing_ok=True)
        raise
    actual = sha256_of(partial)
    if actual != expected_sha256:
        partial.unlink()
        raise SystemExit(
            f"ERRO: hash de {name} não confere.\n  esperado {expected_sha256}\n  recebido {actual}\n"
            "O arquivo foi apagado. Não use o modelo até entender a diferença."
        )
    partial.replace(target)
    print(f"ok  {name} (hash confere)")


def main() -> int:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    for name, (url, expected_sha256) in MODELS.items():
        ensure_model(name, url, expected_sha256)
    return 0


if __name__ == "__main__":
    sys.exit(main())
