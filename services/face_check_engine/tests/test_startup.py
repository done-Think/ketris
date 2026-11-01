import io
import unittest
from unittest.mock import patch

import match_server


class StartupTest(unittest.TestCase):
    def test_missing_token_fails_before_model_load_or_listening(self):
        with patch.dict('os.environ', {'FACE_CHECK_ENGINE_TOKEN': ''}), patch('sys.argv', ['match_server.py']), patch.object(match_server, 'load_engine') as load, patch.object(match_server, 'AnalysisHTTPServer') as server, patch('sys.stderr', new_callable=io.StringIO) as logs:
            self.assertEqual(match_server.main(), 1)
        load.assert_not_called()
        server.assert_not_called()
        self.assertEqual(logs.getvalue(), 'engine_startup_failed: ValueError\n')

    def test_model_load_failure_never_exposes_healthy_socket(self):
        with patch.dict('os.environ', {'FACE_CHECK_ENGINE_TOKEN': 'synthetic-token'}), patch('sys.argv', ['match_server.py']), patch.object(match_server, 'load_engine', side_effect=RuntimeError('private path')) as load, patch.object(match_server, 'AnalysisHTTPServer') as server, patch('sys.stderr', new_callable=io.StringIO) as logs:
            self.assertEqual(match_server.main(), 1)
        load.assert_called_once_with(1600, 0.6, 2)
        server.assert_not_called()
        self.assertEqual(logs.getvalue(), 'engine_startup_failed: RuntimeError\n')


if __name__ == '__main__':
    unittest.main()
