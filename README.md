# Shopify Theme Platter Test Project

This project was built and tested on a Shopify dev store populated with mock products coming directly from Shopify.

The trickiest part of the build was the product gallery carousel. Swiper doesn’t ship with the exact “thumb slide bar” behavior needed for the designs, so I had to implement that logic myself on top of Swiper to get the thumbnail bar to behave correctly. In case you're using the browser resize function from the DEV Tools and the carousel does not work please quit the dev tools and reload the site(swiper's fault)

For the product item cards, I used metafields to drive the **discount label** and **featured label**. It’s a simple and flexible way to handle those flags, and it gives the “client” an easy place in Shopify to manage that data without touching code.

You’ll notice the repo has more files than strictly necessary for this exercise. I pulled this from my other projects to move faster, so a couple areas could use a bit of polishing/cleanup — but everything is working well, and I think the result stays really loyal to the original designs.

[Store URL](https://alejos-test-store-2.myshopify.com/)

Password is: taotwe
