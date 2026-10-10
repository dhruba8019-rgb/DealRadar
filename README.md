# DealRadar India

Responsive frontend prototype for discovering and comparing shopping deals in India.

## Run locally
1. Extract the ZIP archive.
2. Open `dealradar_site/index.html` in a modern browser.

## Included
- Responsive desktop and mobile layout.
- Product search, categories, sorting, marketplace and price filters.
- Saved deals for the current page session.
- Product cards link to retailer search results.
- **Compare 10 stores** option on each product: Amazon India, Flipkart, Myntra, Tata CLiQ, Nykaa, Croma, Reliance Digital, Vijay Sales, AJIO and JioMart. Each opens a product-name search in a new tab.
- Security and privacy notes for a future production deployment.

## Important data limitation
This is a frontend demo. Sample product prices and discounts are illustrative, not live or verified. The 10-store comparison currently opens retailer searches so shoppers can check prices themselves; it does not automatically retrieve prices from those sites. Exact product matching and automatic price comparison require authorized marketplace/affiliate feeds or APIs, a backend service, scheduled refreshes, and clear freshness/source labels. Do not claim live prices until those integrations are implemented.

## Production recommendations
- Host the static site on Cloudflare Pages.
- Put API keys and marketplace integrations behind a backend such as Cloudflare Workers; never expose secret keys in browser JavaScript.
- Use authorized product feeds/APIs, caching, rate limits, input validation, security headers, affiliate disclosures, privacy notices, and stale-link/price checks.


## Security hardening added
- Moved inline JavaScript and CSS into separate files so the deployment Content Security Policy can block inline scripts and styles.
- Added HTML escaping for dynamic product and email text inserted into HTML templates.
- Added Cloudflare Pages `_headers` with CSP, clickjacking protection, MIME-sniffing protection, referrer policy, permissions policy, and cross-origin policy headers.
- Marketplace links use HTTPS and `rel="noopener noreferrer"` when opened in new tabs.

## Security status and limitations
This is a static frontend prototype, not a fully security-audited production service. It has no backend, accounts, payments, live marketplace API, or server-side validation to audit yet. The `_headers` file is applied when deployed on Cloudflare Pages or a host configured to serve these headers; opening the HTML directly from disk does not enforce HTTP response headers. Before production, run dependency and dynamic security testing, verify all outbound URLs, add server-side rate limiting and validation to any API, protect secrets in server-side environment variables, set up monitoring/backups, and publish privacy/terms/affiliate notices. No site can honestly be guaranteed “fully secure.”
