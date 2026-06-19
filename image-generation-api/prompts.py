from partners import Partner

SYSTEM_PROMPT = """You are an expert insurance marketing specialist and social media copywriter for PolicyBazaar partner campaigns.

Your objective is to generate highly engaging and personalized shareable content for insurance partners.

Birthday Priority Rule:

If is_birthday_today is true in the payload, your FIRST priority is to generate a Happy Birthday card for the partner.
- image_heading must be a warm birthday greeting (e.g. "Happy Birthday {partner_name}!").
- image_quote must be a short birthday wish.
- Use festive, celebratory visuals while keeping PolicyBazaar branding.
- Still follow all image safety rules (no photo, no phone on image).

Content Rules:

1. Use simple and professional language.
2. Avoid misleading or false claims.
3. Create content suitable for WhatsApp, Instagram and Facebook.
4. Keep headlines short and catchy.
5. Keep captions concise and engaging.
6. Generate meaningful hashtags.
7. Use a positive and trustworthy tone.
8. Return valid JSON only.
9. Do not include explanations.
10. Do not include markdown.
11. Never include phone numbers or email in image_heading, image_quote, or image_prompt.
12. If partner_phone_number is provided in the payload, you may include it in caption and cta only (never on the poster image).
13. If email is provided in the payload, you may include it in caption and cta only (never on the poster image).

Image Prompt Rules (for Gemini Nano Banana):

1. Never include the partner's photo, selfie, portrait, or any real customer/user image.
2. Never include phone numbers, mobile numbers, email addresses, or contact details anywhere on the image.
3. Always include the PolicyBazaar logo on the right-hand side of the poster.
4. Always display the partner name as visible text on the right-hand side of the poster (below or beside the PolicyBazaar logo, typography only — not a photo).
5. Use a dynamic background theme based on partner_group:
   - Health: PolicyBazaar corporate blue theme OR soft pink wellness theme.
   - SME: PolicyBazaar corporate blue theme with professional business styling.
   - Motor: PolicyBazaar corporate blue theme with energetic automotive styling.
   - Life: PolicyBazaar corporate blue theme OR warm pink family-protection theme.
   - Travel: PolicyBazaar corporate blue theme with travel-inspired accents.
   - Birthday (is_birthday_today=true): celebratory theme with balloons, cake accents, or festive colors while keeping PolicyBazaar branding.
6. Background color and visual theme must feel premium, modern, and suitable for Indian audiences.
7. Use generic Indian family or lifestyle visuals only — never identifiable real people or partner likeness.
8. Instagram 1080x1080, premium social media style, modern typography.
9. The poster must have two main text elements for the image:
   - image_heading: main large heading displayed prominently (center or upper area).
   - image_quote: a short quote displayed at the bottom of the poster (product-related or birthday wish).
10. image_quote must be short (under 12 words), trustworthy, and related to partner_group or birthday context.
11. The image_prompt must explicitly describe: PolicyBazaar logo right side, partner name right side, image_heading, image_quote at bottom, no phone numbers, no partner photo.

Output Format:

{
  "headline": "",
  "caption": "",
  "cta": "",
  "hashtags": [],
  "image_heading": "",
  "image_quote": "",
  "image_prompt": ""
}"""

USER_PROMPT_TEMPLATE = """Partner Information

Partner Name: {partner_name}
Partner Code: {partner_code}
Partner Group: {partner_group}
Partner Date of Birth: {partner_dob}
Is Birthday Today: {is_birthday_today}
Partner Phone Number: {partner_phone_number}
Partner Email: {partner_email}
City: {city}
Experience: {experience_years} years
Top Product: {top_product}
Monthly Booking Count: {monthly_booking}
Monthly Renewals: {monthly_renewals}

Target Audience:
Young Families

Language:
English

Task:

Step 1:
Check is_birthday_today. If true, generate a Happy Birthday card as the first priority.

Step 2:
Understand the partner profile and partner group ({partner_group}).

Step 3:
Identify the most suitable marketing theme for this partner group.

Step 4:
Generate:

- Headline (for social post caption context)
- Caption (include partner_phone_number and email in caption if provided)
- Call To Action (include partner_phone_number in cta if provided, for WhatsApp contact)
- Relevant hashtags
- image_heading (main bold heading on poster — birthday greeting if is_birthday_today is true)
- image_quote (short quote at bottom — birthday wish if is_birthday_today is true, else product quote for {partner_group})
- Detailed image prompt for Gemini Nano Banana

Image Text Layout:

- Right-hand side: PolicyBazaar logo and partner name "{partner_name}" as text
- Main area: image_heading (large, bold main heading)
- Bottom area: image_quote (small quote text)
- Never place phone number or email on the image

Image Quote Examples by partner_group:
- Health: "Good health is the greatest wealth."
- Motor: "Drive safe, stay protected on every road."
- SME: "Secure your business, secure your future."
- Life: "Protect today, secure tomorrow for your family."
- Travel: "Explore the world with peace of mind."
- Birthday: "Wishing you a year of success and happiness!"

Image Prompt Requirements:

- Professional design for Indian audience
- Premium social media style with modern typography
- Instagram 1080x1080
- PolicyBazaar logo on right-hand side
- Partner name "{partner_name}" on right-hand side as text (not as a photo)
- image_heading as main heading on poster
- image_quote as small text at bottom of poster
- Never include partner photo or customer/user image
- Never include phone number or email on the image
- Dynamic background theme: PolicyBazaar corporate blue OR pink theme (or birthday festive if is_birthday_today)
- Partner group context: {partner_group}
- Birthday today: {is_birthday_today}

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

IMAGE_GUARDRAILS_TEMPLATE = """
Mandatory poster layout and text:
- PolicyBazaar logo on the right-hand side of the poster
- Partner name "{partner_name}" on the right-hand side as text (typography only, no photo)
- Main heading at center/upper area: "{image_heading}"
- Small quote at bottom of poster: "{image_quote}"
- Birthday card mode: {birthday_mode}
- No partner photo, no customer photo, no user portrait, no selfie
- No phone number, no email, no contact details on the image
- Product theme: {partner_group}
- Premium PolicyBazaar-branded social media poster for Indian audience
- Instagram 1080x1080
"""


def build_user_prompt(partner: Partner) -> str:
    return USER_PROMPT_TEMPLATE.format(
        partner_name=partner.partner_name,
        partner_code=partner.partner_code,
        partner_group=partner.partner_group,
        partner_dob=partner.partner_dob,
        is_birthday_today=partner.is_birthday_today,
        partner_phone_number=partner.partner_phone_number or "Not provided",
        partner_email=partner.email or "Not provided",
        city=partner.city,
        experience_years=partner.experience_years,
        top_product=partner.top_product,
        monthly_booking=partner.monthly_booking,
        monthly_renewals=partner.monthly_renewals,
    )


def build_image_prompt(
    image_prompt: str,
    partner_name: str,
    image_heading: str,
    image_quote: str,
    partner_group: str,
    is_birthday_today: bool = False,
) -> str:
    guardrails = IMAGE_GUARDRAILS_TEMPLATE.format(
        partner_name=partner_name,
        image_heading=image_heading,
        image_quote=image_quote,
        partner_group=partner_group,
        birthday_mode="yes — festive happy birthday card" if is_birthday_today else "no",
    )
    return f"{image_prompt.strip()}\n{guardrails}"
