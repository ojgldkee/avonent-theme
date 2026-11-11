# Subscription customer portal integration

This theme's `Manage subscription` page is an editable **entry page**, not a replacement for Appstle/Shopify subscription APIs.

## Appstle Classic Portal
- Enable Classic Portal from Appstle → Customer Portal settings.
- Copy the authenticated Portal URL (usually a store URL ending in `/apps/subscriptions`; use the URL given by Appstle, not a guessed one).
- Add it in Shopify → Online Store → Pages → Manage Subscription → template `subscription-management`, then in Customize → **Manage subscription** → **Subscription portal link**.
- Or use Appstle's official manage-subscription button theme app block; the optional `appstle-subscription-manage-subscription-button-placeholder` can be enabled in this section for Classic Portal when Appstle supports it.
- Use Appstle's portal editor, CSS, Custom HTML, and Retention Management to configure the actual subscription operations. The theme controls the introductory content only.

## New customer account portal
In Shopify Settings → Customer accounts → Customize, add Appstle's **customer account extension blocks** on the appropriate account pages. The theme editor does not control these account-extension pages.

## Cancellation
The merchant must provide a straightforward cancellation method. Optional skip/pause/discount offers must not trap customers in a cancellation maze. Always keep direct cancellation accessible and explain timing, future billing and confirmation.

## Checklist
- [ ] Appstle enabled and linked to the correct selling plans
- [ ] Customer portal accessible on desktop/mobile
- [ ] Test subscriber can pause, skip, change payment and cancel
- [ ] Correct subscriptions are shown for the authenticated customer only
- [ ] Renewal pricing, timing and disclosures are accurate
- [ ] Confirmation state and emails validated
- [ ] Cancellation is easy and accessible
