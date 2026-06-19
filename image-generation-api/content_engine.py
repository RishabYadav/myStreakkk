import base64
import logging

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel

from openai_image import generate_poster_image as generate_openai_poster_image
from partners import Partner
from prompts import SYSTEM_PROMPT, build_image_prompt, build_user_prompt
from score_card_prompts import (
    build_protection_score_image_prompt,
    build_score_card_content,
    format_current_date,
)

logger = logging.getLogger(__name__)

CONTENT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-2.5-flash-image"


class ShareableContent(BaseModel):
    headline: str
    caption: str
    cta: str
    hashtags: list[str]
    image_heading: str
    image_quote: str
    image_prompt: str


class PosterImage(BaseModel):
    mime_type: str
    data_base64: str


class ShareableContentResult(BaseModel):
    key: int
    partner_code: str
    is_birthday_today: bool
    content: ShareableContent
    poster_image: PosterImage | None = None
    poster_error: str | None = None


def generate_content(client: genai.Client, partner: Partner) -> ShareableContent:
    user_prompt = build_user_prompt(partner)
    response = client.models.generate_content(
        model=CONTENT_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=ShareableContent,
        ),
    )
    return ShareableContent.model_validate_json(response.text)


def generate_gemini_poster_image(
    client: genai.Client, image_prompt: str
) -> tuple[PosterImage | None, str | None]:
    try:
        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=image_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio="1:1",
                ),
            ),
        )
    except genai_errors.ClientError as exc:
        logger.warning("Poster image generation failed: %s", exc)
        if exc.code == 429:
            return None, (
                "Image generation quota exceeded on your Gemini API plan. "
                "Use include_poster=false for text-only content, or enable billing "
                "for Nano Banana (gemini-2.5-flash-image)."
            )
        return None, f"Image generation failed: {exc}"

    if not response.candidates:
        return None, "Image generation returned no candidates."

    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            return (
                PosterImage(
                    mime_type=part.inline_data.mime_type or "image/png",
                    data_base64=base64.b64encode(part.inline_data.data).decode(
                        "utf-8"
                    ),
                ),
                None,
            )

    return None, "Image generation returned no image data."


def generate_wishing_content(
    client: genai.Client, partner: Partner, include_poster: bool = False
) -> ShareableContentResult:
    content = generate_content(client, partner)
    poster_image = None
    poster_error = None
    if include_poster:
        poster_image, poster_error = generate_gemini_poster_image(
            client,
            build_image_prompt(
                content.image_prompt,
                partner.partner_name,
                content.image_heading,
                content.image_quote,
                partner.partner_group,
                partner.is_birthday_today,
            ),
        )

    return ShareableContentResult(
        key=1,
        partner_code=partner.partner_code,
        is_birthday_today=partner.is_birthday_today,
        content=content,
        poster_image=poster_image,
        poster_error=poster_error,
    )


def generate_protection_score_card(
    partner_code: str,
    partner_name: str,
    protection_score: int,
    insight_text: str,
    current_date: str | None = None,
) -> ShareableContentResult:
    resolved_date = current_date or format_current_date()
    image_prompt = build_protection_score_image_prompt(
        partner_name=partner_name,
        protection_score=protection_score,
        current_date=resolved_date,
        insight_text=insight_text,
    )
    content_fields = build_score_card_content(
        partner_name=partner_name,
        protection_score=protection_score,
        insight_text=insight_text,
        image_prompt=image_prompt,
    )
    content = ShareableContent.model_validate(content_fields)

    poster_image = None
    poster_error = None
    image_data, error = generate_openai_poster_image(image_prompt)
    if image_data:
        poster_image = PosterImage.model_validate(image_data)
    else:
        poster_error = error

    return ShareableContentResult(
        key=3,
        partner_code=partner_code,
        is_birthday_today=False,
        content=content,
        poster_image=poster_image,
        poster_error=poster_error,
    )


def generate_shareable_content(
    client: genai.Client,
    partner: Partner,
    *,
    key: int = 1,
    include_poster: bool = False,
    protection_score: int | None = None,
    insight_text: str | None = None,
    current_date: str | None = None,
) -> ShareableContentResult:
    if key == 3:
        if protection_score is None:
            raise ValueError("protectionScore is required when key=3")
        if not insight_text:
            raise ValueError("insight_text is required when key=3")
        return generate_protection_score_card(
            partner_code=partner.partner_code,
            partner_name=partner.partner_name,
            protection_score=protection_score,
            insight_text=insight_text,
            current_date=current_date,
        )

    return generate_wishing_content(client, partner, include_poster=include_poster)
