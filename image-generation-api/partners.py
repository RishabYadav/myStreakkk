from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal

PartnerGroup = Literal["Health", "SME", "Motor", "Life", "Travel"]


@dataclass
class Partner:
    partner_name: str
    partner_code: str
    partner_group: str
    partner_dob: str
    city: str
    experience_years: int
    top_product: str
    monthly_booking: int
    monthly_renewals: int
    partner_phone_number: str | None = None
    email: str | None = None

    @property
    def is_birthday_today(self) -> bool:
        return is_birthday_today(self.partner_dob)


def is_birthday_today(partner_dob: str) -> bool:
    try:
        dob = datetime.strptime(partner_dob, "%Y-%m-%d").date()
    except ValueError:
        return False
    today = date.today()
    return dob.month == today.month and dob.day == today.day


# Dummy defaults used only when optional fields are omitted from the payload
PARTNER_DEFAULTS: dict[str, Partner] = {
    "12314": Partner(
        partner_name="Abhishek",
        partner_code="12314",
        partner_group="Health",
        partner_dob="1990-05-15",
        city="Delhi",
        experience_years=5,
        top_product="Health Insurance",
        monthly_booking=100,
        monthly_renewals=20,
    ),
}

GROUP_TOP_PRODUCT = {
    "Health": "Health Insurance",
    "SME": "SME Insurance",
    "Motor": "Motor Insurance",
    "Life": "Life Insurance",
    "Travel": "Travel Insurance",
}


def resolve_top_product(partner_group: str, top_product: str | None) -> str:
    if top_product:
        return top_product
    return GROUP_TOP_PRODUCT.get(partner_group, f"{partner_group} Insurance")
