"""Private HTTP transport. No native ML imports, persistence, or user sessions."""
from __future__ import annotations

import hmac
import json
import socket
import sys
import threading
import time
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Callable

from request_limits import AnalysisLimitExceeded, InvalidRequest, MAX_BODY_BYTES, PayloadTooLarge, validate_payload

Route = Callable[[dict[str, Any]], dict[str, Any]]


@dataclass(frozen=True)
class ServiceConfig:
    token: str = field(repr=False)
    read_timeout_seconds: float = 5.0
    max_connections: int = 8

    def __post_init__(self) -> None:
        if not self.token or len(self.token) > 4096 or any(char.isspace() for char in self.token):
            raise ValueError("FACE_CHECK_ENGINE_TOKEN must be a non-empty token without whitespace")
        if not 0 < self.read_timeout_seconds <= 30 or not 2 <= self.max_connections <= 32:
            raise ValueError("Invalid HTTP resource limits")


def build_handler(routes: dict[str, Route], config: ServiceConfig) -> type[BaseHTTPRequestHandler]:
    pipeline = threading.BoundedSemaphore(1)

    class AnalysisHandler(BaseHTTPRequestHandler):
        server_version = "FaceCheckEngine"
        sys_version = ""

        def setup(self) -> None:
            self.request.settimeout(config.read_timeout_seconds)
            super().setup()

        def do_GET(self) -> None:
            if self.path == "/health":
                self._send(200, {"status": "ok", "experimental": True, "calibrated": False})
            else:
                self._send(404, {"code": "NOT_FOUND"})

        def do_POST(self) -> None:
            route = routes.get(self.path)
            if route is None:
                self._send(404, {"code": "NOT_FOUND"})
                return
            authorization = self.headers.get_all("Authorization", [])
            supplied = authorization[0] if len(authorization) == 1 else ""
            if not hmac.compare_digest(supplied.encode("utf-8"), ("Bearer " + config.token).encode("utf-8")):
                self._send(401, {"code": "UNAUTHORIZED"})
                return
            if not pipeline.acquire(blocking=False):
                self._send(429, {"code": "ENGINE_BUSY"})
                return
            try:
                self._analyse(route)
            finally:
                pipeline.release()

        def _analyse(self, route: Route) -> None:
            lengths = self.headers.get_all("Content-Length", [])
            if self.headers.get("Transfer-Encoding") is not None:
                self._send(400, {"code": "INVALID_REQUEST"})
                return
            if len(lengths) != 1 or len(lengths[0]) > 9 or not lengths[0].isascii() or not lengths[0].isdigit():
                self._send(400, {"code": "INVALID_REQUEST"})
                return
            length = int(lengths[0])
            if length <= 0 or length > MAX_BODY_BYTES:
                self._send(413, {"code": "PAYLOAD_TOO_LARGE"})
                return
            if self.headers.get_content_type() != "application/json":
                self._send(415, {"code": "JSON_REQUIRED"})
                return
            try:
                # read1 returns after each received chunk: the total deadline also
                # stops clients that send bytes just before a socket timeout.
                deadline = time.monotonic() + config.read_timeout_seconds
                body = bytearray()
                while len(body) < length:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise TimeoutError
                    self.connection.settimeout(remaining)
                    chunk = self.rfile.read1(min(64 * 1024, length - len(body)))
                    if not chunk:
                        raise InvalidRequest("INCOMPLETE_BODY")
                    body.extend(chunk)
                try:
                    payload = json.loads(body, parse_constant=reject_json_constant, object_pairs_hook=unique_object)
                except (json.JSONDecodeError, UnicodeDecodeError, RecursionError, ValueError) as error:
                    raise InvalidRequest("INVALID_JSON") from error
                validate_payload(self.path, payload)
                result = route(payload)
                self._send(200, {**result, "experimental": True, "calibrated": False})
            except PayloadTooLarge:
                self._send(413, {"code": "PAYLOAD_TOO_LARGE"})
            except InvalidRequest:
                self._send(400, {"code": "INVALID_REQUEST"})
            except (TimeoutError, socket.timeout):
                self._send(408, {"code": "REQUEST_TIMEOUT"})
            except AnalysisLimitExceeded:
                self._send(503, {"code": "ANALYSIS_LIMIT_EXCEEDED"})
            except Exception as error:
                # Exception messages may contain OCR text or backend details.
                sys.stderr.write(f"analysis_failed: {type(error).__name__}\n")
                self._send(500, {"code": "ANALYSIS_FAILED"})

        def log_message(self, format: str, *args: Any) -> None:
            # Do not log paths, request lines, headers, bodies, or exception text.
            pass

        def log_error(self, format: str, *args: Any) -> None:
            pass

        def send_error(self, code: int, message: str | None = None, explain: str | None = None) -> None:
            self._send(code, {"code": "INVALID_HTTP_REQUEST"})

        def _send(self, status: int, body: dict[str, Any]) -> None:
            data = json.dumps(body, allow_nan=False, separators=(",", ":")).encode("utf-8")
            self.close_connection = True
            try:
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "no-store")
                self.send_header("Connection", "close")
                if status == 401:
                    self.send_header("WWW-Authenticate", "Bearer")
                if status == 429:
                    self.send_header("Retry-After", "1")
                self.end_headers()
                self.wfile.write(data)
            except (OSError, TimeoutError):
                self.close_connection = True

    return AnalysisHandler


def reject_json_constant(value: str) -> None:
    raise InvalidRequest("INVALID_JSON_CONSTANT")


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result = {}
    for key, value in pairs:
        if key in result:
            raise InvalidRequest("DUPLICATE_JSON_FIELD")
        result[key] = value
    return result


class AnalysisHTTPServer(ThreadingHTTPServer):
    """Bound socket threads as well as the single shared native pipeline."""

    daemon_threads = True
    request_queue_size = 8

    def __init__(self, address: tuple[str, int], routes: dict[str, Route], config: ServiceConfig):
        self._connections = threading.BoundedSemaphore(config.max_connections)
        super().__init__(address, build_handler(routes, config))

    def process_request(self, request: socket.socket, client_address: Any) -> None:
        if not self._connections.acquire(blocking=False):
            body = b'{"code":"ENGINE_BUSY"}'
            try:
                request.settimeout(0.25)
                request.sendall(b"HTTP/1.0 429 Too Many Requests\r\nContent-Type: application/json\r\nConnection: close\r\nRetry-After: 1\r\nContent-Length: " + str(len(body)).encode() + b"\r\n\r\n" + body)
            except OSError:
                pass
            finally:
                self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except BaseException:
            self._connections.release()
            raise

    def process_request_thread(self, request: socket.socket, client_address: Any) -> None:
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._connections.release()

    def handle_error(self, request: socket.socket, client_address: Any) -> None:
        sys.stderr.write("http_connection_failed\n")
