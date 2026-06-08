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

  const eventParams = {
    transport_type: 'beacon',
    page_path: window.location.pathname,
    ...params
  };

  window.gtag('event', eventName, eventParams);
  sendMetaEvent(eventName, eventParams);
}

function sendMetaEvent(eventName, params = {}) {
  if (typeof window.fbq !== 'function') return;

  const leadEvents = ['subscribe_click', 'subscription_interest', 'service_inquiry_click', 'waitlist_click', 'waitlist_submit'];
  const metaParams = {
    content_name: params.offer_name || params.service_name || params.link_text || eventName,
    content_category: params.offer_type || params.service_type || params.click_type || eventName,
    value: params.value,
    currency: params.currency
  };

  if (leadEvents.includes(eventName)) {
    window.fbq('track', 'Lead', metaParams);
    return;
  }

  if (eventName === 'recipe_click') {
    window.fbq('trackCustom', 'RecipeClick', metaParams);
  }
}

function buildClickParams(target, url) {
  return {
    link_text: (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
    link_url: url ? url.href : '',
    page_title: document.title
  };
}

function slugify(value) {
  return (value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getOfferingName(target) {
  const card = target.closest('.offering-card');
  const heading = card ? card.querySelector('h3') : null;
  return heading ? heading.textContent.trim() : '';
}

function getMailSubject(url) {
  if (!url || url.protocol !== 'mailto:') return '';
  return (url.searchParams.get('subject') || '').trim();
}

function inferSubscriptionDetails(link, url, text) {
  const offeringName = getOfferingName(link);
  const normalizedText = `${text} ${offeringName}`.toLowerCase();
  let offerType = 'free_newsletter';
  let offerName = 'Newsletter';
  let value = 0;

  if (url.searchParams.get('group') === 'true') {
    offerType = 'team_membership';
    offerName = 'Team Membership';
    value = 129;
  } else if (normalizedText.includes('chef') && !normalizedText.includes('selection')) {
    offerType = 'chef_membership';
    offerName = 'Chef Membership';
    value = 149;
  } else if (normalizedText.includes('selection')) {
    offerType = 'chefs_selection';
    offerName = "Chef's Selection";
    value = 349;
  }

  return {
    offer_type: offerType,
    offer_name: offerName,
    value,
    currency: 'USD'
  };
}

function inferServiceDetails(link, url, text) {
  const subject = getMailSubject(url);
  const offeringName = getOfferingName(link);
  const source = `${subject} ${offeringName} ${text}`.toLowerCase();
  let serviceName = offeringName || text || subject || 'Service CTA';
  let serviceType = slugify(serviceName) || 'service_cta';
  let value;

  const services = [
    ['team ai assessment', 'team_ai_assessment', 'Team AI Assessment', 7500],
    ['monthly ai update', 'monthly_ai_update', 'Monthly AI Update', 5000],
    ['group ai coaching', 'group_ai_coaching', 'Group AI Coaching', 4950],
    ['builder in residence', 'builder_in_residence', 'Builder in Residence', 7500],
    ['ai coaching session', 'ai_coaching_session', 'AI coaching session'],
    ['help me choose', 'help_me_choose', 'Help me choose'],
    ['expense question', 'expense_question', 'Expense question']
  ];

  const match = services.find(([needle]) => source.includes(needle));
  if (match) {
    serviceType = match[1];
    serviceName = match[2];
    value = match[3];
  }

  return {
    service_type: serviceType,
    service_name: serviceName,
    inquiry_subject: subject,
    value,
    currency: value ? 'USD' : undefined
  };
}

function buildRecipeDetails(link) {
  const card = link.closest('.recipe-card');
  if (!card) return {};

  const title = card.querySelector('.recipe-title') ? card.querySelector('.recipe-title').textContent.trim() : '';
  return {
    recipe_title: title,
    recipe_slug: slugify(title),
    recipe_tools: card.getAttribute('data-tools') || '',
    recipe_difficulty: card.getAttribute('data-difficulty') || '',
    recipe_time: card.getAttribute('data-time') || ''
  };
}

(function bindIdeaKitchenClickTracking() {
  if (window.__ideaKitchenAnalyticsEventsBound) return;
  window.__ideaKitchenAnalyticsEventsBound = true;

  document.addEventListener('click', event => {
    const waitlistButton = event.target.closest('[data-waitlist-open]');
    if (waitlistButton) {
      const params = {
        ...buildClickParams(waitlistButton),
        offer_type: 'chefs_selection_waitlist',
        offer_name: "Chef's Selection",
        value: 349,
        currency: 'USD'
      };
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
    const isSubstackLink = url.hostname.endsWith('substack.com');

    if (link.closest('.recipe-card') || link.classList.contains('recipe-link') || url.href.includes('ideakitchen.substack.com/p/')) {
      sendIdeaKitchenEvent('recipe_click', { ...params, ...buildRecipeDetails(link) });
    }

    if (url.href.includes('ideakitchen.substack.com/subscribe') || /subscribe|become a chef|get started/i.test(text)) {
      const subscriptionParams = { ...params, ...inferSubscriptionDetails(link, url, text) };
      sendIdeaKitchenEvent('subscribe_click', subscriptionParams);
      sendIdeaKitchenEvent('subscription_interest', subscriptionParams);
    }

    if (
      (link.classList.contains('svc-btn') && !isSubstackLink) ||
      link.classList.contains('service-cta') ||
      url.pathname.endsWith('/services.html') ||
      url.protocol === 'mailto:'
    ) {
      const serviceParams = { ...params, ...inferServiceDetails(link, url, text) };
      sendIdeaKitchenEvent('services_click', serviceParams);
      if (url.protocol === 'mailto:') {
        sendIdeaKitchenEvent('service_inquiry_click', serviceParams);
      }
    }

    if (isSubstackLink) {
      sendIdeaKitchenEvent('substack_click', params);
    }
  });

  document.addEventListener('submit', event => {
    if (event.target && event.target.id === 'waitlist-form') {
      sendIdeaKitchenEvent('waitlist_submit', {
        form_id: 'waitlist-form',
        page_title: document.title,
        offer_type: 'chefs_selection_waitlist',
        offer_name: "Chef's Selection",
        value: 349,
        currency: 'USD'
      });
    }
  });
})();
