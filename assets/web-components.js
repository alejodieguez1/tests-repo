/*
Site Header
*/

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.toggle = this.querySelector(".menu-toggle");
    this.header = this.querySelector(".site-header");
    this.menu = this.querySelector(".menu");
    this.scroll = false;

    this.toggle.addEventListener("click", (e) => {
      if (this.menu.classList.contains("active")) {
        this.closeMenu();
      } else {
        this.openMenu();
      }
    });

    this.lastScrollTop = 0;

    window.addEventListener("scroll", () => {
      const st = document.documentElement.scrollTop || window.pageYOffset;
      if (st > 50) {
        this.header.classList.add("scrolled");
        this.scroll = true;
      } else {
        this.header.classList.remove("scrolled");
        this.scroll = false;
      }
    });
  }

  openMenu() {
    this.menu.classList.add("active");
    this.toggle.classList.add("active");
    this.header.classList.add("active");
    document.querySelector("body").style.overflow = "hidden";
  }

  closeMenu() {
    this.menu.classList.remove("active");
    this.toggle.classList.remove("active");
    this.header.classList.remove("active");
    document.querySelector("body").style.overflow = "auto";
  }
}

customElements.define("site-header", SiteHeader);

/*
Carousel Prev
*/

class CarouselPrev extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.querySelector("button")) {
      console.warn("You need to have a child button to go to previous!");
    }
    this.addEventListener("click", (e) => {
      const carousel = e.target.closest("site-carousel");

      if (carousel) {
        carousel.previous();
      } else {
        console.error("<carousel-prev> needs to be a child of <site-carousel>");
      }
    });
  }
}

customElements.define("carousel-prev", CarouselPrev);

/*
Carousel Next
*/

class CarouselNext extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.querySelector("button")) {
      console.warn("You need to have a child button to go to next!");
    }

    this.addEventListener("click", (e) => {
      const carousel = e.target.closest("site-carousel");
      if (carousel) {
        carousel.next();
      } else {
        console.error("<carousel-next> needs to be a child of <site-carousel>");
      }
    });
  }
}

customElements.define("carousel-next", CarouselNext);

/*
Carousel Pager
*/

class CarouselPager extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const pagerButtons = Array.from(this.querySelectorAll("button"));

    if (!pagerButtons.length > 1) {
      console.warn("No need for a pager with only one item!");
    } else {
      pagerButtons[0].classList.add("active");
    }

    pagerButtons.forEach((pager, i) => {
      pager.addEventListener("click", (e) => {
        const carousel = e.target.closest("site-carousel");

        if (carousel) {
          carousel.slideTo(i);
        } else {
          console.error(
            "<carousel-pager> needs to be a child of <site-carousel>",
          );
        }
      });
    });
  }
}

customElements.define("carousel-pager", CarouselPager);

/*
 * Site Carousel
 */

