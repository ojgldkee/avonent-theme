# Avonent theme editor — native product sections

## How this version is structured

**Products → cinnamon-berberine** is now a normal Shopify JSON template. The sections appear in precisely the order shown in the Shopify editor.

1. **Product information** — product gallery, ratings, badges, benefits, selling plans, one-time purchase, 1/2/3 bottle offers, editable guarantee, inventory warning, accordions, trust image and sticky cart.
   - **Product purchase** block: change the product headline, badges, rating text, selling bar, benefit bullets, bundle titles/subtitles, subscription label, refill text, and delivery estimate.
   - **Guarantee & stock** block: change or hide the guarantee, image, stock warning heading/message, color, and accordions.
   - Section settings: product accent colors, trust image, sticky cart title and button.
2. **Product stats**
3. **Product carousel**
4. **Product reviews**
5. **Product science**
6. **Product timeline**
7. **Product comparison**
8. **Product benefits**
9. **Product reasons** (currently hidden to match the previous Cinnamon template)
10. **Product guarantee**
11. **Customer stories** — each review card is its own editable block
12. **Product FAQ**

All sections beneath Product information are independent: drag, duplicate, hide, add, or remove them in the Shopify editor. Their settings come from the old product blocks, migrated with the original saved values. A few older templates may still include the legacy layout file; it remains available for compatibility but no longer appears as an addable section.

## Announcements and colors

The header's **Avonent Summer Sale** announcement block provides separate settings for Homepage, Cinnamon, Garlic, Collections, Pages, and other product pages. Those preferences are linked to the page type, not to whichever page is open when you move a color picker. The countdown can be tied to an actual sale end date instead of automatically restarting when it reaches zero.

## Cart drawer builder

Open **Cart drawer** below the footer in the Shopify editor. Its blocks can be re-ordered and placed before/after items or checkout:

- Announcement
- Shipping bar (visual only; configure Shopify shipping rules separately)
- Text
- Image
- Trust badges
- Product recommendation
- Payment icons
- Divider
- Spacer
- Link

**Payment icons** has three modes: all currently enabled methods, individually selected icons, or a custom uploaded image. If you add a Payment icons block, the original fixed icon row is hidden. Merchant settings also control the drawer's title, empty-cart heading, estimated total label, checkout button/lock/arrow, and optional protection upsell.

The cart drawer remains mounted during AJAX refresh, so add-to-cart updates replace its content instead of replacing its dialog shell. In Shopify design mode, selecting drawer blocks requests the dialog to open.

## Important functional notes

- Selling-plan prices and recurring intervals come from Shopify and your subscription app. Labels in the editor do not change the amounts charged or legal checkout disclosures.
- The shipping label is only presentation; configure actual shipping fees separately.
- The guarantee, rating, stock indicators, and medical claims should only be displayed when truthful, current, and substantiated.
- Do not automatically add paid shipping protection to the cart.
- **This work is GitHub-only.** The store's published theme is not touched. Upload the generated ZIP as a new unpublished theme for preview.
- This codebase still includes Horizon-derived material and is **not** ready for standalone resale. A clean-room original build is a separate project.

## Manual release checks

- [ ] Verify Product information and each lower section actually render in the same order as the sidebar
- [ ] Change and clear the stock warning text; confirm the preview updates
- [ ] Edit banner colors on Home and Cinnamon separately and verify each page persists
- [ ] Add an item to an empty cart; drawer stays visible with item and accurate totals
- [ ] Add another item while drawer is open; update, remove, change quantity, and close/reopen
- [ ] Customize payment logos and confirm no duplicates
- [ ] Test Appstle selling plans, one-time purchase and all 3 bundle choices
- [ ] Check free-gift and shipping discount rules in actual checkout
- [ ] Test mobile and desktop, keyboard navigation, slow connection, and theme editor reloads
- [ ] Verify all product/endorsement/review and inventory claims are supported by evidence
