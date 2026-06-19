import logging

from google import genai
from google.genai import types
from pydantic import BaseModel

from openai_image import generate_poster_image as generate_openai_poster_image
from birthday_prompts import (
    BIRTHDAY_SYSTEM_PROMPT,
    build_birthday_image_prompt,
    build_birthday_user_prompt,
)
from partners import Partner
from prompts import SYSTEM_PROMPT, build_user_prompt
from score_card_prompts import (
    build_protection_score_image_prompt,
    build_score_card_content,
    format_current_date,
)

logger = logging.getLogger(__name__)

CONTENT_MODEL = "gemini-2.5-flash"


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


def generate_content(
    client: genai.Client,
    partner: Partner,
    *,
    system_instruction: str = SYSTEM_PROMPT,
    user_prompt: str | None = None,
) -> ShareableContent:
    prompt = user_prompt or build_user_prompt(partner)
    response = client.models.generate_content(
        model=CONTENT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=ShareableContent,
        ),
    )
    return ShareableContent.model_validate_json(response.text)


def generate_openai_poster(
    image_prompt: str,
) -> tuple[PosterImage | None, str | None]:
    image_data, error = generate_openai_poster_image(image_prompt)
    if image_data:
        return PosterImage.model_validate(image_data), None
    return None, error


def generate_birthday_card(
    client: genai.Client,
    partner: Partner,
) -> ShareableContentResult:
    content = generate_content(
        client,
        partner,
        system_instruction=BIRTHDAY_SYSTEM_PROMPT,
        user_prompt=build_birthday_user_prompt(partner),
    )
    poster_image, poster_error = generate_openai_poster(
        build_birthday_image_prompt(
            content.image_prompt,
            partner.partner_name,
            content.image_heading,
            content.image_quote,
        )
    )

    return ShareableContentResult(
        key=2,
        partner_code=partner.partner_code,
        is_birthday_today=True,
        content=content,
        poster_image=poster_image,
        poster_error=poster_error,
    )


def generate_wishing_content(
    client: genai.Client,
    partner: Partner,
    *,
    response_key: int = 1,
    include_poster: bool = False,
) -> ShareableContentResult:
    content = generate_content(client, partner)
    poster_image = None
    poster_error = None
    if include_poster:
        poster_image, poster_error = generate_openai_poster(content.image_prompt)

    return ShareableContentResult(
        key=response_key,
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
    poster_image, poster_error = generate_openai_poster(image_prompt)

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

    if key == 2:
        return generate_birthday_card(client, partner)

    if key not in (1,):
        raise ValueError("key must be 1, 2 (birthday card), or 3 (protection score card)")

    return generate_wishing_content(
        client,
        partner,
        response_key=key,
        include_poster=include_poster,
    )