class SiteCarousel extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
    this._progressUpdate = null;
    this._progressWindowResize = null;
    this._progressDragCleanup = null;
  }

  connectedCallback() {
    const rawConfig = this.dataset.config
      ? JSON.parse(this.dataset.config)
      : { slidesPerView: 1, spaceBetween: 20, loop: true };

    let config = { ...rawConfig };

    const paginationEl = this.querySelector(".swiper-pagination");
    const trackEl = this.querySelector("[data-carousel-track]");
    const thumbEl = this.querySelector("[data-carousel-thumb]");
    const hasNavEls = this.querySelector(
      "carousel-prev button, carousel-next button",
    );
    const hasPagerEls = this.querySelector("carousel-pager");

    const isEnabled = (attrName, fallback) => {
      const val = this.getAttribute(attrName);
      if (val === null) return fallback;
      return val === "true";
    };

    const enablePagination = isEnabled(
      "data-enable-pagination",
      !!paginationEl,
    );
    const enableNav = isEnabled("data-enable-nav", !!hasNavEls);
    const enablePager = isEnabled("data-enable-pager", !!hasPagerEls);
    const enableProgress = isEnabled(
      "data-enable-progress",
      !!(trackEl && thumbEl),
    );
    const enableProgressDrag = isEnabled("data-enable-progress-drag", false);

    if (enablePagination && paginationEl) {
      const paginationConfig =
        typeof config.pagination === "object" ? config.pagination : {};
      config.pagination = {
        ...paginationConfig,
        el: paginationEl,
        clickable:
          typeof paginationConfig.clickable === "boolean"
            ? paginationConfig.clickable
            : true,
        bulletClass: paginationConfig.bulletClass || "pager",
        bulletActiveClass: paginationConfig.bulletActiveClass || "active",
      };
    } else {
      delete config.pagination;
    }

    this.swiper = new Swiper(`#${this.dataset.id} .swiper`, config);

    if (enablePager) this.handleSlideChange();
    if (enableNav) this.updateNavButtons();
    if (enableProgress)
      this.setupProgressBar({ enableDrag: enableProgressDrag });

    this.classList.remove("opacity-0");
  }

  disconnectedCallback() {
    if (!this.swiper) return;
    if (this._progressUpdate) {
      this.swiper.off("slideChange", this._progressUpdate);
      this.swiper.off("setTranslate", this._progressUpdate);
      this.swiper.off("resize", this._progressUpdate);
    }
    if (this._progressWindowResize) {
      window.removeEventListener("resize", this._progressWindowResize);
    }
    if (this._progressDragCleanup) {
      this._progressDragCleanup();
      this._progressDragCleanup = null;
    }
  }

  previous() {
    if (this.swiper) {
      this.swiper.slidePrev();
    }
  }

  next() {
    if (this.swiper) {
      this.swiper.slideNext();
    }
  }

  slideTo(i) {
    if (this.swiper) {
      this.swiper.slideTo(i);
    }
  }

  setupProgressBar({ enableDrag = false } = {}) {
    const track = this.querySelector("[data-carousel-track]");
    const thumb = this.querySelector("[data-carousel-thumb]");
    if (!this.swiper || !track || !thumb) return;

    const clamp01 = (n) => Math.max(0, Math.min(1, n));

    const getMetrics = () => {
      const trackW = track.clientWidth;
      const total = this.swiper.slides.length;

      let spv = this.swiper.params.slidesPerView;
      if (spv === "auto") spv = this.swiper.slidesPerViewDynamic();
      spv = Number(spv) || 1;

      return { trackW, total, spv };
    };

    const update = () => {
      const { trackW, total, spv } = getMetrics();
      const thumbW = Math.max(24, trackW * Math.min(1, spv / total));
      thumb.style.width = `${thumbW}px`;

      const maxX = Math.max(0, trackW - thumbW);
      const minT = this.swiper.minTranslate ? this.swiper.minTranslate() : 0;
      const maxT = this.swiper.maxTranslate ? this.swiper.maxTranslate() : 0;
      const denom = maxT - minT;
      const progress =
        denom === 0 ? 0 : clamp01((this.swiper.translate - minT) / denom);
      const x = maxX * progress;

      thumb.style.transform = `translate3d(${x}px,0,0)`;
    };

    this._progressUpdate = update;
    this._progressWindowResize = update;

    update();
    this.swiper.on("slideChange", update);
    this.swiper.on("setTranslate", update);
    this.swiper.on("progress", update);
    this.swiper.on("touchMove", update);
    this.swiper.on("resize", update);
    window.addEventListener("resize", update);

    if (enableDrag) {
      let dragging = false;
      const onPointerDown = (e) => {
        if (!this.swiper) return;
        dragging = true;
        track.setPointerCapture?.(e.pointerId);
        onPointerMove(e);
      };
      const onPointerMove = (e) => {
        if (!dragging || !this.swiper) return;
        const { trackW, total, spv } = getMetrics();
        const maxIndex = Math.max(0, total - Math.ceil(spv));
        if (maxIndex === 0 || trackW <= 0) return;

        const rect = track.getBoundingClientRect();
        const p = clamp01((e.clientX - rect.left) / trackW);
        const idx = Math.round(p * maxIndex);
        this.swiper.slideTo(idx, 0);
      };
      const onPointerUp = () => {
        dragging = false;
      };

      track.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);

      this._progressDragCleanup = () => {
        track.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
    }
  }

  handleSlideChange() {
    const pagers = Array.from(this.querySelectorAll("carousel-pager"));

    if (this.swiper) {
      this.swiper.on("slideChange", () => {
        pagers.forEach((pager) => {
          const buttons = Array.from(pager.querySelectorAll("button"));
          const nextPager = buttons[this.swiper.realIndex];

          buttons.forEach((button) => button.classList.remove("active"));
          if (nextPager) nextPager.classList.add("active");
        });

        this.updateNavButtons();
      });
    }
  }

  updateNavButtons() {
    const prevButtons = this.querySelectorAll("carousel-prev button");
    const nextButtons = this.querySelectorAll("carousel-next button");

    if (!this.swiper || this.swiper.params.loop) return;

    const isBeginning = this.swiper.isBeginning;
    const isEnd = this.swiper.isEnd;

    prevButtons.forEach((btn) => (btn.disabled = isBeginning));
    nextButtons.forEach((btn) => (btn.disabled = isEnd));
  }
}

