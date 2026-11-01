import base64
import struct
import unittest

from request_limits import (
    InvalidRequest, PayloadTooLarge, MAX_PHOTO_BYTES, decode_base64_field,
    image_dimensions, validate_image_bytes, validate_payload,
)


def png_header(width=640, height=480):
    # Header fixture only; no native decoder or person image is needed here.
    return b'\x89PNG\r\n\x1a\n' + struct.pack('>I', 13) + b'IHDR' + struct.pack('>II', width, height) + bytes(9)


IMAGE = base64.b64encode(png_header()).decode()


class RequestLimitsTest(unittest.TestCase):
    def test_strict_base64_rejects_whitespace_invalid_chars_and_non_ascii(self):
        for value in ('YQ==\n', '????', 'é', '', 3, None):
            with self.subTest(value=value), self.assertRaises(InvalidRequest):
                decode_base64_field({'image': value}, 'image')

    def test_photo_size_is_bounded_before_and_after_base64_decode(self):
        self.assertEqual(len(decode_base64_field({'image': base64.b64encode(bytes(MAX_PHOTO_BYTES)).decode()}, 'image')), MAX_PHOTO_BYTES)
        with self.assertRaises(PayloadTooLarge):
            decode_base64_field({'image': 'A' * (4 * 1024 * 1024 + 4)}, 'image')

    def test_pixel_bomb_is_rejected_from_header(self):
        validate_image_bytes(png_header(4000, 4000))
        with self.assertRaises(PayloadTooLarge):
            validate_image_bytes(png_header(4001, 4000))
        for data in (b'', b'not an image', png_header(0, 480)):
            with self.assertRaises(InvalidRequest):
                validate_image_bytes(data)

    def test_jpeg_and_webp_dimensions_are_read_without_decoder(self):
        jpeg = b'\xff\xd8\xff\xc0' + struct.pack('>H', 8) + b'\x08' + struct.pack('>HH', 480, 640) + b'\x01'
        self.assertEqual(image_dimensions(jpeg), (640, 480))
        webp = b'RIFF' + bytes(4) + b'WEBPVP8X' + bytes(8) + (639).to_bytes(3, 'little') + (479).to_bytes(3, 'little')
        self.assertEqual(image_dimensions(webp), (640, 480))

    def test_all_endpoint_shapes_accept_the_existing_fields(self):
        for path, payload in (
            ('/match', {'document': IMAGE, 'selfie': IMAGE}),
            ('/inspect', {'kind': 'front', 'image': IMAGE, 'expected': {'name': 'Synthetic Test', 'cpf': '00000000000'}}),
            ('/document-regions', {'image': IMAGE}),
            ('/proximity', {'selfie': IMAGE, 'image': IMAGE}),
            ('/liveness', {'selfie': IMAGE, 'frames': [{'challenge': 'closer', 'image': IMAGE}]}),
        ):
            with self.subTest(path=path):
                validate_payload(path, payload)

    def test_liveness_frames_are_limited_and_challenges_validated(self):
        for frames in ([], [None], [{'challenge': [], 'image': IMAGE}], [{'challenge': 'blink', 'image': IMAGE}], [{'challenge': 'closer', 'image': IMAGE}] * 2, [{}] * 4):
            with self.subTest(frames=frames), self.assertRaises(InvalidRequest):
                validate_payload('/liveness', {'selfie': IMAGE, 'frames': frames})
        validate_payload('/liveness', {'selfie': IMAGE, 'frames': [{'challenge': challenge, 'image': IMAGE} for challenge in ('closer', 'turnLeft', 'turnRight')]})

    def test_unknown_fields_and_invalid_expected_person_are_rejected(self):
        for payload in ([], {'kind': [], 'image': IMAGE}, {'kind': 'selfie', 'image': IMAGE, 'expected': []}, {'kind': 'selfie', 'image': IMAGE, 'expected': {'name': 'a' * 201}}, {'kind': 'selfie', 'image': IMAGE, 'extra': True}):
            with self.subTest(payload=payload), self.assertRaises(InvalidRequest):
                validate_payload('/inspect', payload)


if __name__ == '__main__':
    unittest.main()
