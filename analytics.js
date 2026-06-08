const GA_MEASUREMENT_ID = 'G-W9K29L4FMQ';

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('js', new Date());
gtag('config', GA_MEASUREMENT_ID);

(function loadGoogleTag() {
    if (document.querySelector(`script[src*="${GA_MEASUREMENT_ID}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
})();

function sendAnalyticsEvent(eventName, params = {}) {
    if (typeof gtag !== 'function') return;
    gtag('event', eventName, {
        transport_type: 'beacon',
        ...params
    });
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const text = (link.textContent || '').trim().slice(0, 80);
    const url = new URL(href, window.location.href);
    const params = {
        link_text: text,
        link_url: url.href,
        page_path: window.location.pathname
    };

    if (link.classList.contains('recipe-link') || url.href.includes('ideakitchen.substack.com/p/')) {
        sendAnalyticsEvent('recipe_click', params);
    }

    if (url.href.includes('ideakitchen.substack.com/subscribe') || /subscribe/i.test(text)) {
        sendAnalyticsEvent('subscribe_click', params);
    }

    if (url.pathname.includes('services') || link.classList.contains('service-cta')) {
        sendAnalyticsEvent('services_click', params);
    }

    if (url.hostname.endsWith('substack.com')) {
        sendAnalyticsEvent('substack_click', params);
    }
});