customElements.define("site-carousel", SiteCarousel);

/*
Site Video
*/

class SiteVideo extends HTMLElement {
  connectedCallback() {
    this.playBtn = this.querySelector(".play-button-js");
    this.video = this.querySelector("video");

    if (this.playBtn) {
      this.playBtn.addEventListener("click", () => {
        this.pauseOtherVideos();
        this.video.play();
      });

      this.video.addEventListener("click", () => {
        this.pauseOtherVideos();
        if (this.video.paused) {
          this.video.play();
        } else {
          this.video.pause();
        }
      });

      this.video.addEventListener("ended", () => {
        this.playBtn.classList.remove("hidden");
      });

      this.video.addEventListener("pause", () => {
        this.playBtn.classList.remove("hidden");
      });

      this.video.addEventListener("play", () => {
        this.playBtn.classList.add("hidden");
      });
    }

    if (this.dataset.stopOnObserve === "true") {
      this.stopOnObserve();
    } else {
      this.loadOnObserve();
    }
  }

  pauseOtherVideos() {
    document.querySelectorAll("site-video").forEach((videoComponent) => {
      const video = videoComponent.querySelector("video");
      if (video !== this.video && !video.paused) {
        video.pause();
      }
    });
  }

  stopOnObserve() {
    if ("IntersectionObserver" in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!entry.isIntersecting) {
            video.pause();
          }
        });
      });

      videoObserver.observe(this.querySelector("video"));
    }
  }

  loadOnObserve() {
    if ("IntersectionObserver" in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (video.readyState !== 4) {
              [].slice
                .call(video.querySelectorAll("source"))
                .forEach((source) => {
                  if (source.dataset.src) {
                    source.src = source.dataset.src;
                  }
                });
              video.load();
            }
          }
        });
      });

      videoObserver.observe(this.querySelector("video"));
    }
  }
}

customElements.define("site-video", SiteVideo);

/*
Accordion Item
*/

class AccordionItem extends HTMLElement {
  constructor() {
    super();
    this.details = null;
    this.content = null;
  }

  connectedCallback() {
    this.icon = this.querySelector("svg");
    this.details = this.querySelector("details");
    this.content = this.querySelector(".content");
    this.details.addEventListener("click", (e) => {
      e.preventDefault();
      this.animateHeight();
    });
  }

  animateHeight() {
    if (this.details.open) {
      this.icon.style.transform = "rotate(0deg)";
      this.content.style.maxHeight = "0px";
      setTimeout(() => {
        this.details.open = false;
      }, 300);
    } else {
      this.icon.style.transform = "rotate(180deg)";
      this.details.open = true;
      this.content.style.maxHeight = this.content.scrollHeight + "px";
    }
  }
}

customElements.define("accordion-item", AccordionItem);

/*
Cart Toggle
*/

class CartToggle extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.querySelector("button")) {
      console.warn("Cart toggle component should have a button as a child!");
    }

    this.addEventListener("click", (e) => {
      const cart = document.querySelector("site-cart");
      if (cart) {
        cart.toggleCart();
      }
    });
  }
}

customElements.define("cart-toggle", CartToggle);

/*
Cart Add
*/

class CartAdd extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const $id = e.target.querySelector('[name="id"]');
      const $qty = e.target.querySelector('[name="quantity"]');
      const $sellingPlan = e.target.querySelector('[name="selling_plan"]');
      const qty = $qty ? $qty.value : 1;
      const sellingPlan =
        $sellingPlan && !!$sellingPlan.value ? $sellingPlan.value : null;

      if ($id) {
        const cart = document.querySelector("site-cart");
        if (cart) {
          await cart.addVariantToCart($id.value, qty, sellingPlan);
          console.log(`Added ${$id.value} to cart with quantity ${qty}`);
        }
      }
    });
  }
}

customElements.define("cart-add", CartAdd);

/*
Update Quantity
*/

