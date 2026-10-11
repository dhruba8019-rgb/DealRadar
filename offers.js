(() => {
  const grid = document.getElementById("liveOffersGrid");
  const status = document.getElementById("liveOffersStatus");
  const refresh = document.getElementById("refreshLiveOffers");
  if (!grid || !status) return;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  function dateLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  function renderOffers(offers) {
    if (!offers.length) {
      grid.innerHTML = '<div class="live-offers-empty">No eligible offers were returned. Try refreshing later.</div>';
      return;
    }
    grid.innerHTML = offers.map((offer) => {
      const isCoupon = Boolean(offer.couponCode);
      const kind = isCoupon ? "COUPON" : (offer.offerType || "OFFER").toUpperCase();
      const dates = offer.endDate ? "Valid until " + dateLabel(offer.endDate) : "";
      const description = offer.description || offer.terms || "Open the partner offer to review details and conditions.";
      const categories = Array.isArray(offer.categories) ? offer.categories.slice(0, 3).join(" · ") : "";
      return '<article class="live-offer-card">' +
        '<div class="live-offer-meta"><span class="live-offer-kind">' + esc(kind) + '</span><span class="live-offer-merchant">' + esc(offer.merchant || "Partner store") + '</span></div>' +
        '<h3>' + esc(offer.title) + '</h3>' +
        '<p>' + esc(description) + '</p>' +
        (categories ? '<div class="live-offer-categories">' + esc(categories) + '</div>' : '') +
        (isCoupon ? '<div class="live-coupon"><span>Coupon code</span><strong>' + esc(offer.couponCode) + '</strong></div>' : '') +
        (dates ? '<div class="live-offer-validity">' + esc(dates) + '</div>' : '') +
        '<a class="live-offer-button" href="' + esc(offer.trackingUrl) + '" target="_blank" rel="sponsored noopener noreferrer">Shop offer ↗</a>' +
        '</article>';
    }).join("");
  }

  async function loadOffers(query = "") {
    status.textContent = "Loading live offers from Cuelinks…";
    if (refresh) refresh.disabled = true;
    try {
      const url = new URL("/api/offers", window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim().slice(0, 100));
      const response = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
        credentials: "same-origin"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Live offers are temporarily unavailable.");
      const offers = Array.isArray(data.offers) ? data.offers : [];
      renderOffers(offers);
      const total = data.totalOffers ? " · " + Number(data.totalOffers).toLocaleString("en-IN") + " provider offers in total" : "";
      status.textContent = offers.length + " eligible live offers received from Cuelinks" + total + ". Fetched " +
        new Date(data.fetchedAt || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + ".";
    } catch (error) {
      grid.innerHTML = '<div class="live-offers-empty">Live offers could not be loaded. The existing demo catalogue is still available below.</div>';
      status.textContent = error.message || "Live offers are temporarily unavailable.";
    } finally {
      if (refresh) refresh.disabled = false;
    }
  }

  if (refresh) refresh.addEventListener("click", () => loadOffers(document.getElementById("searchInput")?.value || ""));
  const desktopSearch = document.getElementById("searchForm");
  const mobileSearch = document.getElementById("mobileSearchForm");
  if (desktopSearch) desktopSearch.addEventListener("submit", () => {
    const query = document.getElementById("searchInput")?.value || "";
    window.setTimeout(() => loadOffers(query), 0);
  });
  if (mobileSearch) mobileSearch.addEventListener("submit", () => {
    const query = document.getElementById("mobileSearchInput")?.value || "";
    window.setTimeout(() => loadOffers(query), 0);
  });

  loadOffers();
})();
