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


def gauge_needle_instructions(protection_score: int) -> str:
    """Map 0-100 score to semi-circle needle position and zone alignment."""
    score_label, _ = score_category(protection_score)
    clamped = max(0, min(100, protection_score))

    if clamped <= 39:
        zone = "left RED Poor zone (scores 0-39)"
        zone_start, zone_end = 0, 39
    elif clamped <= 69:
        zone = "middle YELLOW/ORANGE Fair zone (scores 40-69)"
        zone_start, zone_end = 40, 69
    else:
        zone = "right GREEN Good zone (scores 70-100)"
        zone_start, zone_end = 70, 100

    # Position along arc: 0 = far left, 100 = far right
    position_pct = clamped

    return f"""NEEDLE POSITION (CRITICAL — follow exactly):
- Gauge scale is 0 to 100 ONLY. Left label "0", right label "100". NEVER use 300/900 or credit-score scales.
- Arc zones are proportional to score ranges (NOT three equal slices):
  • RED Poor: 0-39 (left 40% of arc)
  • YELLOW/ORANGE Fair: 40-69 (middle 30% of arc)
  • GREEN Good: 70-100 (right 30% of arc)
- Score is {clamped}. Needle tip MUST land at {position_pct}% from the left end of the arc.
- Needle tip MUST sit inside the {zone}, aligned with the "{score_label}" badge above the score.
- For score {clamped}: needle is in the {zone_start}-{zone_end} range — do NOT place it near 100 unless score is 70+.
- Needle pivot hub centered at the bottom middle of the semi-circle; needle and score number horizontally centered on the card."""


def build_protection_score_image_prompt(
    partner_name: str,
    protection_score: int,
    current_date: str,
    insight_text: str,
) -> str:
    score_label, badge_color = score_category(protection_score)
    needle_instructions = gauge_needle_instructions(protection_score)

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

MAIN SECTION — SEMI-CIRCULAR GAUGE (0 to 100 scale only):
- Semi-circle gauge centered on the card with pivot hub at bottom center
- Left endpoint label: "0" | Right endpoint label: "100"
- Arc colored zones proportional to score ranges:
  • Left 40% of arc: RED — Poor (0-39)
  • Middle 30% of arc: YELLOW/ORANGE — Fair (40-69)
  • Right 30% of arc: GREEN — Good (70-100)
- Small zone labels printed on/near each arc segment: "Poor", "Fair", "Good"
{needle_instructions}
- Rounded badge directly above the large center score, same zone color as needle:
  - Text: "{score_label}"
  - Badge color: {badge_color}
- Center of gauge — largest element, horizontally centered:
  - Score number: {protection_score}
  - Large, bold typography

DATE LINE (below gauge, centered):
- Exact text: "is {partner_name}'s protection score as of {current_date}"

INSIGHT BOX (below date line):
- Rounded blue information box
- Small info/lightbulb-style icon on the left (drawn, not an external asset)
- Text: "{insight_text}"

FOOTER (bottom of card):
- Exact text: "Built from what PBPartners already holds for {partner_name}"

RULES:
- Render ALL text exactly as specified above
- Needle position MUST match score {protection_score} on the 0-100 scale — never confuse score with scale max
- Do NOT use 300-900, credit-score, or any scale other than 0-100
- Badge label "{score_label}" MUST match the colored zone where the needle points
- Gauge, needle hub, and score number must be horizontally centered
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
