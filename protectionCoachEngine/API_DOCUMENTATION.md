# Protection Intelligence Platform — API Documentation

**Base URL:** `http://localhost:3000`  
**Content-Type:** `application/json`

---

## Health Check

### `GET /health`

**Response:**
```json
{ "status": "ok", "timestamp": "2026-06-18T22:01:30.766Z" }
```

---

## 1. CUSTOMERS

### `POST /api/v1/customers` — Create Customer

**Body:**
```json
{
  "first_name": "Anjali",
  "last_name": "Mehta",
  "email": "anjali@example.com",
  "phone": "9876543210",
  "date_of_birth": "1990-03-15",
  "gender": "FEMALE",
  "marital_status": "MARRIED",
  "life_stage": "GROWING_FAMILY",
  "dependents": 2,
  "annual_income": 1200000,
  "occupation": "Software Engineer",
  "smoker": false,
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "existing_liabilities": 5000000,
  "total_assets": 8000000,
  "health_cover": false,
  "term_cover": false,
  "life_cover": true,
  "motor_cover": true,
  "external_policies": 1,
  "children": 2,
  "elderly_parent_dependent": true,
  "single_earner": true,
  "home_loan": true,
  "renewal_due_days": 9,
  "last_interaction_days": 15,
  "known_pb_policies": 2,
  "profile_complete": true,
  "partner_id": "P001"
}
```

**Response:** `201`
```json
{ "success": true, "data": { "id": "uuid", ...customer_fields } }
```

---

### `GET /api/v1/customers` — List All Customers

**Query params:** `?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [ { ...customer }, { ...customer } ],
  "meta": { "page": 1, "limit": 20, "total": 10 }
}
```

---

### `GET /api/v1/customers/:id` — Get Customer (with policies)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "eec4b472-...",
    "first_name": "Anjali",
    "last_name": "Mehta",
    ...all_fields,
    "policies": [ ...policies ]
  }
}
```

---

### `PUT /api/v1/customers/:id` — Update Customer

**Body:** Any subset of customer fields  
**Response:** `{ "success": true, "data": { ...updated_customer } }`

---

### `DELETE /api/v1/customers/:id` — Delete Customer

**Response:** `{ "success": true, "data": { "message": "Customer deleted" } }`

---

## 2. POLICIES

### `POST /api/v1/policies` — Create Policy

**Body:**
```json
{
  "customer_id": "eec4b472-5fb8-4e99-9605-856aff13c65b",
  "policy_number": "PB-HEALTH-001",
  "source": "POLICYBAZAAR",
  "vendor_name": "Star Health",
  "type": "HEALTH",
  "status": "ACTIVE",
  "sum_assured": 1000000,
  "premium_amount": 15000,
  "payment_frequency": "ANNUAL",
  "start_date": "2024-01-01",
  "end_date": "2025-01-01",
  "renewal_date": "2025-01-01",
  "nominees": [{"name": "Spouse", "relation": "wife"}],
  "riders": [{"name": "Maternity", "sum": 100000}],
  "metadata": {"agent_code": "AG001"}
}
```

**Enums:**
- `source`: `POLICYBAZAAR` | `EXTERNAL`
- `type`: `TERM_LIFE` | `WHOLE_LIFE` | `HEALTH` | `CRITICAL_ILLNESS` | `ACCIDENT` | `DISABILITY` | `HOME` | `MOTOR` | `TRAVEL` | `OTHER`
- `status`: `ACTIVE` | `LAPSED` | `EXPIRED` | `CANCELLED` | `PENDING`
- `payment_frequency`: `MONTHLY` | `QUARTERLY` | `HALF_YEARLY` | `ANNUAL` | `ONE_TIME`

**Response:** `201`
```json
{ "success": true, "data": { "id": "uuid", ...policy_fields } }
```

---

### `GET /api/v1/policies/customer/:customerId` — Get Policies by Customer

**Response:**
```json
{ "success": true, "data": [ { ...policy }, { ...policy } ] }
```

---

### `GET /api/v1/policies/:id` — Get Single Policy

### `PUT /api/v1/policies/:id` — Update Policy

### `DELETE /api/v1/policies/:id` — Delete Policy

---

## 3. SCORING

### `GET /api/v1/customer/:customerId/protection` — Get Protection Score (PIS)

**Response:**
```json
{
  "success": true,
  "data": {
    "protection_intelligence_score": 64,
    "score_breakdown": {
      "coverage_adequacy": { "score": 12, "max": 30 },
      "life_stage_readiness": { "score": 10, "max": 15 },
      "financial_vulnerability": { "score": 7, "max": 15 },
      "family_risk_protection": { "score": 5, "max": 10 },
      "protection_freshness": { "score": 10, "max": 10 },
      "engagement_strength": { "score": 10, "max": 10 },
      "data_confidence": { "score": 10, "max": 10 }
    },
    "coverage": {
      "motor": { "covered": true, "source": "pb_held" },
      "life": { "covered": true, "source": "pb_held" },
      "health": { "covered": false, "source": null },
      "term": { "covered": false, "source": null }
    },
    "weak_spots": ["health", "term"],
    "top_gap": "health"
  }
}
```

---

### `GET /api/v1/customer/:customerId/opportunity` — Get Opportunity Score (OS)

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunity_score": 89,
    "opportunity_breakdown": {
      "protection_gap_severity": 22,
      "renewal_urgency": 25,
      "conversion_likelihood": 20,
      "revenue_potential": 12,
      "relationship_strength": 10
    }
  }
}
```

