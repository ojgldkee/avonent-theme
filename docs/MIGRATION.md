# Move Avonent Theme to another Shopify store

This project stores **the entire Avonent theme source**, copied from the live `horizon/main` theme on 2026-11-04. It is not just a lookalike or a single landing-page HTML export.

## What survives the move

The theme includes the exact code and saved section settings for its Cinnamon Berberine page, Garlic page, homepage, other landing pages, product gallery behavior, sticky add-to-cart, announcement bar, footer, and full theme editor blocks. The original templates are under `templates/`; reusable components are under `sections/`, `blocks/`, and `snippets/`.

## 1. Back up the images

The source theme referred to **70** uploaded Shopify Files images, plus **3** separately hardcoded Avonent images, in `backups/theme-media-manifest.json`. These are not included when Shopify exports only its theme.

The GitHub workflow **Back up referenced Avonent theme images** downloads the files from public Shopify CDN links and commits them to `media/theme/` and `media/embedded/`. Open **Actions** to see whether it completed successfully. If not, use **Run workflow** while the source images remain accessible.

The source theme also contained several absolute Shopify CDN links. Three brand-owned images are backed up under `media/embedded/`, but hardcoded URLs in Liquid may need to be replaced or reselected after changing stores. Other Shopify framework URLs should remain as-is. Product media assigned to products and other store data are handled separately; this script does not archive an entire Shopify database.

## 2. Install theme on new store

Run Shopify CLI after authenticating with the destination store:

```bash
git clone https://github.com/ojgldkee/avonent-theme.git
cd avonent-theme
shopify theme push --store YOUR-NEW-STORE.myshopify.com --unpublished
```

Do not overwrite the existing destination store theme until you've tested this unpublished version.

## 3. Restore landing-page images

Create a Shopify custom app in the destination store with the **write_files** permission, install it, and securely set its Admin API token as an environment variable. Do not commit the token to GitHub.

```bash
node scripts/import-theme-media.mjs --store YOUR-NEW-STORE.myshopify.com
# After confirming the dry run and setting SHOPIFY_ADMIN_ACCESS_TOKEN in your environment:
node scripts/import-theme-media.mjs --store YOUR-NEW-STORE.myshopify.com --apply
```

By default this imports your version-controlled media from the **public GitHub repository**. If the GitHub media backup isn't finished and the original Shopify store is still accessible, use `--source shopify` instead.

The importer skips filenames already in the new store, uses non-destructive duplicate rules, and processes media through Shopify's Files API. Shopify may take time to process the uploaded images.

## 4. Reconnect store-specific content

Shopify theme files do **not** contain the actual product catalog, collection database, pages' stored text outside theme templates, customer records, navigation menu definitions, orders, app subscriptions, metafield/metaobject definitions, or checkout configuration.

1. Recreate/import products and variants, collections, pages, menus, and other business data in the new store.
2. Assign the theme templates to the appropriate products and pages. Look for `product.cinnamon-berberine.json`, `product.garlic.json`, `product.avonent.json`, and the custom page templates.
3. Reconnect apps, subscription selling plans, bundles, custom metafields, metaobjects, and any app blocks.
4. In **Online Store > Themes > Customize**, check that all image picker settings resolve to the imported files. If not, select the newly imported image. Filename matches may not automatically reconnect all Shopify file IDs.
5. Adjust logo, announcement bar, brand colors, links, footer legal text, and shipping estimates for the destination brand.
6. Set up checkout separately in **Settings > Checkout**; the theme cannot transport checkout configurations or Plus-only checkout modifications.
7. Test quantity selectors, mobile gallery scrolling, variant selection, add-to-cart, subscription pricing, cart drawer, shipping thresholds, discounts, and payment flow before publishing.

## 5. Keep the theme updated

Changes made only in Shopify's theme editor won't automatically land in this repository. Pull or export the current theme and commit updates to GitHub after you modify it, or use Shopify's GitHub theme integration to keep the chosen theme branch synchronized. Keep separate branches for different stores so one store's image selections, prices and landing-page copy do not silently overwrite another.

**Important:** This repository is currently public. Avoid committing secrets, customer data, or private media. Its storefront theme code remains independent of your Shopify store's checkout, backend, and product database.
