"""Opt-in model smoke test using only programmatically generated images."""
import base64
import http.client
import json
import os
import threading
import unittest


@unittest.skipUnless(os.environ.get('FACE_CHECK_NATIVE_TESTS') == '1', 'Set FACE_CHECK_NATIVE_TESTS=1 with installed dependencies and verified models')
class NativeModelsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import cv2
        import numpy as np
        from match_server import load_engine

        cls.engine = load_engine(cpu_threads=1)
        cls.blank = np.full((480, 640, 3), 128, dtype=np.uint8)
        cls.cv2 = cv2
        cls.np = np

    def test_models_load_and_reject_blank_document_and_liveness(self):
        with self.engine.ocr.request_budget():
            inspection = self.engine.inspector.inspect(self.blank, 'front')
            result = self.engine.liveness.verify(self.blank, [('closer', self.blank)])
        self.assertIn('documentFaceNotFound', inspection['issues'])
        self.assertFalse(result['passed'])
        self.assertIn('livenessFaceNotFound', result['issues'])

    def test_native_antispoof_probability_is_finite_on_synthetic_pixels(self):
        score = self.engine.liveness._anti_spoof.real_probability(self.blank, (160, 120, 160, 160))
        self.assertTrue(self.np.isfinite(score))
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 1)

    def test_ocr_recognizes_programmatically_printed_document_title(self):
        image = self.np.full((480, 900, 3), 225, dtype=self.np.uint8)
        self.cv2.putText(image, 'CARTEIRA NACIONAL DE HABILITACAO', (20, 150), self.cv2.FONT_HERSHEY_SIMPLEX, 0.8, (25, 25, 25), 2, self.cv2.LINE_AA)
        with self.engine.ocr.request_budget():
            boxes = self.engine.ocr.boxes(image)
            texts = [self.engine.ocr.read(image, box) for box in boxes]
        self.assertIn('carteira', ' '.join(texts))

    def test_actual_engine_http_requires_bearer_and_rejects_blank_selfie(self):
        from http_service import AnalysisHTTPServer, ServiceConfig
        from match_server import build_routes

        encoded_ok, encoded = self.cv2.imencode('.png', self.blank)
        self.assertTrue(encoded_ok)
        payload = json.dumps({
            'kind': 'selfie',
            'image': base64.b64encode(encoded.tobytes()).decode('ascii'),
            'expected': {},
        })
        token = 'synthetic-native-smoke-service-token'
        server = AnalysisHTTPServer(
            ('127.0.0.1', 0), build_routes(self.engine), ServiceConfig(token),
        )
        thread = threading.Thread(
            target=server.serve_forever, kwargs={'poll_interval': 0.02}, daemon=True,
        )
        thread.start()

        def post_inspection(authorization=None):
            connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=30)
            headers = {'Content-Type': 'application/json'}
            if authorization is not None:
                headers['Authorization'] = authorization
            try:
                connection.request('POST', '/inspect', body=payload, headers=headers)
                response = connection.getresponse()
                return response.status, json.loads(response.read())
            finally:
                connection.close()

        try:
            self.assertEqual(post_inspection(), (401, {'code': 'UNAUTHORIZED'}))
            status, result = post_inspection(f'Bearer {token}')
            self.assertEqual(status, 200)
            self.assertIn('selfieFaceNotFound', result['issues'])
            self.assertEqual(result['metrics']['faces'], [])
            self.assertIsNone(result['liveScore'])
            self.assertTrue(result['experimental'])
            self.assertFalse(result['calibrated'])
            self.assertNotIn('passed', result)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(2)


if __name__ == '__main__':
    unittest.main()
