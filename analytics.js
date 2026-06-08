const IDEA_KITCHEN_GA_ID = 'G-W9K29L4FMQ';

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

(function initializeGoogleAnalytics() {
  const hasTag = document.querySelector(`script[src*="${IDEA_KITCHEN_GA_ID}"]`);
  const hasConfig = window.dataLayer.some(item => item && item[0] === 'config' && item[1] === IDEA_KITCHEN_GA_ID);

  if (!hasTag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${IDEA_KITCHEN_GA_ID}`;
    document.head.appendChild(script);
  }

  if (!hasConfig) {
    window.gtag('js', new Date());
    window.gtag('config', IDEA_KITCHEN_GA_ID);
  }
})();

function sendIdeaKitchenEvent(eventName, params = {}) {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, {
    transport_type: 'beacon',
    page_path: window.location.pathname,
    ...params
  });
}

function buildClickParams(target, url) {
  return {
    link_text: (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
    link_url: url ? url.href : '',
    page_title: document.title
  };
}

(function bindIdeaKitchenClickTracking() {
  if (window.__ideaKitchenAnalyticsEventsBound) return;
  window.__ideaKitchenAnalyticsEventsBound = true;

  document.addEventListener('click', event => {
    const waitlistButton = event.target.closest('[data-waitlist-open]');
    if (waitlistButton) {
      const params = buildClickParams(waitlistButton);
      sendIdeaKitchenEvent('services_click', { ...params, click_type: 'waitlist_open' });
      sendIdeaKitchenEvent('waitlist_click', params);
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const url = new URL(href, window.location.href);
    const params = buildClickParams(link, url);
    const text = params.link_text;

    if (link.closest('.recipe-card') || link.classList.contains('recipe-link') || url.href.includes('ideakitchen.substack.com/p/')) {
      sendIdeaKitchenEvent('recipe_click', params);
    }

    if (url.href.includes('ideakitchen.substack.com/subscribe') || /subscribe|become a chef|get started/i.test(text)) {
      sendIdeaKitchenEvent('subscribe_click', params);
    }

    if (
      link.classList.contains('svc-btn') ||
      link.classList.contains('service-cta') ||
      url.pathname.endsWith('/services.html') ||
      url.protocol === 'mailto:'
    ) {
      sendIdeaKitchenEvent('services_click', params);
    }

    if (url.hostname.endsWith('substack.com')) {
      sendIdeaKitchenEvent('substack_click', params);
    }
  });

  document.addEventListener('submit', event => {
    if (event.target && event.target.id === 'waitlist-form') {
      sendIdeaKitchenEvent('waitlist_submit', {
        form_id: 'waitlist-form',
        page_title: document.title
      });
    }
  });
})();
