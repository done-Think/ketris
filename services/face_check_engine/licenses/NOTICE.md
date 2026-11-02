# Face check engine attribution

The Python analysis modules originate in the private DoneThink `facecheck-pilot`
repository, commit `3d9357a`, directory `bench`. Ketris changes are identified in
`faces.py`, `rapid_text.py`, and `download_models.py`; the HTTP boundary and
container packaging were replaced. No pilot captures, reports or model binaries
are distributed in this source directory.

Third-party model sources and license copies:

| Component | Source | License copy |
| --- | --- | --- |
| YuNet | [OpenCV Zoo / Shiqi Yu](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) | `LICENSE-YuNet.txt`, MIT, Copyright (c) 2020 Shiqi Yu |
| SFace | [OpenCV Zoo](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface) | `LICENSE-SFace.txt`, Apache-2.0 |
| MiniFASNet V2 + V1SE, ONNX export | [yakhyo/face-anti-spoofing](https://github.com/yakhyo/face-anti-spoofing), based on [minivision-ai/Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) | `Apache-2.0.txt`; both projects publish this license |
| RapidOCR 3.10.0 | [RapidAI/RapidOCR v3.10.0](https://github.com/RapidAI/RapidOCR/tree/v3.10.0) | `Apache-2.0.txt`; Copyright (c) 2021 RapidOCR Authors. All rights reserved. |
| PP-OCR detection/recognition/classifier weights | [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR), packaged by RapidOCR | `Apache-2.0.txt` |
| Legacy PP-OCRv3 detector, retained for the bench-compatible text adapter | [OpenCV Zoo text_detection_ppocr](https://github.com/opencv/opencv_zoo/tree/main/models/text_detection_ppocr) | `Apache-2.0.txt`; Copyright (c) 2016 PaddlePaddle Authors. All Rights Reserved |
| Legacy CRNN recognizer, retained for the bench-compatible text adapter | [OpenCV Zoo text_recognition_crnn](https://github.com/opencv/opencv_zoo/tree/main/models/text_recognition_crnn) | `Apache-2.0.txt` |

The installed wheels retain their own package notices and licenses in the image.
The SHA-256 manifests are in `download_models.py` and `rapid_text.py`. Licenses
describe the upstream grants; they are not performance certification or evidence
of liveness robustness. All scoring remains experimental and uncalibrated.
