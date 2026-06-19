from datetime import date


def format_current_date(value: date | None = None) -> str:
    target = value or date.today()
    return target.strftime("%d %b %Y")


def score_category(protection_score: int) -> tuple[str, str]:
    if protection_score <= 39:
        return "Poor", "red"
    if protection_score <= 69:
        return "Fair", "yellow-orange"
    return "Good", "green"


def build_protection_score_image_prompt(
    partner_name: str,
    protection_score: int,
    current_date: str,
    insight_text: str,
) -> str:
    score_label, badge_color = score_category(protection_score)

    return f"""Create a premium mobile protection score card image (square 1:1) for an insurance partner dashboard.

STYLE:
- Modern fintech / health dashboard card
- White rounded card on a soft light-gray background
- Soft drop shadow, rounded corners, elegant spacing
- Blue typography accents, clean sans-serif fonts
- Premium insurance app quality — NOT plain or basic

TOP SECTION:
- Small uppercase label: "PROTECTION SCORE"
- Below it: "{partner_name}'s profile"

MAIN SECTION — SEMI-CIRCULAR GAUGE (0 to 100):
- Left arc section: RED (poor score zone, 0-39)
- Middle arc section: YELLOW/ORANGE (fair score zone, 40-69)
- Right arc section: GREEN (good score zone, 70-100)
- Modern elegant needle pointing to score {protection_score} on the gauge
- Above the large center score number, show a rounded badge:
  - Text: "{score_label}"
  - Badge color: {badge_color}
- Center of gauge — largest element on card:
  - Score number: {protection_score}
  - Large, bold typography

DATE LINE (below gauge):
- Exact text: "is {partner_name}'s protection score as of {current_date}"

INSIGHT BOX (below date line):
- Rounded blue information box
- Small info/lightbulb-style icon on the left (drawn, not an external asset)
- Text: "{insight_text}"

FOOTER (bottom of card):
- Exact text: "Built from what PBPartners already holds for {partner_name}"

RULES:
- Render ALL text exactly as specified above
- No phone numbers, no email, no watermarks
- No photos of real people
- No external logos except generic PBPartners-style branding if subtle
- Single card centered in frame
- High-quality polished UI design"""


def build_score_card_content(
    partner_name: str,
    protection_score: int,
    insight_text: str,
    image_prompt: str,
) -> dict[str, str | list[str]]:
    score_label, _ = score_category(protection_score)
    return {
        "headline": f"{partner_name}'s Protection Score: {protection_score} ({score_label})",
        "caption": insight_text,
        "cta": "Review protection gaps and strengthen your profile.",
        "hashtags": ["#ProtectionScore", "#PBPartners", "#Insurance"],
        "image_heading": "PROTECTION SCORE",
        "image_quote": insight_text,
        "image_prompt": image_prompt,
    }
