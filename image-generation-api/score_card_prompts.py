from datetime import date


def format_current_date(value: date | None = None) -> str:
    target = value or date.today()
    return target.strftime("%d %b %Y")


def score_category(protection_score: int) -> tuple[str, str]:
    if protection_score <= 39:
        return "Poor", "#FF4D4F"
    if protection_score <= 69:
        return "Fair", "#F5A623"
    return "Good", "#22C55E"


def gauge_needle_instructions(protection_score: int) -> str:
    """
    Generate strict instructions for needle placement.
    """

    score_label, _ = score_category(protection_score)
    clamped = max(0, min(100, protection_score))

    if clamped <= 39:
        zone = "RED Poor zone"
        zone_start, zone_end = 0, 39
    elif clamped <= 69:
        zone = "ORANGE Fair zone"
        zone_start, zone_end = 40, 69
    else:
        zone = "GREEN Good zone"
        zone_start, zone_end = 70, 100

    return f"""
NEEDLE POSITION (VERY IMPORTANT):
- Scale is ONLY 0 to 100.
- Score = {clamped}
- Needle tip must point exactly to score {clamped}.
- Needle belongs inside the {zone}.
- Score range for this zone is {zone_start}-{zone_end}.
- Needle pivot hub must be at the bottom center.
- Needle and score number must be perfectly centered horizontally.
- NEVER use a credit-score scale like 300-900.
- NEVER place the needle near 100 unless score is above 70.
"""


def build_protection_score_image_prompt(
    partner_name: str,
    protection_score: int,
    current_date: str,
    insight_text: str,
) -> str:

    score_label, badge_color = score_category(protection_score)

    needle_instructions = gauge_needle_instructions(protection_score)

    return f"""
Create a premium mobile dashboard card in square format (1:1).

REFERENCE STYLE:
The design should closely resemble a premium PolicyBazaar / PBPartners dashboard card.

OVERALL DESIGN:
- Soft light grey background.
- Single white rounded card centered.
- Large border radius.
- Soft shadow.
- Modern fintech design.
- Clean sans-serif typography.
- Premium mobile app quality.

TOP HEADER:

Small uppercase text:

PROTECTION SCORE

Grey color.
Wide letter spacing.

Below it:

{partner_name}'s profile

Large bold dark navy text.

-----------------------------------

MAIN GAUGE SECTION

Large semi-circular gauge centered horizontally.

Scale:
0 on left.
100 on right.

Arc thickness medium.

Arc colors:

RED section:
0-39

ORANGE section:
40-69

GREEN section:
70-100

No labels inside the arc.

{needle_instructions}

Needle style:
- Elegant blue pin.
- Small circular pivot.
- Thin pointer.

-----------------------------------

CENTER SCORE

Largest element on card.

Big bold navy-blue number:

{protection_score}

Placed exactly in center.

-----------------------------------

STATUS BADGE

Directly above the score.

Rounded pill.

Text:

{score_label}

Badge color:

{badge_color}

Soft pastel background.

-----------------------------------

DATE TEXT

Centered below score.

Exact text:

"is {partner_name}'s protection score as of {current_date}"

Small grey font.

-----------------------------------

INSIGHT BOX

Large rounded rectangle.

Very light blue background.

Left side:
Small circular icon containing an exclamation mark.

Right side:

Bold dark blue text:

"{insight_text}"

Text should wrap naturally.

-----------------------------------

FOOTER

Small grey text:

"Built from what PBPartners already holds for {partner_name}"

Placed at bottom.

-----------------------------------

IMPORTANT RULES

- Entire card vertically centered.
- Lots of whitespace.
- Rounded corners everywhere.
- Premium dashboard appearance.
- High-quality UI.
- No photos.
- No humans.
- No logos.
- No watermarks.
- No external branding.
- Score number should be the largest element.
- Badge should be above the score.
- Needle should accurately represent score {protection_score}.
- Card should strongly resemble the reference image.
- Professional insurance app design.
"""


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
        "hashtags": [
            "#ProtectionScore",
            "#PBPartners",
            "#Insurance"
        ],
        "image_heading": "PROTECTION SCORE",
        "image_quote": insight_text,
        "image_prompt": image_prompt,
    }