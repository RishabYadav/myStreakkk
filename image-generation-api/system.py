import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from pydantic import BaseModel, ConfigDict, Field, model_validator

from content_engine import ShareableContentResult, generate_shareable_content
from partners import PARTNER_DEFAULTS, Partner, resolve_top_product

load_dotenv()

app = FastAPI(title="Shareable Content Engine", version="1.0.0")


def get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not set",
        )
    return genai.Client(api_key=api_key)


class GenerateContentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    key: int = Field(
        default=1,
        examples=[1],
        description="1 = happy wishing content, 3 = protection score card image",
    )
    partner_code: str = Field(..., examples=["12314"])
    partner_name: str = Field(..., examples=["Abhishek"])
    partner_group: str | None = Field(
        default=None,
        examples=["Health"],
        description="Required for key=1. Partner vertical: Health, SME, Motor, Life, Travel, etc.",
    )
    partner_dob: str | None = Field(
        default=None,
        examples=["1990-05-15"],
        description="Required for key=1. Partner date of birth (YYYY-MM-DD).",
    )
    partner_phone_number: str | None = Field(
        default=None,
        examples=["9876543210"],
        description="Optional. Included in caption/CTA only, never on poster image.",
    )
    email: str | None = Field(
        default=None,
        examples=["partner@example.com"],
        description="Optional. Included in caption/CTA only, never on poster image.",
    )
    city: str | None = Field(default=None, examples=["Delhi"])
    experience_years: int | None = Field(default=None, examples=[5])
    top_product: str | None = Field(
        default=None,
        examples=["Health Insurance"],
        description="Optional. Derived from partner_group if omitted.",
    )
    monthly_booking: int | None = Field(default=None, examples=[100])
    monthly_renewals: int | None = Field(default=None, examples=[20])
    include_poster: bool = Field(
        default=False,
        description="For key=1: generate wishing poster via Gemini. key=3 always generates score card image.",
    )
    protection_score: int | None = Field(
        default=None,
        alias="protectionScore",
        ge=0,
        le=100,
        examples=[62],
        description="Required for key=3. Protection score from 0 to 100.",
    )
    insight_text: str | None = Field(
        default=None,
        examples=["Health & term gaps hold you back"],
        description="Required for key=3. Short insight shown on the score card.",
    )
    current_date: str | None = Field(
        default=None,
        examples=["20 Jun 2026"],
        description="Optional for key=3. Defaults to today's date.",
    )
    user_prompt: str | None = Field(
        default=None,
        description="Optional extra instructions (key=1 wishing flow).",
    )

    @model_validator(mode="after")
    def validate_key_requirements(self) -> "GenerateContentRequest":
        if self.key not in (1, 3):
            raise ValueError("key must be 1 (wishing) or 3 (protection score card)")

        if self.key == 1:
            if not self.partner_group:
                raise ValueError("partner_group is required when key=1")
            if not self.partner_dob:
                raise ValueError("partner_dob is required when key=1")
            return self

        if self.protection_score is None:
            raise ValueError("protectionScore is required when key=3")
        if not self.insight_text or not self.insight_text.strip():
            raise ValueError("insight_text is required when key=3")
        return self


def build_partner_from_request(request: GenerateContentRequest) -> Partner:
    defaults = PARTNER_DEFAULTS.get(request.partner_code)
    partner_group = request.partner_group or (
        defaults.partner_group if defaults else "Health"
    )

    return Partner(
        partner_name=request.partner_name,
        partner_code=request.partner_code,
        partner_group=partner_group,
        partner_dob=request.partner_dob
        or (defaults.partner_dob if defaults else "1990-01-01"),
        city=request.city or (defaults.city if defaults else "Delhi"),
        experience_years=request.experience_years
        if request.experience_years is not None
        else (defaults.experience_years if defaults else 1),
        top_product=resolve_top_product(
            partner_group,
            request.top_product or (defaults.top_product if defaults else None),
        ),
        monthly_booking=request.monthly_booking
        if request.monthly_booking is not None
        else (defaults.monthly_booking if defaults else 0),
        monthly_renewals=request.monthly_renewals
        if request.monthly_renewals is not None
        else (defaults.monthly_renewals if defaults else 0),
        partner_phone_number=request.partner_phone_number,
        email=request.email,
    )


@app.get("/")
def root():
    return {
        "message": "Shareable Content Engine",
        "docs": "/docs",
        "health": "/health",
        "generate": "POST /generate-content",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate-content", response_model=ShareableContentResult)
def generate_content(request: GenerateContentRequest):
    partner = build_partner_from_request(request)

    if request.key == 3:
        openai_key = os.environ.get("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY environment variable is not set (required for key=3)",
            )
        return generate_shareable_content(
            get_client(),
            partner,
            key=3,
            protection_score=request.protection_score,
            insight_text=request.insight_text.strip(),
            current_date=request.current_date,
        )

    client = get_client()
    return generate_shareable_content(
        client,
        partner,
        key=1,
        include_poster=request.include_poster,
    )
