import http.client
import io
import json
import socket
import threading
import unittest
from unittest.mock import patch

from http_service import AnalysisHTTPServer, ServiceConfig
from request_limits import AnalysisLimitExceeded, MAX_BODY_BYTES
from test_request_limits import IMAGE

TOKEN = 'synthetic-test-token'


class HttpServiceTest(unittest.TestCase):
    def setUp(self):
        self.started = threading.Event()
        self.release = threading.Event()
        self.mode = 'ok'
        self.calls = []

        def route(payload):
            self.calls.append(payload)
            if self.mode == 'busy':
                self.started.set()
                self.release.wait(2)
            if self.mode == 'failure':
                raise RuntimeError('private OCR, token, or image details')
            if self.mode == 'ocr_limit':
                raise AnalysisLimitExceeded
            return {'ready': True, 'closerRatio': 1.1}

        routes = {path: route for path in ('/match', '/inspect', '/document-regions', '/liveness', '/proximity')}
        self.server = AnalysisHTTPServer(('127.0.0.1', 0), routes, ServiceConfig(TOKEN, read_timeout_seconds=0.2, max_connections=4))
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={'poll_interval': 0.02}, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.release.set()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(2)

    def request(self, path='/proximity', payload=None, method='POST', headers=None, raw=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.port, timeout=2)
        request_headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {TOKEN}'}
        request_headers.update(headers or {})
        data = raw if raw is not None else json.dumps(payload if payload is not None else {'image': IMAGE, 'selfie': IMAGE})
        connection.request(method, path, body=data, headers=request_headers)
        response = connection.getresponse()
        result = (response.status, json.loads(response.read()), dict(response.getheaders()))
        connection.close()
        return result

    def test_health_is_public_minimal_and_unknown_paths_are_private_data_free(self):
        status, body, _ = self.request('/health', method='GET', headers={'Authorization': ''})
        self.assertEqual(status, 200)
        self.assertEqual(body, {'status': 'ok', 'experimental': True, 'calibrated': False})
        self.assertEqual(self.request('/private?token=do-not-log', method='GET')[:2], (404, {'code': 'NOT_FOUND'}))

    def test_every_analysis_requires_exact_bearer_auth(self):
        for path in ('/match', '/inspect', '/document-regions', '/liveness', '/proximity'):
            for auth in ('', 'Bearer invalid', 'Basic ' + TOKEN, 'Bearer é'):
                with self.subTest(path=path, auth=auth):
                    self.assertEqual(self.request(path, headers={'Authorization': auth})[:2], (401, {'code': 'UNAUTHORIZED'}))
        self.assertEqual(self.calls, [])

    def test_endpoint_payloads_reach_route_and_experimental_flags_are_added(self):
        payloads = {
            '/match': {'document': IMAGE, 'selfie': IMAGE},
            '/inspect': {'image': IMAGE, 'kind': 'back', 'expected': {}},
            '/document-regions': {'image': IMAGE},
            '/liveness': {'selfie': IMAGE, 'frames': [{'challenge': 'closer', 'image': IMAGE}]},
            '/proximity': {'selfie': IMAGE, 'image': IMAGE},
        }
        for path, payload in payloads.items():
            status, body, headers = self.request(path, payload)
            self.assertEqual(status, 200)
            self.assertEqual(body, {'ready': True, 'closerRatio': 1.1, 'experimental': True, 'calibrated': False})
            self.assertEqual(headers['Cache-Control'], 'no-store')
            self.assertEqual(self.calls[-1], payload)

    def test_json_and_content_length_errors_are_controlled(self):
        for raw in ('[]', '{', '{"image":"secret","image":"duplicate"}', '{"image":NaN}', '{"unknown":"private"}', '{"image":"é"}'):
            with self.subTest(raw=raw):
                self.assertEqual(self.request(raw=raw)[:2], (400, {'code': 'INVALID_REQUEST'}))
        for length in ('-1', 'wrong', '9' * 5000):
            self.assertEqual(self.request(headers={'Content-Length': length}, raw='{}')[0], 400)
        self.assertEqual(self.request(headers={'Content-Length': str(MAX_BODY_BYTES + 1)}, raw='{}')[0], 413)
        self.assertEqual(self.request(headers={'Transfer-Encoding': 'chunked'}, raw='{}')[0], 400)
        self.assertEqual(self.request(headers={'Content-Type': 'text/plain'}, raw='{}')[0], 415)

    def test_busy_pipeline_returns_429_without_queuing_and_health_still_works(self):
        self.mode = 'busy'
        results = []
        thread = threading.Thread(target=lambda: results.append(self.request()))
        thread.start()
        self.assertTrue(self.started.wait(1))
        self.assertEqual(self.request()[:2], (429, {'code': 'ENGINE_BUSY'}))
        self.assertEqual(self.request('/health', method='GET')[0], 200)
        self.assertEqual(len(self.calls), 1)
        self.release.set()
        thread.join(2)
        self.assertEqual(results[0][0], 200)

    def test_body_read_deadline_releases_pipeline(self):
        with socket.create_connection(('127.0.0.1', self.port), timeout=2) as connection:
            connection.sendall((f'POST /proximity HTTP/1.0\r\nAuthorization: Bearer {TOKEN}\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{{').encode())
            response = connection.recv(4096)
            self.assertIn(b' 408 ', response)
        self.assertEqual(self.request()[0], 200)

    def test_ocr_limit_and_internal_failures_release_pipeline_without_pii(self):
        self.mode = 'failure'
        with patch('sys.stderr', new_callable=io.StringIO) as logs:
            self.assertEqual(self.request()[:2], (500, {'code': 'ANALYSIS_FAILED'}))
        self.assertEqual(logs.getvalue(), 'analysis_failed: RuntimeError\n')
        self.mode = 'ocr_limit'
        self.assertEqual(self.request()[:2], (503, {'code': 'ANALYSIS_LIMIT_EXCEEDED'}))
        self.mode = 'ok'
        self.assertEqual(self.request()[0], 200)

    def test_blank_configured_tokens_are_refused(self):
        for token in ('', ' ', 'contains whitespace'):
            with self.assertRaises(ValueError):
                ServiceConfig(token)


if __name__ == '__main__':
    unittest.main()
