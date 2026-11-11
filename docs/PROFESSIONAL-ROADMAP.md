# Avonent theme: professional development track

## Current status (November 2026)
This repository is currently a **Horizon-derived theme** customized for Avonent. It can be developed for use on the Avonent Shopify store. It is **not eligible for standalone resale** while it contains Horizon-derived code. See Shopify Horizon's `LICENSE.md` for restrictions; replacing names later does not retroactively make derivative files independently original.

## What changed
- Cart drawer is now rendered by a statically included Shopify section, with merchant-editable blocks. Supported content blocks: Announcement, Shipping bar, Text, Image, Trust badges, Product, Divider, Spacer and Link. Blocks can be dragged, added, removed and placed before/after cart items or near checkout. The actual cart items and checkout remain fixed system controls.
- Cart drawer settings include size, colors, payment icons, and optional shipping protection product. Shipping protection is disabled by default and must be explicitly added by the shopper. No artificial reservation timer is shown.
- Subscription management landing page template (`page.subscription-management.json`) can be assigned to a Shopify Page. Merchants can edit headline, FAQ and information tiles, or link to their subscription application's portal.

## Configuring the cart drawer
1. Install this code only on an **unpublished theme** when you want to preview it.
2. Open the Shopify theme editor. The **Cart drawer** section is statically included in the layout. Open its settings and add, remove, or arrange blocks. Some themes/editor versions display static layout sections under theme-wide sections.
3. Choose the placement of each block. Core cart items, totals, and checkout are intentionally not removable.
4. Set a free shipping threshold in your **store currency**. Ensure Shopify shipping rules actually grant free shipping at that threshold. The bar only displays progress; it does not create a discount.
5. To offer shipping protection, configure an actual product, enable the add-on in the drawer, and test opt-in, removal, and order totals. Never automatically add a paid line item.
6. Verify the drawer after cart AJAX updates, as well as on mobile and keyboard-only navigation.

## Configuring the subscription management page
1. Create a Shopify Page in the admin and select theme template `page.subscription-management`.
2. In your subscription app, enable the **customer portal**, choose who can pause/skip/edit/cancel, and copy the authenticated customer portal URL.
3. Add that URL to the page's button field. If you use Appstle Classic and its Appstle placeholder block, optionally enable the **Appstle Classic button placeholder**.
4. Customize informational cards and FAQs in the theme editor. These cards describe features; **they do not execute customer-account changes**.
5. Appstle's new customer-account extension portal is configured in Shopify **Settings → Customer accounts → Customize**, not in theme files. Build Appstle retention offers in its own Retention Management settings. Give shoppers an easy, direct cancellation path.
6. Run a full test with a real test subscription before making the page visible.

## Still required before professional release
- Refactor the 190KB Cinnamon product snippet into native, independent Shopify sections.
- Bonus bottle and e-book variant IDs have been replaced with Shopify product pickers. The Avonent Cinnamon template preselects its own products. Other merchants must configure their products and matching real discounts; the theme does not automatically create gift discounts. Other store-specific handles and assumptions still require a separate audit.
- Add liquid defaults and accessible, truthful disclosure logic for selling plans across products.
- Integrate review apps instead of hard-coded testimonials; do not ship fabricated reviews, sold percentages, or unverified health claims as defaults.
- Implement full mobile/desktop browser testing and automated visual regression.
- Improve localization, multi-currency and Markets price display, all forms and dynamic checkout behavior.
- Complete performance and accessibility audits (Lighthouse, keyboard, screen readers, WCAG).
- Test every store page template, search, filters, collection grids, gift cards, localization, and platform account flows.
- Maintain a changelog and versioned ZIP release process.
- **Commercial theme**: separate **clean-room original implementation** without Shopify Horizon-derived assets/code, followed by a legal/licensing review.

## Checkout limitations
Theme files cannot remove mandatory subscription terms in Shopify's checkout, implement custom payment steps, or bypass Shopify checkout limitations. Available checkout extensions depend on merchant plan and API permission.

## Scope and safety
No theme deployment or publishing is performed by repository commits. Do not link an auto-deploy-to-live action to this branch. Always test on an unpublished theme first.
