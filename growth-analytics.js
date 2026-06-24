(function () {
  const endpoint = "https://ideakitchen-production.up.railway.app/api/growth/events";

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function safeUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.href);
      return url.origin + url.pathname + url.search;
    } catch {
      return null;
    }
  }

  function getSearchParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function inferEventName(element, targetUrl) {
    const configured = element.getAttribute("data-growth-event");
    if (configured) return configured;

    const recipeCard = element.closest("[data-recipe-slug]");
    if (recipeCard && targetUrl) return "recipe_click";

    if (targetUrl && targetUrl.includes("ideakitchen.substack.com/subscribe")) {
      const label = cleanText(element.getAttribute("data-cta-label") || element.textContent).toLowerCase();
      return label.includes("chef") || targetUrl.includes("group=true")
        ? "paid_cta_click"
        : "subscribe_click";
    }

    if (targetUrl && targetUrl.includes("ideakitchen.substack.com")) return "outbound_click";

    return null;
  }

  function buildPayload(element) {
    const recipeCard = element.closest("[data-recipe-slug]");
    const href = element instanceof HTMLAnchorElement ? element.href : element.getAttribute("data-target-url");
    const targetUrl = safeUrl(href);
    const eventName = inferEventName(element, targetUrl);

    if (!eventName) return null;

    return {
      eventName,
      source: "website",
      pagePath: window.location.pathname,
      pageTitle: document.title,
      targetUrl,
      ctaLabel: cleanText(element.getAttribute("data-cta-label") || element.textContent),
      recipeSlug: element.getAttribute("data-recipe-slug") || recipeCard?.getAttribute("data-recipe-slug") || null,
      recipeLane: element.getAttribute("data-recipe-lane") || recipeCard?.getAttribute("data-recipe-lane") || null,
      experimentSlug: element.getAttribute("data-experiment-slug") || null,
      referrer: safeUrl(document.referrer),
      utmSource: getSearchParam("utm_source") || element.getAttribute("data-utm-source") || null,
      utmMedium: getSearchParam("utm_medium") || element.getAttribute("data-utm-medium") || null,
      utmCampaign: getSearchParam("utm_campaign") || element.getAttribute("data-utm-campaign") || null,
      utmContent: getSearchParam("utm_content") || element.getAttribute("data-utm-content") || null,
      utmTerm: getSearchParam("utm_term") || element.getAttribute("data-utm-term") || null,
      occurredAt: new Date().toISOString()
    };
  }

  function sendGrowthEvent(payload) {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {});
  }

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element
      ? event.target.closest("a, button, [data-growth-event]")
      : null;

    if (!target) return;

    const payload = buildPayload(target);
    if (payload) sendGrowthEvent(payload);
  }, { capture: true });
})();

