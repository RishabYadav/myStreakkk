import base64
import io
import logging
import os

from openai import APIError, OpenAI, RateLimitError
from PIL import Image

logger = logging.getLogger(__name__)

IMAGE_MODEL = "gpt-image-1-mini"
API_IMAGE_SIZE = "1024x1024"
OUTPUT_IMAGE_SIZE = (720, 720)
IMAGE_QUALITY = "medium"


def _get_openai_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)


def _resize_to_output(image_bytes: bytes) -> bytes:
    with Image.open(io.BytesIO(image_bytes)) as img:
        resized = img.resize(OUTPUT_IMAGE_SIZE, Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        resized.save(buffer, format="PNG")
        return buffer.getvalue()


def generate_poster_image(image_prompt: str) -> tuple[dict | None, str | None]:
    try:
        client = _get_openai_client()
        response = client.images.generate(
            model=IMAGE_MODEL,
            prompt=image_prompt,
            size=API_IMAGE_SIZE,
            quality=IMAGE_QUALITY,
            output_format="png",
            n=1,
        )
    except RateLimitError as exc:
        logger.warning("OpenAI image rate limit: %s", exc)
        return None, "Image generation rate limit exceeded. Please try again later."
    except APIError as exc:
        logger.warning("OpenAI image generation failed: %s", exc)
        return None, f"Image generation failed: {exc}"
    except ValueError as exc:
        logger.warning("OpenAI configuration error: %s", exc)
        return None, str(exc)

    if not response.data:
        return None, "Image generation returned no data."

    image_b64 = response.data[0].b64_json
    if not image_b64:
        return None, "Image generation returned no base64 payload."

    try:
        raw_bytes = base64.b64decode(image_b64)
        output_bytes = _resize_to_output(raw_bytes)
    except Exception as exc:
        logger.warning("Image post-processing failed: %s", exc)
        return None, f"Image post-processing failed: {exc}"

    return (
        {
            "mime_type": "image/png",
            "data_base64": base64.b64encode(output_bytes).decode("utf-8"),
        },
        None,
    )