---

### `GET /api/v1/customer/:customerId/both` — Get Both Scores

**Response:**
```json
{
  "success": true,
  "data": {
    "protection": { ...pis_response },
    "opportunity": { ...os_response }
  }
}
```

---

### `GET /api/v1/customer/:customerId/recommendations` — Personalized Recommendations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "priority": 1,
      "product": "health",
      "title": "Get Health Insurance — Your Biggest Gap",
      "message": "As the sole earner for your family, a health emergency without insurance could wipe out your savings...",
      "advisor_pitch": "Renewal in 9 days — perfect moment to bundle health...",
      "impact": "+10 to +13 points on Protection Score",
      "urgency": "high"
    },
    {
      "priority": 2,
      "product": "term",
      "title": "Secure Your Family with Term Cover",
      "message": "You have a home loan. If something unexpected happens...",
      "advisor_pitch": "Home loan of ₹50 lakhs. Position term as loan protection.",
      "impact": "+8 to +15 points on Protection Score",
      "urgency": "medium"
    }
  ]
}
```

---

### `GET /api/v1/customer/:customerId/history` — Score History

**Query params:** `?type=PROTECTION&limit=20` (type is optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "score_type": "PROTECTION",
      "overall_score": "64.00",
      "dimensions": { ...breakdown },
      "triggered_by": "SCORE_RECALCULATED",
      "calculated_at": "2026-06-18T22:01:30.766Z"
    }
  ]
}
```

---

### `POST /api/v1/coverage-event` — Report Coverage Event (triggers recalculation)

**Body:**
```json
{
  "customer_id": "eec4b472-5fb8-4e99-9605-856aff13c65b",
  "product": "health",
  "source": "sold_by_agent"
}
```

**Products:** `health` | `term` | `life` | `motor`  
**Sources:** `pb_held` | `sold_by_agent` | `added_by_agent`

**Response:**
```json
{
  "success": true,
  "data": {
    "protection": { ...updated_pis },
    "opportunity": { ...updated_os }
  }
}
```

---

### `GET /api/v1/partner/:partnerId/customers-ranked` — Ranked Customers (by OS)

**Response:**
```json
{
  "success": true,
  "data": {
    "customers_ranked": [
      {
        "customer_id": "eec4b472-...",
        "name": "Anjali Mehta",
        "protection_intelligence_score": 64,
        "opportunity_score": 89,
        "opportunity_breakdown": { ... }
      },
      {
        "customer_id": "62f37d3d-...",
        "name": "Meera Patel",
        "protection_intelligence_score": 20,
        "opportunity_score": 71,
        "opportunity_breakdown": { ... }
      }
    ],
    "top_opportunity": "eec4b472-..."
  }
}
```

---

### `POST /api/v1/customer/:customerId/recalculate` — Manual Recalculate

**Response:**
```json
{
  "success": true,
  "data": { "protection": { ... }, "opportunity": { ... } },
  "message": "Scores recalculated successfully"
}
```

---

## 4. RISK SIMULATIONS

### `POST /api/v1/customer/:customerId/simulate` — Run Simulation

**Body:**
```json
{
  "scenario": "child_birth",
  "params": {}
}
```

**Supported scenarios:**
| Scenario | Params |
|----------|--------|
| `marriage` | none |
| `child_birth` | none |
| `home_purchase` | `{ "loan_amount": 8000000 }` |
| `salary_increase` | `{ "multiplier": 1.5 }` |
| `new_dependent` | none |
| `retirement_planning` | `{ "corpus_ratio": 0.4 }` |

**Response:**
```json
{
  "success": true,
  "data": {
    "scenario": "child_birth",
    "scenario_label": "Having a Child",
    "current_score": 64,
    "projected_score": 68,
    "score_change": 4,
    "new_gaps": ["health", "term", "child_education_fund"],
    "risk_factors": [
      "New dependent with 20+ year financial commitment",
      "Education fund requirement (₹30-50 lakhs)",
      "Increased healthcare needs",
      "Single earner vulnerability amplified"
    ],
    "recommended_actions": [
      {
        "priority": 1,
        "action": "Buy health insurance immediately",
        "product": "health",
        "reason": "Newborn and mother need immediate health coverage",
        "impact": "+10 to Protection Score"
      },
      {
        "priority": 2,
        "action": "Get term life insurance",
        "product": "term",
        "reason": "Secure ₹180 lakhs to cover child's future until independence",
        "impact": "+8 to +15 to Protection Score"
      }
    ],
    "projected_breakdown": {
      "coverage_adequacy": { "score": 12, "max": 30, "change": 0 },
      "life_stage_readiness": { "score": 12, "max": 15, "change": 2 },
      "financial_vulnerability": { "score": 7, "max": 15, "change": 0 },
      "family_risk_protection": { "score": 7, "max": 10, "change": 2 },
      "protection_freshness": { "score": 10, "max": 10, "change": 0 },
      "engagement_strength": { "score": 10, "max": 10, "change": 0 },
      "data_confidence": { "score": 10, "max": 10, "change": 0 }
    }
  }
}
```