class UpdateQuantity extends HTMLElement {
  constructor() {
    super();
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  connectedCallback() {
    this.addEventListener(
      "click",
      this.debounce(async (e) => {
        const cart = document.querySelector("site-cart");
        const idx = this.dataset.index;
        const ctx = this.dataset.ctx;
        const val =
          this.parentElement.querySelector(".curr-quantity").innerHTML;
        const nextVal = ctx === "increment" ? Number(val) + 1 : Number(val) - 1;

        if (cart) {
          await cart.updateQuantity(idx, nextVal);
        }
      }, 300),
    );
  }
}

customElements.define("update-quantity", UpdateQuantity);

/*
Cart Remove
*/

class CartRemove extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener("click", async (e) => {
      e.preventDefault();

      const cart = document.querySelector("site-cart");
      const idx = this.dataset.index;

      if (cart) {
        await cart.updateQuantity(idx, 0);
      }
    });
  }
}

customElements.define("cart-remove", CartRemove);

class NumberInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this)),
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    const button = event.target.closest("button");

    if (button) {
      button.name === "increment" ? this.input.stepUp() : this.input.stepDown();

      if (previousValue !== this.input.value) {
        this.input.dispatchEvent(this.changeEvent);
      }
    }
  }
}

customElements.define("number-input", NumberInput);

/*
  Site Cart
*/

class SiteCart extends HTMLElement {
  constructor() {
    super();
    this.cart = null;
  }

  connectedCallback() {
    this.cart = document.querySelector(".site-cart");
  }

  openCart() {
    if (this.cart) {
      this.cart.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  closeCart() {
    if (this.cart) {
      this.cart.classList.remove("active");
      document.body.removeAttribute("style");
    }
  }

  toggleCart() {
    if (this.cart.classList.contains("active")) {
      this.closeCart();
    } else {
      this.openCart();
    }
  }

  getCartSections() {
    return [
      {
        section: "main-cart-items",
        selector: "#main-cart-items",
      },
      {
        section: "main-cart-footer",
        selector: "#main-cart-footer",
      },
      {
        section: "main-cart-header",
        selector: "#main-cart-header",
      },
      {
        section: "site-header",
        selector: "#header",
      },
    ];
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  renderCartSections(sections) {
    const getSections = this.getCartSections();
    const sectionsArr = Object.keys(sections);

    sectionsArr.forEach((sectionKey) => {
      const activeSection = getSections.find((s) => s.section === sectionKey);
      const elToReplace = document.querySelector(activeSection.selector);
      if (elToReplace) {
        const html = this.getSectionInnerHTML(
          sections[sectionKey],
          activeSection.selector,
        );
        elToReplace.innerHTML = html;
      }
    });
  }

  buildConfig(body) {
    return {
      body: body,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: `application/json`,
      },
    };
  }

  addVariantToCart(id, quantity = 1, options) {
    const items = [options ? { id, quantity, ...options } : { id, quantity }];
    const sections = this.getCartSections().map((s) => s.section);
    const body = JSON.stringify({ items, sections });
    const config = this.buildConfig(body);

    if (!this.cart.classList.contains("active")) {
      this.toggleCart();
    }

    return fetch(`/cart/add`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.handleErrorMessage(response.description);
          return;
        }
        this.renderCartSections(response.sections);
      })
      .catch((e) => {
        // handle error
      });
  }

  updateQuantity(line, quantity) {
    const sections = this.getCartSections().map((s) => s.section);
    const body = JSON.stringify({ line, quantity, sections });
    const config = this.buildConfig(body);

    return fetch("/cart/change", config)
      .then((response) => response.json())
      .then((response) => {
        this.renderCartSections(response.sections);
      })
      .catch(() => {
        // handle error
      });
  }

  updateCart(updates) {
    const sections = this.getCartSections().map((s) => s.section);
    const body = JSON.stringify({ updates, sections });
    const config = this.buildConfig(body);

    return fetch("/cart/update", config)
      .then((response) => response.json())
      .then((response) => {
        this.renderCartSections(response.sections);
        this.handleRewards();
      })
      .catch(() => {
        // handle error
      });
  }
}

customElements.define("site-cart", SiteCart);

/* Product Quantity Selector */

