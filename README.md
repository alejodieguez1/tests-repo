# Shopify Theme — Featured Products

This was built and tested on a Shopify dev store with mock products.

For the product carousel, I went with a custom Web Component that leverages CSS `scroll-snap` for smooth native scrolling and touch support. The progress bar at the bottom tracks the scroll position and supports drag-to-scrub — all plain JavaScript, no libraries.

Product labels (the discount and featured tags) are driven by metafields, which keeps them easy to manage from the Shopify admin.

There are a few extra files in the repo beyond what's needed for this exercise — I scaffolded this from an existing theme base to move faster. The featured products section and everything it depends on are built specifically for this task.

[Store URL](https://alejos-test-store-2.myshopify.com/)

Password: taotwe
