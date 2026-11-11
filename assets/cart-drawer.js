import { Component } from '@theme/component';
import { CartLinesUpdateEvent, StandardEvents } from '@shopify/events';
import { DrawerOpenEvent } from '@theme/theme-drawer';

/**
 * A custom element that manages cart drawer behavior within a `<theme-drawer>`.
 *
 * Dialog lifecycle (open/close, squeeze, history, animations) is owned by `<theme-drawer>`.
 * The `cart:view` event is auto-dispatched by `CartItemsComponent` via the
 * `view-event-trigger="dialog"` attribute (see `snippets/cart-items-component.liquid`).
 * Cart count announcements are owned by `<header-actions>`.
 * This component handles the remaining cart-specific concerns: auto-open on add-to-cart,
 * sticky summary layout, and the installments CTA close-on-click.
 *
 * @extends {Component}
 */
class CartDrawerComponent extends Component {
  /** @type {number} */
  #summaryThreshold = 0.5;

  /** @type {boolean} */
  #protectionMutationPending = false;

  /** @type {number} */
  #protectionVariantId = 0;

  static #protectionPreferenceKey = 'avonentShippingProtectionEnabled';

  /** @type {import('@theme/theme-drawer').ThemeDrawer | null} */
  get #themeDrawer() {
    return /** @type {import('@theme/theme-drawer').ThemeDrawer | null} */ (this.closest('theme-drawer'));
  }

  /** @type {HTMLDialogElement | null} */
  get #dialog() {
    return this.closest('dialog');
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(StandardEvents.cartLinesUpdate, this.#handleCartLinesUpdate);
    this.#themeDrawer?.addEventListener(DrawerOpenEvent.eventName, this.#handleDrawerOpen);
    this.addEventListener('click', this.#handleEnhancementClick);

    this.#protectionVariantId = Number(this.dataset.protectionVariantId || 0);

    if (this.#themeDrawer?.hasAttribute('open')) {
      this.#handleDrawerOpen();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#handleCartLinesUpdate);
    this.#themeDrawer?.removeEventListener(DrawerOpenEvent.eventName, this.#handleDrawerOpen);
    this.removeEventListener('click', this.#handleEnhancementClick);
  }

  #handleDrawerOpen = () => {
    this.#updateStickyState();

    customElements.whenDefined('shopify-payment-terms').then(() => {
      const cta = this.querySelector('shopify-payment-terms')?.shadowRoot?.querySelector('#shopify-installments-cta');
      cta?.addEventListener('click', () => this.#themeDrawer?.close(), { once: true });
    });
  };

  /**
   * @param {import('@shopify/events').CartLinesUpdateEvent} event
   */
  #handleCartLinesUpdate = (event) => {
    const shouldAutoOpen = this.hasAttribute('auto-open') && event.action === 'add' && !this.#themeDrawer?.isOpen;

    const sourceModal = /** @type {HTMLDialogElement | null} */ (
      event.target instanceof Element ? event.target.closest('dialog:modal') : null
    );

    if (shouldAutoOpen && !sourceModal && !this.#isCartEmpty()) {
      this.#themeDrawer?.open();
    }

    event.promise
      ?.then(({ detail }) => {
        const settle = () => requestAnimationFrame(() => this.#updateStickyState());
        const isProtectionUpdate = detail?.source === 'avonent-shipping-protection';

        if (!shouldAutoOpen || detail?.didError || isProtectionUpdate) {
          settle();
          return;
        }

        const openAndSettle = () => {
          if (!this.#themeDrawer?.isOpen) this.#themeDrawer?.open();
          settle();
        };

        if (sourceModal?.open) {
          sourceModal.addEventListener('close', openAndSettle, { once: true });
        } else {
          openAndSettle();
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[cart-drawer] Event promise rejected:', error);
      });
  };

  #handleEnhancementClick = (event) => {
    if (!(event.target instanceof Element)) return;

    const toggle = event.target.closest('[data-avonent-protection-toggle]');
    if (!(toggle instanceof HTMLButtonElement) || !this.contains(toggle)) return;

    const enabled = toggle.getAttribute('aria-checked') !== 'true';
    sessionStorage.setItem(CartDrawerComponent.#protectionPreferenceKey, enabled ? 'true' : 'false');
    this.#setShippingProtection(enabled);
  };

  async #setShippingProtection(enabled, knownLineKey = '') {
    if (!this.#protectionVariantId || this.#protectionMutationPending) return;

    const panel = this.querySelector('[data-avonent-protection]');
    const toggle = panel?.querySelector('[data-avonent-protection-toggle]');
    const lineKey = knownLineKey || panel?.dataset.lineKey || '';

    this.#protectionMutationPending = true;
    if (toggle instanceof HTMLButtonElement) {
      toggle.disabled = true;
      toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
    }

    const root = window.Shopify?.routes?.root || '/';
    const isExistingLine = Boolean(lineKey);
    const endpoint = enabled && !isExistingLine ? `${root}cart/add.js` : `${root}cart/change.js`;
    const body = enabled && !isExistingLine
      ? {
          items: [{ id: this.#protectionVariantId, quantity: 1 }],
          sections: 'cart-drawer-section',
          sections_url: window.location.pathname,
        }
      : {
          id: lineKey,
          quantity: enabled ? 1 : 0,
          sections: 'cart-drawer-section',
          sections_url: window.location.pathname,
        };

    if (!enabled && !lineKey) {
      this.#protectionMutationPending = false;
      if (toggle instanceof HTMLButtonElement) toggle.disabled = false;
      return;
    }

    const deferred = CartLinesUpdateEvent.createPromise();
    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action: enabled ? 'add' : 'remove',
        context: 'cart',
        lines: [
          {
            id: enabled ? String(this.#protectionVariantId) : lineKey,
            quantity: enabled ? 1 : 0,
          },
        ],
        promise: deferred.promise,
      })
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok || result.status || result.errors) {
        throw new Error(result.description || result.message || result.errors || 'Cart update failed');
      }

      const cartResponse = await fetch(`${root}cart.js`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const cart = await cartResponse.json();

      deferred.resolve({
        cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart),
        detail: {
          sections: result.sections || {},
          items: cart.items,
          itemCount: cart.item_count,
          source: 'avonent-shipping-protection',
          didError: false,
        },
      });
    } catch (error) {
      deferred.reject(error);
      if (toggle instanceof HTMLButtonElement) {
        toggle.setAttribute('aria-checked', enabled ? 'false' : 'true');
      }
      console.warn('[cart-drawer] Shipping protection update failed:', error);
    } finally {
      this.#protectionMutationPending = false;
      if (toggle instanceof HTMLButtonElement) toggle.disabled = false;
      requestAnimationFrame(() => this.#updateStickyState());
    }
  }

  #isCartEmpty() {
    return Boolean(this.querySelector('.cart-drawer--empty'));
  }

  #updateStickyState() {
    const dialog = this.#dialog;
    if (!dialog) return;

    const content = dialog.querySelector('.cart-drawer__content');
    const summary = dialog.querySelector('.cart-drawer__summary');

    if (!content || !summary) {
      dialog.setAttribute('cart-summary-sticky', 'false');
      return;
    }

    const drawerHeight = dialog.getBoundingClientRect().height;
    const summaryHeight = summary.getBoundingClientRect().height;
    const ratio = summaryHeight / drawerHeight;
    dialog.setAttribute('cart-summary-sticky', ratio > this.#summaryThreshold ? 'false' : 'true');
  }
}

if (!customElements.get('cart-drawer-component')) {
  customElements.define('cart-drawer-component', CartDrawerComponent);
}