---

### `GET /api/v1/customer/:customerId/simulations` — Simulation History

**Response:**
```json
{ "success": true, "data": [ { ...simulation_record }, ... ] }
```

---

## 5. AI CHAT (Customer-Facing)

### `POST /api/v1/ai/chat/start/:customerId` — Start Chat Session

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "bf9afc08-964c-4e0e-959a-490db92c89ba",
    "customer_id": "eec4b472-5fb8-4e99-9605-856aff13c65b"
  }
}
```

---

### `POST /api/v1/ai/chat/message` — Send Message

**Body:**
```json
{
  "session_id": "bf9afc08-964c-4e0e-959a-490db92c89ba",
  "customer_id": "eec4b472-5fb8-4e99-9605-856aff13c65b",
  "message": "Why is my protection score low?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "Hi Anjali! Your protection score is 64/100 because you're missing health and term coverage. As a single earner with a home loan..."
  }
}
```

**Example questions the AI handles:**
- "Why is my score low?"
- "How can I improve my score?"
- "Do I need health insurance?"
- "What happens if I buy a house?"
- "Is my family protected enough?"

---

### `GET /api/v1/ai/chat/history/:sessionId` — Get Chat History

**Response:**
```json
{
  "success": true,
  "data": [
    { "session_id": "...", "customer_id": "...", "role": "user", "content": "Why is my score low?", "created_at": "..." },
    { "session_id": "...", "customer_id": "...", "role": "assistant", "content": "Hi Anjali! ...", "created_at": "..." }
  ]
}
```

---

### `GET /api/v1/ai/chat/sessions/:customerId` — Get Customer's Sessions

**Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "session-uuid", "last_message": "2026-06-18T22:05:00Z", "message_count": 4 }
  ]
}
```

---

## 6. AI COACH (Advisor-Facing)

### `GET /api/v1/ai/coach/insights/:customerId` — Full Coach Briefing

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": "## Customer Summary\nAnjali Mehta is a 36-year-old software engineer...\n\n## Why This Customer Now\nRenewal in 9 days + missing health...\n\n## Top 3 Actions\n1. Pitch health insurance...\n\n## Conversation Starters\n..."
  }
}
```

---

### `POST /api/v1/ai/coach/ask/:customerId` — Ask Coach a Question

**Body:**
```json
{ "question": "Why is Anjali a priority? What should I pitch first?" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Anjali is your top priority because her renewal is in 9 days and she has no health cover despite being a single earner..."
  }
}
```

**Example advisor questions:**
- "Why is this customer a priority?"
- "What should I discuss in our next call?"
- "What product is best suited for them?"
- "How do I handle the objection that insurance is expensive?"

---

### `GET /api/v1/ai/coach/summary/:customerId` — Structured Summary

**Response:**
```json
{
  "success": true,
  "data": {
    "customer_id": "eec4b472-...",
    "name": "Anjali Mehta",
    "protection_score": 64,
    "opportunity_score": 89,
    "protection_breakdown": { ... },
    "opportunity_breakdown": { ... },
    "coverage": { "motor": { "covered": true }, ... },
    "gaps": ["health", "term"],
    "recommendations": [ ... ],
    "ai_summary": "Anjali is a high-priority customer with an imminent renewal..."
  }
}
```

---

## Demo Customer IDs (for testing)

| Customer | ID | Partner |
|----------|-----|---------|
| Anjali Mehta | `eec4b472-5fb8-4e99-9605-856aff13c65b` | P001 |
| Rohit Verma | `df673e46-4409-439e-89b8-a39e2c76e12d` | P001 |
| Priya Nair | `f98747f0-e4c0-4d09-9e2e-e3466917aa7b` | P001 |
| Vikram Singh | `021135b8-c3f0-4136-afc7-920b6859ef7e` | P001 |
| Meera Patel | `62f37d3d-9829-4931-8ee4-e3402993d7f7` | P001 |
| Arjun Reddy | `b64bd546-d4a8-4899-b053-3e27f866d174` | P001 |
| Sneha Gupta | `20f8d1dc-7391-47d8-ae57-80155928e3d2` | P002 |
| Rajesh Kumar | `5436b55b-1db1-46f0-81b1-e95f7edca50a` | P002 |
| Kavitha Menon | `36330f65-6d80-4fdf-9809-a211647cb8c1` | P002 |
| Aditya Sharma | `d6e3cf8c-a34c-42ca-bd5f-f189221d7a79` | P002 |

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here",
  "stack": "..." // Only in development mode
}
```

Common status codes:
- `400` — Bad request (missing fields)
- `404` — Resource not found
- `429` — Gemini rate limit (wait and retry)
- `500` — Internal server error
