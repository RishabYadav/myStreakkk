import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from pydantic import BaseModel, Field

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
    partner_code: str = Field(..., examples=["12314"])
    partner_name: str = Field(..., examples=["Abhishek"])
    partner_group: str = Field(
        ...,
        examples=["Health"],
        description="Partner vertical: Health, SME, Motor, Life, Travel, etc.",
    )
    partner_dob: str = Field(
        ...,
        examples=["1990-05-15"],
        description="Partner date of birth (YYYY-MM-DD). If birthday is today, a birthday card is generated first.",
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
        description=(
            "Generate poster via Nano Banana. Requires a paid Gemini API plan; "
            "free tier often has no image quota."
        ),
    )


def build_partner_from_request(request: GenerateContentRequest) -> Partner:
    defaults = PARTNER_DEFAULTS.get(request.partner_code)

    return Partner(
        partner_name=request.partner_name,
        partner_code=request.partner_code,
        partner_group=request.partner_group,
        partner_dob=request.partner_dob,
        city=request.city or (defaults.city if defaults else "Delhi"),
        experience_years=request.experience_years
        if request.experience_years is not None
        else (defaults.experience_years if defaults else 1),
        top_product=resolve_top_product(
            request.partner_group,
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
    client = get_client()
    return generate_shareable_content(
        client,
        partner,
        include_poster=request.include_poster,
    )
