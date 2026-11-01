"""Untrusted request validation; intentionally uses only the standard library."""
from __future__ import annotations

import base64
import binascii
import struct
from typing import Any

MAX_BODY_BYTES = 12 * 1024 * 1024
MAX_PHOTO_BYTES = 3 * 1024 * 1024
MAX_IMAGE_PIXELS = 16_000_000
MAX_BASE64_CHARS = ((MAX_PHOTO_BYTES + 2) // 3) * 4
PHOTO_KINDS = ("front", "back", "selfie")
LIVENESS_CHALLENGES = ("turnLeft", "turnRight", "closer")


class InvalidRequest(Exception):
    """Only fixed, non-sensitive messages may be returned to the caller."""


class PayloadTooLarge(InvalidRequest):
    pass


class AnalysisLimitExceeded(Exception):
    pass


def decode_base64_field(payload: dict[str, Any], field: str) -> bytes:
    value = payload.get(field)
    if not isinstance(value, str) or not value:
        raise InvalidRequest("IMAGE_REQUIRED")
    if len(value) > MAX_BASE64_CHARS:
        raise PayloadTooLarge("PHOTO_TOO_LARGE")
    try:
        decoded = base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError) as error:
        raise InvalidRequest("INVALID_BASE64") from error
    if len(decoded) > MAX_PHOTO_BYTES:
        raise PayloadTooLarge("PHOTO_TOO_LARGE")
    if not decoded:
        raise InvalidRequest("IMAGE_REQUIRED")
    return decoded


def image_dimensions(data: bytes) -> tuple[int, int]:
    """Read PNG/JPEG/WebP dimensions before allocating decoded image pixels."""
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 33 and data[12:16] == b"IHDR":
        return struct.unpack(">II", data[16:24])
    if data.startswith(b"\xff\xd8"):
        offset = 2
        while offset < len(data):
            if data[offset] != 0xFF:
                break
            while offset < len(data) and data[offset] == 0xFF:
                offset += 1
            if offset >= len(data):
                break
            marker = data[offset]
            offset += 1
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                continue
            if marker in (0xD9, 0xDA) or offset + 2 > len(data):
                break
            length = int.from_bytes(data[offset:offset + 2], "big")
            if length < 2 or offset + length > len(data):
                break
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                if length < 8:
                    break
                height, width = struct.unpack(">HH", data[offset + 3:offset + 7])
                return width, height
            offset += length
    if len(data) >= 30 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        kind = data[12:16]
        if kind == b"VP8X":
            return (1 + int.from_bytes(data[24:27], "little"), 1 + int.from_bytes(data[27:30], "little"))
        if kind == b"VP8 " and data[23:26] == b"\x9d\x01\x2a":
            width, height = struct.unpack("<HH", data[26:30])
            return width & 0x3FFF, height & 0x3FFF
        if kind == b"VP8L" and data[20] == 0x2F:
            packed = int.from_bytes(data[21:25], "little")
            return (packed & 0x3FFF) + 1, ((packed >> 14) & 0x3FFF) + 1
    raise InvalidRequest("UNSUPPORTED_OR_INVALID_IMAGE")


def validate_image_bytes(data: bytes) -> None:
    if len(data) > MAX_PHOTO_BYTES:
        raise PayloadTooLarge("PHOTO_TOO_LARGE")
    width, height = image_dimensions(data)
    if width <= 0 or height <= 0:
        raise InvalidRequest("INVALID_IMAGE_DIMENSIONS")
    if width * height > MAX_IMAGE_PIXELS:
        raise PayloadTooLarge("IMAGE_TOO_MANY_PIXELS")


def validate_payload(path: str, payload: Any) -> None:
    if not isinstance(payload, dict):
        raise InvalidRequest("JSON_OBJECT_REQUIRED")
    fields = {
        "/match": ({"document", "selfie"}, {"document", "selfie"}),
        "/inspect": ({"kind", "image", "expected"}, {"image"}),
        "/document-regions": ({"image"}, {"image"}),
        "/liveness": ({"selfie", "frames"}, {"selfie"}),
        "/proximity": ({"selfie", "image"}, {"selfie", "image"}),
        "/framing": ({"image"}, {"image"}),
    }
    allowed, photos = fields[path]
    if payload.keys() - allowed:
        raise InvalidRequest("UNKNOWN_FIELD")
    if path == "/inspect":
        if payload.get("kind") not in PHOTO_KINDS:
            raise InvalidRequest("INVALID_PHOTO_KIND")
        expected = payload.get("expected", {})
        if not isinstance(expected, dict) or expected.keys() - {"name", "cpf"}:
            raise InvalidRequest("INVALID_EXPECTED_PERSON")
        for field, limit in (("name", 200), ("cpf", 14)):
            value = expected.get(field)
            if value is not None and (not isinstance(value, str) or len(value) > limit):
                raise InvalidRequest("INVALID_EXPECTED_PERSON")
    if path == "/liveness":
        frames = payload.get("frames")
        if not isinstance(frames, list) or not 1 <= len(frames) <= 3:
            raise InvalidRequest("FRAMES_MUST_BE_1_TO_3")
        seen = set()
        for frame in frames:
            if not isinstance(frame, dict) or frame.keys() != {"challenge", "image"}:
                raise InvalidRequest("INVALID_FRAME")
            challenge = frame.get("challenge")
            if not isinstance(challenge, str) or challenge not in LIVENESS_CHALLENGES or challenge in seen:
                raise InvalidRequest("INVALID_CHALLENGE")
            seen.add(challenge)
            validate_image_bytes(decode_base64_field(frame, "image"))
    for field in photos:
        data = decode_base64_field(payload, field)
        validate_image_bytes(data)
        if path == "/framing":
            width, height = image_dimensions(data)
            if len(data) > 512 * 1024 or width * height > 1024 * 1024:
                raise PayloadTooLarge("FRAMING_IMAGE_TOO_LARGE")
