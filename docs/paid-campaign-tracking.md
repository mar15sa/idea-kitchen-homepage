# Paid Campaign Tracking

Use this as the measurement checklist before running Meta ads.

## UTM Template

Add these URL parameters to every paid ad destination URL:

```text
utm_source=meta
utm_medium=paid_social
utm_campaign={{campaign.name}}
utm_id={{campaign.id}}
utm_content={{ad.name}}
utm_term={{adset.name}}
utm_source_platform=Meta
```

Example:

```text
https://ideakitchen.ai/services.html?utm_source=meta&utm_medium=paid_social&utm_campaign=chef_membership_test&utm_id=123&utm_content=short_recipe_ad&utm_term=busy_professionals&utm_source_platform=Meta
```

The website stores these campaign parameters for the current browser session and appends them to outbound Substack links. This lets Substack's GA4 integration receive the same campaign labels when someone completes a free or paid subscription on Substack.

Outbound Substack links also receive:

- `ik_offer_type`
- `ik_offer_name`
- `ik_referrer_path`

## GA Events To Watch

- `subscription_interest`: someone clicked toward a specific subscription offer.
- `subscribe_click`: someone clicked any Substack subscribe CTA.
- `service_inquiry_click`: someone clicked an email CTA for a specific service.
- `services_click`: someone clicked any services CTA.
- `waitlist_click`: someone opened the Chef's Selection waitlist.
- `waitlist_submit`: someone submitted the Chef's Selection waitlist form.
- `recipe_click`: someone clicked through from the Recipe Box to a Substack recipe.

## Useful Event Details

The analytics script sends these details when available:

- `offer_type`: `free_newsletter`, `chef_membership`, `team_membership`, `chefs_selection`, or `chefs_selection_waitlist`
- `offer_name`: human-readable offer name
- `service_type`: `team_ai_assessment`, `monthly_ai_update`, `group_ai_coaching`, `builder_in_residence`, `ai_coaching_session`, `help_me_choose`, or `expense_question`
- `service_name`: human-readable service name
- `value` and `currency`: estimated offer/service value for reporting
- `recipe_title`, `recipe_slug`, `recipe_tools`, `recipe_difficulty`, `recipe_time`

These GA custom dimensions have been created:

- `offer_type`
- `offer_name`
- `service_type`
- `service_name`

These GA key events are currently active:

- `subscribe_click`
- `recipe_click`
- `services_click`

After GA receives real, non-filtered traffic for the newer events, also mark these as key events:

- `subscription_interest`
- `service_inquiry_click`
- `waitlist_submit`

## CAC Math

Track these by campaign, ad set, and ad:

- CPC = ad spend / link clicks
- Landing page conversion rate = key action count / landing page sessions
- Cost per subscription interest = ad spend / `subscription_interest`
- Cost per service inquiry = ad spend / `service_inquiry_click`
- Cost per waitlist signup = ad spend / `waitlist_submit`
- CAC for confirmed subscribers = ad spend / confirmed new paid subscribers
- CAC payback = CAC / first-year gross profit per subscriber

## Current Limitation

The website can measure click intent. Substack's GA4 integration is the primary confirmed source for signups and paid subscriptions, but those confirmed events may take up to 24 hours to appear in GA.

For exact CAC, reconcile ad spend against confirmed Substack paid subscribers from GA/Substack subscriber exports. Substack exports can include subscription type, revenue, and source fields. This is the cleanest practical source of truth unless checkout moves to a first-party Stripe flow we control.

For Meta optimization, add the Meta Pixel ID and ideally Conversions API before meaningful spend. Without that, Meta can see ad clicks, but it cannot reliably learn which people became leads or subscribers.
