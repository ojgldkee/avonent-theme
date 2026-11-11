# Editing Avonent in Shopify — without editing theme files

The Cinnamon product's template is `product.cinnamon-berberine.json`. It includes the source page's **Product page** section, preserving its current hero, offer, benefits, image sliders, comparison, guarantees, reviews, science, FAQ and other content. The page continues to use the original design and content from the repository snapshot.

## Use Shopify's visual editor

1. Go to **Online Store → Themes → Customize** for this new theme.
2. Select **Products → cinnamon-berberine** in the page dropdown, and make sure the relevant product is assigned that template.
3. Open **Product page** and change its existing blocks: **Hero**, **Results**, **Carousel**, **Science**, **Timeline**, **Comparison**, **Benefits**, **Reasons**, **Guarantee**, **FAQ**, **Details**, **Image** and **Review**.
4. For a completely independent, moveable section click **Add section**. Reusable short-named sections available include **Image**, **Image with text**, and **Text**, plus existing sections such as **FAQ**, **Product list**, **Slideshow**, **Carousel**, and more.
5. Drag, duplicate, hide or delete the independent sections as you like. Choose images using Shopify image pickers; don't edit Liquid to change them.

**Important limitation:** The original Cinnamon page's content blocks are embedded in a single large legacy section. They can be edited individually, but the legacy content areas are not all independent Shopify sections that can be freely reordered. The three generic reusable sections are fully independent. Converting *every* legacy content area into its own reorderable section would require a more extensive refactor.

## Subscriptions

The Cinnamon page has its own purchase-mode and bundle design. It reads the product variant's first Shopify `selling_plan_allocation`. When a plan exists, **Subscribe & Save is the initial selection**, and prices come from the selling-plan allocation rather than static theme numbers. Without a plan, it falls back to one-time purchase instead of attempting an invalid subscription.

To enable subscriptions:
1. Install Appstle Subscriptions (or a compatible selling-plan app).
2. Create and activate a plan for the Cinnamon product, with an **every 30 days** option and the desired price or discount.
3. In the theme's **App embeds**, turn on Appstle if required, and save. The native selling-plan data is supplied by Shopify; this theme's custom bundle selector does not require Appstle's separate widget to be displayed.
4. Test the first selling-plan allocation, each bundle size, checkout and future recurring orders. If you also enable Appstle's separate subscription widget on this page, avoid displaying two competing purchase-mode selectors.
5. Review the 1 / 2 / 3-bottle gift mechanics, the separate bonus product/variant IDs, shipping discounts, and digital gift (if any). Those are *not* created by the theme and require their own product and discount setup.

The order quantities in the Cinnamon bundle cards reflect **paid units** (1, 2, or 3). The first-order bonus items for bigger bundles use a separate product/variant and merchant-configured discounts. The theme doesn't guarantee free items or shipping merely because it displays a badge.

## Download a Shopify-ready ZIP

A GitHub **Actions → Build Shopify theme ZIP** workflow packages only the eight Shopify theme folders: `assets`, `blocks`, `config`, `layout`, `locales`, `sections`, `snippets` and `templates`. Download its `avonent-shopify-theme` artifact, extract the outer workflow-artifact ZIP, and upload the **inner `avonent-theme.zip`** through **Online Store → Themes → Add theme → Upload zip file**.

Do not upload GitHub's raw **Code → Download ZIP** as the Shopify theme itself: it also contains documentation, media backups, workflow files and a GitHub parent folder.

Media under `media/` is a backup archive, not a theme asset folder. Reconnect Shopify Files and product media on a destination store. See `docs/MIGRATION.md`.
