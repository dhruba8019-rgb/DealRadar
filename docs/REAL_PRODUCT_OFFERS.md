# DealRadar: Safe Real Product Offers Plan

Status: planning only. No marketplace feed is connected, and no live prices are available yet.

## 1. Current repository assessment

- Static site hosted on Cloudflare Pages; the repository has no `package.json`, `wrangler.toml`, or existing `functions/api/*` backend.
- `app.js` defines 15 hard-coded demo offers with illustrative prices, MRP, discounts, and ratings. Product search, category filters, sorting, saved items, and the 10-marketplace comparison are browser-side features.
- Product cards currently open retailer search pages; comparison links ask shoppers to check each marketplace manually.
- `_headers` applies a restrictive Content Security Policy, including `connect-src 'self'`, and allows HTTPS images. Same-origin Pages Functions are compatible with the existing connect policy.
- Seven Cuelinks tracking links are in the affiliate brand section. The current affiliate-disclosure modal in `app.js` still says active affiliate links may be introduced in the future; update this wording before launch so it accurately describes the existing links and approvals.

## 2. Proposed architecture

1. **Cloudflare Pages Function** at `functions/api/deals.js` provides a same-origin read-only API. It validates query parameters, returns normalized offer records, applies caching, and never exposes provider credentials.
2. **Provider adapters** run server-side only, one per approved API/feed. Each adapter maps the provider's permitted product data into the common schema. Do not scrape sites or bypass access controls; use only approved feeds/APIs and comply with their terms.
3. **Scheduled refresh** (only when a provider and its terms support it) refreshes stored/cached records. If storage is needed, choose a Cloudflare data service deliberately and document retention. Do not introduce a database until a real provider requires it.
4. **Frontend integration** replaces demo records only when the API returns valid, source-backed offers. Keep demo mode visibly labelled and separate; never merge demo and live records without an unmistakable label.
5. **Monitoring** records fetch failures and freshness metadata without logging secrets, personal data, or unnecessary search queries.

## 3. Normalized offer schema

Required fields:
- `id`: stable internal/provider offer identifier
- `title`: provider-supplied product title
- `retailer`: source retailer name
- `productUrl`: HTTPS product/deep link permitted by the provider (affiliate link only when approved)
- `source`: feed/API identifier
- `currency`: ISO currency code (expected `INR` for Indian offers)
- `price`: source-provided current price, numeric and non-negative
- `fetchedAt`: timestamp when DealRadar fetched this record
- `sourceUpdatedAt`: provider update time, when supplied

Optional fields only when supplied by the source: `mrp`, `imageUrl`, `availability`, `brand`, `model`, `category`, `rating`, `reviewCount`, `affiliateUrl`, `validUntil`.

Discount must be calculated only when both source-backed price and MRP exist and MRP is greater than price. Do not invent ratings, original prices, availability, or discount percentages. Preserve provider attribution requirements.

## 4. Validation and display rules

- Accept only HTTPS URLs from a configured provider/retailer allowlist; reject unexpected protocols and unsafe redirect destinations.
- Validate types, required fields, non-negative price, currency, maximum payload size, and duplicate IDs before returning records.
- Show retailer/source and “updated” time. Define provider-specific freshness thresholds; mark stale offers clearly or suppress them rather than presenting them as current.
- If a source is unavailable, return a clear unavailable/stale state; never fabricate fallback prices. Demo offers may remain visible only under an explicit “Illustrative demo data — not live” label.
- Escape all provider text before inserting it into HTML. Avoid rendering provider-supplied HTML.
- Rate-limit where practical, cache briefly based on provider terms, set bounded timeouts, and avoid logging API keys or personal data.

## 5. Secrets and deployment

- Store API credentials in Cloudflare Pages/Workers environment secrets, never in `app.js`, HTML, Git history, or public build variables.
- Keep the browser calling only the same-origin `/api/deals` endpoint; the current `connect-src 'self'` CSP can remain.
- Use separate development/test and production credentials. Add a minimal health/status response that reveals no secret values.
- Test API failure, malformed provider responses, empty results, expired offers, duplicate records, mobile rendering, and existing search/filter/sort/save/compare behaviour before switching the UI to live data.

## 6. Rollout phases

### Phase A — Provider access (blocking prerequisite)
- Confirm written approval and documentation for each product API/feed, including permitted fields, refresh frequency, attribution, image use, deep links, and display requirements.
- Amazon and Flipkart are not assumed approved; keep them disabled until access is granted.
- Check whether each existing Cuelinks campaign/link is approved for the publisher account. A tracking redirect alone does not prove that a product feed/API or commission eligibility is approved.

### Phase B — Safe backend foundation
- Add the Pages Function and a provider adapter interface.
- With no configured provider, return an explicit `source_not_configured` state and an empty offers list; do not fabricate offers.
- Add schema validation and tests before enabling any provider.

### Phase C — First real provider
- Integrate one approved feed/API end-to-end, test attribution and product links, and document its freshness policy.
- Keep the existing demo catalogue clearly labelled until the real feed is verified.

### Phase D — Frontend and expansion
- Add live/source labels, last-updated times, stale-state messaging, and error handling.
- Connect additional approved providers one at a time and compare only records whose product identity is sufficiently reliable. Never imply a same-model price comparison from a loose text match.

## 7. Acceptance criteria

- No secret is present in client code or committed files.
- Every live price has a provider source and fetch timestamp.
- No live-looking price is generated from hard-coded examples or guessed values.
- Expired/stale records are labelled or suppressed according to provider policy.
- Existing frontend features still work when the API is empty or unavailable.
- Affiliate disclosure matches the links and programmes actually active.
- Deployment is reported as complete only after the live Pages URL is checked.

## 8. Immediate next action

Obtain the provider's API/feed documentation and approval status for the first intended source. Once supplied, implement its adapter against this contract. Until then, this repository should remain in explicitly labelled demo mode.
