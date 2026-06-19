# Partner Intelligence and Cadence APIs

These APIs read precomputed Protection and Opportunity Scores from PostgreSQL. They never run the scoring engines.

## Setup

```bash
npm install
npm run dev
```

Configure the values documented in `.env.example`. `MONGODB_URI` is optional for these APIs. The configured database must already contain the `cadence_ai_cache` table.

## Partner intelligence

`GET /api/v1/partner/:partnerId/intelligence`

Returns the partner's customers sorted by stored Opportunity Score descending. Customers without an Opportunity Score are excluded. The `why` array is derived deterministically from stored customer and score fields.

```bash
curl http://localhost:3000/api/v1/partner/P001/intelligence
```

## Cadence generation

`POST /api/v1/cadence/generate`

When `customer_id` is omitted, the highest-scoring customer for the partner is selected. `customer_id` accepts either the external ID such as `C5501` or the database UUID.

```bash
curl -X POST http://localhost:3000/api/v1/cadence/generate \
  -H "Content-Type: application/json" \
  -d '{"partner_id":"P001"}'
```

Optional request fields:

- `customer_id`: generate for a specific customer belonging to the partner.
- `force_refresh`: bypass an exact cache hit and call Gemini.

The response includes the selected customer, its stored Opportunity Score, deterministic `why` evidence, the structured Cadence object, and cache metadata.

## Error behavior

- `400`: malformed request.
- `404`: unknown partner or customer.
- `409`: no stored Opportunity Score is available.
- `503`: Gemini failed and no prior valid cache entry exists.

Gemini responses are schema-validated before being saved. When Gemini fails and an older valid result exists, the API returns it with `meta.stale: true`.
