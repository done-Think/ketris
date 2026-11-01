"""Ketris private engine, adapted from facecheck-pilot 3d9357a bench.

Transport hardening is separate from the unchanged experimental scoring rules.
"""
from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from functools import partial
from typing import Any

from download_models import MODELS, MODELS_DIR, sha256_of
from http_service import AnalysisHTTPServer, ServiceConfig
from request_limits import InvalidRequest, MAX_IMAGE_PIXELS, decode_base64_field, validate_image_bytes

YUNET = "face_detection_yunet_2023mar.onnx"
SFACE = "face_recognition_sface_2021dec.onnx"
ENGINE = {
    "detector": "yunet_2023mar",
    "recognizer": "sface_2021dec",
    "text": "rapidocr_3.10.0_ppocrv6",
    "antiSpoof": "minifasnet_v2+v1se",
}


@dataclass
class Engine:
    pipeline: Any
    inspector: Any
    liveness: Any
    ocr: Any


def decode_photo(payload: dict[str, Any], field: str) -> Any:
    from faces import decode_image

    data = decode_base64_field(payload, field)
    validate_image_bytes(data)
    image = decode_image(data)
    if image is None or image.shape[0] * image.shape[1] > MAX_IMAGE_PIXELS:
        raise InvalidRequest("INVALID_IMAGE")
    return image


def describe_face(reading: Any) -> dict[str, Any]:
    return {
        "opened": reading.opened,
        "facesFound": reading.faces_found,
        "detectionScore": reading.detection_score,
        "interocularPx": reading.interocular_px,
    }


def match_payload(engine: Engine, payload: dict[str, Any]) -> dict[str, Any]:
    document = engine.pipeline.read_image(engine.inspector.document_view(decode_photo(payload, "document")))
    selfie = engine.pipeline.read_image(decode_photo(payload, "selfie"))
    similarity = None
    if document.feature is not None and selfie.feature is not None:
        similarity = engine.pipeline.similarity(document.feature, selfie.feature)
    return {"similarity": similarity, "document": describe_face(document), "selfie": describe_face(selfie), "engine": ENGINE}


def inspect_payload(engine: Engine, payload: dict[str, Any]) -> dict[str, Any]:
    expected = payload.get("expected", {})
    return engine.inspector.inspect(
        decode_photo(payload, "image"), payload["kind"],
        expected_name=expected.get("name"), expected_cpf=expected.get("cpf"),
    )


def regions_payload(engine: Engine, payload: dict[str, Any]) -> dict[str, Any]:
    from document_regions import document_regions

    return {"regions": document_regions(decode_photo(payload, "image"))}


def liveness_payload(engine: Engine, payload: dict[str, Any]) -> dict[str, Any]:
    return engine.liveness.verify(
        decode_photo(payload, "selfie"),
        [(frame["challenge"], decode_photo(frame, "image")) for frame in payload["frames"]],
    )


def proximity_payload(engine: Engine, payload: dict[str, Any]) -> dict[str, Any]:
    return engine.liveness.proximity(decode_photo(payload, "selfie"), decode_photo(payload, "image"))


def analyse(engine: Engine, operation: Any, payload: dict[str, Any]) -> dict[str, Any]:
    # The transport owns the shared pipeline lock. OCR caches/budgets live only
    # for this request, including on error, and never retain a capture afterwards.
    with engine.ocr.request_budget():
        return operation(engine, payload)


def build_routes(engine: Engine) -> dict[str, Any]:
    return {
        "/match": partial(analyse, engine, match_payload),
        "/inspect": partial(analyse, engine, inspect_payload),
        "/document-regions": partial(analyse, engine, regions_payload),
        "/liveness": partial(analyse, engine, liveness_payload),
        "/proximity": partial(analyse, engine, proximity_payload),
    }


def load_engine(max_side: int = 1600, detection_threshold: float = 0.6, cpu_threads: int = 2) -> Engine:
    # Set the decoder guard before importing OpenCV; headers are checked too.
    os.environ["OPENCV_IO_MAX_IMAGE_PIXELS"] = str(MAX_IMAGE_PIXELS)
    for variable in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
        os.environ[variable] = str(cpu_threads)
    import cv2
    from anti_spoof import MODELS as ANTI_SPOOF_MODELS, AntiSpoof
    from faces import FacePipeline
    from inspection import PhotoInspector
    from liveness import LivenessVerifier
    from rapid_text import RapidTextOCR

    cv2.setNumThreads(cpu_threads)
    for name in (YUNET, SFACE, *(name for name, _ in ANTI_SPOOF_MODELS)):
        model = MODELS_DIR / name
        if not model.is_file() or sha256_of(model) != MODELS[name][1]:
            raise RuntimeError("MODEL_MISSING_OR_MODIFIED")
    pipeline = FacePipeline(MODELS_DIR / YUNET, MODELS_DIR / SFACE, detection_threshold, max_side)
    anti_spoof = AntiSpoof(MODELS_DIR)
    ocr = RapidTextOCR(cpu_threads=cpu_threads)
    return Engine(pipeline, PhotoInspector(pipeline, ocr, anti_spoof, ocr), LivenessVerifier(pipeline, anti_spoof), ocr)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Private, stateless Ketris face_check Python engine")
    parser.add_argument("--host", default=os.environ.get("FACE_CHECK_ENGINE_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--max-side", type=int, default=1600)
    parser.add_argument("--detection-threshold", type=float, default=0.6)
    parser.add_argument("--cpu-threads", type=int, default=2)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535 or not 320 <= args.max_side <= 1600 or not 0 < args.detection_threshold <= 1 or not 1 <= args.cpu_threads <= 4:
        parser.error("Invalid engine limits")
    return args


def main() -> int:
    args = parse_args()
    try:
        config = ServiceConfig(token=os.environ.get("FACE_CHECK_ENGINE_TOKEN", ""))
        engine = load_engine(args.max_side, args.detection_threshold, args.cpu_threads)
        # Bind only after all hashes, native model loads, and OCR warmup pass.
        server = AnalysisHTTPServer((args.host, args.port), build_routes(engine), config)
    except Exception as error:
        sys.stderr.write(f"engine_startup_failed: {type(error).__name__}\n")
        return 1
    print("face_check_engine ready; experimental=true calibrated=false", flush=True)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
