from partners import Partner

BIRTHDAY_SYSTEM_PROMPT = """You are an expert copywriter and visual designer for PolicyBazaar partner birthday greeting cards.

Your task is ALWAYS to generate a Happy Birthday card for the partner — this is a birthday greeting flow, not a product marketing poster.

Rules:
1. Use warm, professional, celebratory language suitable for WhatsApp, Instagram, and Facebook.
2. Avoid misleading or false claims.
3. Never include phone numbers or email in image_heading, image_quote, or image_prompt.
4. image_heading must be a warm birthday greeting including the partner's first name (e.g. "Happy Birthday Abhishek!").
5. image_quote must be a short birthday wish (under 12 words).
6. image_prompt must be a complete, self-contained visual description for OpenAI GPT image generation.
7. Return valid JSON only. No markdown. No explanations.

Image prompt rules (OpenAI GPT image):
- Festive happy birthday card with balloons, cake accents, or celebratory colors
- PolicyBazaar logo on the right-hand side
- Partner name as visible typography on the right (never a photo)
- image_heading as large main heading on the poster
- image_quote as small text at the bottom
- No partner photo, no customer photo, no phone numbers, no email
- Premium PolicyBazaar-branded design for Indian audiences
- Square 1:1 social media poster, modern typography

Output format:
{
  "headline": "",
  "caption": "",
  "cta": "",
  "hashtags": [],
  "image_heading": "",
  "image_quote": "",
  "image_prompt": ""
}"""

BIRTHDAY_USER_PROMPT_TEMPLATE = """Partner Information

Partner Name: {partner_name}
Partner Code: {partner_code}
Partner Group: {partner_group}
Partner Date of Birth: {partner_dob}
City: {city}

Task:
Generate a Happy Birthday greeting card for {partner_name}.

Required:
- headline: short social post headline for the birthday wish
- caption: warm birthday message for sharing (may mention partner group context lightly)
- cta: friendly call to action (e.g. share wishes, connect on WhatsApp — no phone on image)
- hashtags: 3-5 birthday-related hashtags
- image_heading: "Happy Birthday {partner_name}!" or similar festive greeting
- image_quote: short birthday wish, e.g. "Wishing you a year of success and happiness!"
- image_prompt: full visual description for a festive PolicyBazaar birthday poster with logo, partner name "{partner_name}", heading, and quote

Return JSON only.

{{
  "headline": "",
  "caption": "",
  "cta": "",
  "hashtags": [],
  "image_heading": "",
  "image_quote": "",
  "image_prompt": ""
}}"""

BIRTHDAY_IMAGE_GUARDRAILS = """
Mandatory birthday poster layout:
- Festive happy birthday card — balloons, cake accents, celebratory colors
- PolicyBazaar logo on the right-hand side
- Partner name "{partner_name}" on the right as typography only (no photo)
- Main heading: "{image_heading}"
- Bottom quote: "{image_quote}"
- No partner photo, no phone numbers, no email, no watermarks
- Premium PolicyBazaar-branded birthday poster for Indian audience
- Square 1:1 format
"""


def build_birthday_user_prompt(partner: Partner) -> str:
    return BIRTHDAY_USER_PROMPT_TEMPLATE.format(
        partner_name=partner.partner_name,
        partner_code=partner.partner_code,
        partner_group=partner.partner_group,
        partner_dob=partner.partner_dob,
        city=partner.city,
    )


def build_birthday_image_prompt(
    image_prompt: str,
    partner_name: str,
    image_heading: str,
    image_quote: str,
) -> str:
    guardrails = BIRTHDAY_IMAGE_GUARDRAILS.format(
        partner_name=partner_name,
        image_heading=image_heading,
        image_quote=image_quote,
    )
    return f"{image_prompt.strip()}\n{guardrails}"
