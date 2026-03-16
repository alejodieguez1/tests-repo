# Shopify Theme — Featured Products

This was built and tested on a Shopify dev store with mock products.

For the product carousel, I went with a custom Web Component that uses CSS `scroll-snap` for smooth native scrolling and touch support. The progress bar at the bottom tracks the scroll position and supports drag-to-scrub — all done in plain JavaScript, as requested.

Product labels (the discount and featured tags) are set up inside of product metafields, this makes them easy to manage from the Shopify admin.

There are a few extra files in the repo because I built this from an existing theme to move faster. The featured products section and everything it depends on are built specifically for this task.

[Store URL](https://alejos-test-store-2.myshopify.com/)

Password: taotwe