class ProductQuantitySelector extends HTMLElement {
  connectedCallback() {
    this.quantityResult = this.querySelector(".quantity-js");
    const quantityMinus = this.querySelector(".quantity-minus-js");
    const quantityPlus = this.querySelector(".quantity-plus-js");
    const cartAdd = this.closest("cart-add");

    quantityMinus.addEventListener("click", () => {
      if (parseInt(this.quantityResult.textContent) > 1) {
        this.quantityResult.textContent =
          parseInt(this.quantityResult.textContent) - 1;
      }
      if (cartAdd) {
        const quant = cartAdd.querySelector('[name="quantity"]');
        if (quant) {
          quant.value = parseInt(this.quantityResult.textContent);
        }
      }
    });

    quantityPlus.addEventListener("click", () => {
      this.quantityResult.textContent =
        parseInt(this.quantityResult.textContent) + 1;

      if (cartAdd) {
        const quant = cartAdd.querySelector('[name="quantity"]');
        if (quant) {
          quant.value = parseInt(this.quantityResult.textContent);
        }
      }
    });
  }
}

customElements.define("product-quantity-selector", ProductQuantitySelector);

class CountdownTimer extends HTMLElement {
  connectedCallback() {
    const endDateStr = this.getAttribute("data-end-date");
    console.log(endDateStr);

    if (!endDateStr) return;
    const endDate = new Date(endDateStr);

    const daysEl = this.querySelector('[data-role="days"]');
    const hoursEl = this.querySelector('[data-role="hours"]');
    const minutesEl = this.querySelector('[data-role="minutes"]');
    const secondsEl = this.querySelector('[data-role="seconds"]');

    const update = () => {
      const now = new Date();
      const diff = endDate - now;

      if (diff <= 0) {
        this.innerHTML = `<div class="text-xl font-bold text-center">GIVEAWAY ENDED</div>`;
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      daysEl.textContent = String(days).padStart(2, "0");
      hoursEl.textContent = String(hours).padStart(2, "0");
      minutesEl.textContent = String(minutes).padStart(2, "0");
      secondsEl.textContent = String(seconds).padStart(2, "0");
    };

    update();
    const interval = setInterval(update, 1000);
  }
}

customElements.define("countdown-timer", CountdownTimer);

class FeaturedProductsMobile extends HTMLElement {
  constructor() {
    super();
    this.extra = null;
    this.toggle = null;
    this.label = null;
    this.onToggleClick = this.onToggleClick.bind(this);
    this.onTransitionEnd = this.onTransitionEnd.bind(this);
  }

  connectedCallback() {
    this.extra = this.querySelector("[data-fp-extra]");
    this.toggle = this.querySelector("[data-fp-toggle]");
    this.label = this.querySelector("[data-fp-toggle-label]");

    if (!this.extra || !this.toggle || !this.label) return;

    this.classList.remove("is-open");
    this.label.textContent = "Show More";
    this.toggle.setAttribute("aria-expanded", "false");

    this.toggle.addEventListener("click", this.onToggleClick);
    this.extra.addEventListener("transitionend", this.onTransitionEnd);
  }

  disconnectedCallback() {
    if (this.toggle)
      this.toggle.removeEventListener("click", this.onToggleClick);
    if (this.extra)
      this.extra.removeEventListener("transitionend", this.onTransitionEnd);
  }

  setOpen(open) {
    if (!this.extra || !this.toggle || !this.label) return;

    this.classList.toggle("is-open", open);
    this.label.textContent = open ? "Show Less" : "Show More";
    this.toggle.setAttribute("aria-expanded", String(open));

    if (open) {
      this.extra.style.height = this.extra.scrollHeight + "px";
    } else {
      if (this.extra.style.height === "auto")
        this.extra.style.height = this.extra.scrollHeight + "px";
      void this.extra.offsetHeight;
      this.extra.style.height = "0px";
    }
  }

  onTransitionEnd(e) {
    if (e.propertyName !== "height") return;
    if (this.classList.contains("is-open")) {
      this.extra.style.height = "auto";
    }
  }

  onToggleClick() {
    const isOpen = this.classList.contains("is-open");
    if (!isOpen) {
      this.extra.style.height = "0px";
      requestAnimationFrame(() => this.setOpen(true));
    } else {
      this.setOpen(false);
    }
  }
}

customElements.define("featured-products-mobile", FeaturedProductsMobile);

class ProductsCarousel extends HTMLElement {
  constructor() {
    super();
    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
    this.dragCleanup = null;
    this.containerDragCleanup = null;
    this._ticking = false;
  }

