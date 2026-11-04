# Avonent Theme

**Avonent's independent, version-controlled Shopify Online Store 2.0 theme.**

This repository is a snapshot of the working **Avonent** storefront design, initially exported from the live `horizon/main` theme on `avonent.com` on 2026-11-04. It includes the complete Shopify theme source: Liquid sections, reusable blocks, page and product templates, snippets, CSS, JavaScript, locales, theme settings, and the custom Cinnamon, Garlic, and other Avonent landing-page templates.

## What is included

- Avonent's product page layouts and editable Cinnamon page section/blocks, including hero, reviews, benefits, FAQ, comparison, and supporting content.
- Product gallery, scroll-related behavior, sticky add-to-cart, cart drawer and other active storefront code.
- Announcement bar, navigation, footer, global colors, fonts, and configuration.
- All Shopify JSON page templates, their section order and saved section/block settings.
- Shopify's theme editor customizations as stored in the source theme's `config/settings_data.json`.

## Move to another Shopify store

1. Clone this repo and install [Shopify CLI](https://shopify.dev/docs/api/shopify-cli).
2. Log in to the **destination** store and create/choose a **development or unpublished** theme.
3. In the repo root, run `shopify theme push --store your-new-store.myshopify.com --unpublished`. Shopify CLI might ask to authenticate/select a theme.
4. Preview the uploaded theme before publishing. In the destination store, configure products, collections, navigation menus, sales channels, payment methods, shipping, discounts, apps, and subscription app.
5. Re-upload source-store images/videos in **Content > Files** and map missing references in the theme editor. `shopify://shop_images/...` references in templates do **not** transfer their underlying media files to another store.
6. Assign the appropriate product templates in each destination product's Theme template setting (`cinnamon-berberine`, `garlic`, etc.).
7. Reconfigure checkout branding in **Settings > Checkout**. Shopify checkout configuration and app settings are separate from storefront theme source and **do not migrate** just by pushing theme files.
8. Test product variants, bundle options, checkout, subscriptions, shipping, mobile, and sticky add-to-cart; publish the destination copy only after verifying.

## Important portability limits

A theme repository backs up theme **code and theme editor content**, not Shopify's database. Product listings, orders, customers, uploaded images, metaobjects/metafields, pages/blog content, navigation data, app settings, subscriptions and checkout settings are **store-specific**. The theme can recreate layouts and custom blocks, but features that depend on apps/products/files must be reconnected.

### Security and publishing

This repository was already **public** when the export began. Do not commit storefront private keys, Admin API tokens, or customer/export data. Product claims, reviews and dietary directions are carried over as they appeared in the source theme and should be verified by the merchant before use.

## Source of truth

- GitHub: `ojgldkee/avonent-theme`
- Original source: live `horizon/main` on Avonent Shopify store (theme ID `197046730918`).
- Original source theme is **not changed** by this repository export.
