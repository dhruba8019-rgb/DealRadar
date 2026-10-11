const API_URL = "https://developers.cuelinks.com/pub_api/v3/offers";
const CACHE_SECONDS = 300;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? `public, max-age=60, s-maxage=${CACHE_SECONDS}` : "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

function cleanText(value, max = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function safeTrackingUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    if (!(host === "linksredirect.com" || host.endsWith(".linksredirect.com") ||
          host === "cuelinks.com" || host.endsWith(".cuelinks.com"))) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeOffer(item) {
  if (!item || typeof item !== "object") return null;
  const status = cleanText(item.status, 30).toLowerCase();
  if (status && status !== "live" && status !== "active") return null;

  const endDate = cleanText(item.end_date, 40);
  if (endDate) {
    const endTime = Date.parse(endDate);
    if (Number.isFinite(endTime) && endTime < Date.now()) return null;
  }

  const trackingUrl = safeTrackingUrl(item.tracking_url || item.url);
  if (!trackingUrl) return null;

  const title = cleanText(item.title, 180);
  if (!title) return null;

  const categories = Array.isArray(item.categories)
    ? item.categories.map((entry) => cleanText(typeof entry === "string" ? entry : entry?.name, 60)).filter(Boolean).slice(0, 5)
    : [];

  return {
    id: cleanText(String(item.id ?? ""), 80),
    title,
    description: cleanText(item.description, 600),
    terms: cleanText(item.terms, 400),
    merchant: cleanText(item.campaign_name || item.merchant_name || item.merchant, 100) || "Partner store",
    offerType: cleanText(item.offer_type, 30) || "offer",
    couponCode: cleanText(item.coupon_code, 100),
    startDate: cleanText(item.start_date, 40),
    endDate,
    categories,
    trackingUrl
  };
}

export async function onRequestGet({ request, env }) {
  const key = env.CUELINKS_API_KEY;
  if (!key) return json({ error: "Live offers are not configured yet." }, 503);

  const incoming = new URL(request.url);
  const query = cleanText(incoming.searchParams.get("q") || "", 100);
  const requestedPage = Number.parseInt(incoming.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(100, Math.max(1, requestedPage)) : 1;

  const upstream = new URL(API_URL);
  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set("per_page", "30");
  if (query) upstream.searchParams.set("q", query);

  let response;
  try {
    response = await fetch(upstream.toString(), {
      headers: {
        "Authorization": `Token ${key}`,
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    return json({ error: "The offers provider could not be reached. Please try again shortly." }, 502);
  }

  if (!response.ok) {
    return json({ error: response.status === 401 || response.status === 403
      ? "The offers provider rejected the configured credentials or permissions."
      : "The offers provider is temporarily unavailable." }, 502);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return json({ error: "The offers provider returned an unreadable response." }, 502);
  }

  const sourceItems = Array.isArray(payload) ? payload
    : Array.isArray(payload?.offers) ? payload.offers
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.results) ? payload.results
    : Array.isArray(payload?.data?.offers) ? payload.data.offers
    : [];

  const offers = sourceItems.map(normalizeOffer).filter(Boolean);
  const meta = payload?.meta || payload?.pagination || {};
  return json({
    source: "Cuelinks",
    fetchedAt: new Date().toISOString(),
    page,
    totalPages: Number.isFinite(Number(meta.total_pages)) ? Number(meta.total_pages) : null,
    totalOffers: Number.isFinite(Number(meta.total)) ? Number(meta.total) : null,
    offers
  });
}