  connectedCallback() {
    this.container = this.querySelector("[data-scroll-container]");
    this.track = this.querySelector("[data-carousel-track]");
    this.thumb = this.querySelector("[data-carousel-thumb]");

    if (!this.container || !this.track || !this.thumb) return;

    this.container.addEventListener("scroll", this.onScroll, {
      passive: true,
    });
    this.container.addEventListener("dragstart", (e) => e.preventDefault());
    window.addEventListener("resize", this.onResize);

    this.updateProgress();
    this.setupDrag();
    this.setupContainerDrag();
    this.setupWheelScroll();
  }

  disconnectedCallback() {
    if (this.container)
      this.container.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    if (this.dragCleanup) {
      this.dragCleanup();
      this.dragCleanup = null;
    }
    if (this.containerDragCleanup) {
      this.containerDragCleanup();
      this.containerDragCleanup = null;
    }
    if (this.wheelHandler) {
      this.container.removeEventListener("wheel", this.wheelHandler);
    }
  }

  onScroll() {
    if (!this._ticking) {
      requestAnimationFrame(() => {
        this.updateProgress();
        this._ticking = false;
      });
      this._ticking = true;
    }
  }

  onResize() {
    this.updateProgress();
  }

  updateProgress() {
    const { scrollLeft, scrollWidth, clientWidth } = this.container;
    const trackW = this.track.clientWidth;
    const ratio = clientWidth / scrollWidth;
    const thumbW = Math.max(24, trackW * Math.min(1, ratio));
    this.thumb.style.width = thumbW + "px";

    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const maxX = Math.max(0, trackW - thumbW);
    this.thumb.style.transform = "translate3d(" + maxX * progress + "px,0,0)";
  }

  setupDrag() {
    let dragging = false;
    let dragOffset = 0;

    const getMetrics = () => {
      const trackW = this.track.clientWidth;
      const { scrollWidth, clientWidth } = this.container;
      const ratio = clientWidth / scrollWidth;
      const thumbW = Math.max(24, trackW * Math.min(1, ratio));
      const maxX = Math.max(0, trackW - thumbW);
      const maxScroll = scrollWidth - clientWidth;
      return { thumbW, maxX, maxScroll };
    };

    const scrubTo = (e) => {
      const rect = this.track.getBoundingClientRect();
      const { maxX, maxScroll } = getMetrics();
      if (maxX <= 0 || maxScroll <= 0) return;
      const thumbLeft = e.clientX - rect.left - dragOffset;
      const p = Math.max(0, Math.min(1, thumbLeft / maxX));
      this.container.scrollLeft = p * maxScroll;
    };

    const onPointerDown = (e) => {
      dragging = true;
      this.track.setPointerCapture?.(e.pointerId);
      this.track.classList.add("is-active");

      const rect = this.track.getBoundingClientRect();
      const { thumbW, maxX, maxScroll } = getMetrics();
      const progress =
        maxScroll > 0 ? this.container.scrollLeft / maxScroll : 0;
      const thumbLeft = maxX * progress;
      const clickX = e.clientX - rect.left;

      if (clickX >= thumbLeft && clickX <= thumbLeft + thumbW) {
        dragOffset = clickX - thumbLeft;
      } else {
        dragOffset = thumbW / 2;
        scrubTo(e);
      }
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      scrubTo(e);
    };

    const onPointerUp = () => {
      dragging = false;
      this.track.classList.remove("is-active");
    };

    this.track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    this.dragCleanup = () => {
      this.track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }

  setupContainerDrag() {
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      scrollStart = this.container.scrollLeft;
      this.container.style.userSelect = "none";
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) hasMoved = true;
      if (hasMoved) {
        e.preventDefault();
        this.container.scrollLeft = scrollStart - dx;
      }
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      this.container.style.userSelect = "";
    };

    const onClick = (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    this.container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    this.container.addEventListener("click", onClick, true);

    this.containerDragCleanup = () => {
      this.container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      this.container.removeEventListener("click", onClick, true);
    };
  }

  setupWheelScroll() {
    this.wheelHandler = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const { scrollLeft, scrollWidth, clientWidth } = this.container;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) return;

      const atStart = scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = scrollLeft >= maxScroll - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;

      e.preventDefault();
      this.container.scrollLeft += e.deltaY;
    };
    this.container.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });
  }
}

customElements.define("products-carousel", ProductsCarousel);
