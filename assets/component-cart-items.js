import { Component } from '@theme/component';
import {
  fetchConfig,
  debounce,
  onAnimationEnd,
  prefersReducedMotion,
  resetShimmer,
  startViewTransition,
} from '@theme/utilities';
import { morphSection, sectionRenderer } from '@theme/section-renderer';
import { ThemeEvents, QuantitySelectorUpdateEvent } from '@theme/events';
import { cartPerformance } from '@theme/performance';
import {
  createViewEventElement,
  CartErrorEvent,
  CartDiscountUpdateEvent,
  CartLinesUpdateEvent,
  CartNoteUpdateEvent,
  StandardEvents,
} from '@shopify/events';

/** @typedef {import('./utilities').TextComponent} TextComponent */

/**
 * A custom element that displays a cart items component.
 *
 * @typedef {object} Refs
 * @property {HTMLElement[]} quantitySelectors - The quantity selector elements.
 * @property {HTMLTableRowElement[]} cartItemRows - The cart item rows.
 * @property {TextComponent} cartTotal - The cart total.
 *
 * @extends {Component<Refs>}
 */
export class CartItemsComponent extends createViewEventElement(Component) {
  #debouncedOnChange = debounce(
    /** @param {Event} event */
    (event) => {
      if (event instanceof QuantitySelectorUpdateEvent) this.#onQuantityChange(event);
    },
    300
  );
  /** @type {Promise<any> | null} */
  #pendingCartFetch = null;
  #walnutQuantityPending = false;

  /**
   * True when the event was dispatched from outside this cart-items-component (e.g.
   * `Shopify.actions.updateCart(...)` from an external app, or the SFAPI default
   * handler). Internal dispatchers (cart-discount-component, cart-note) live inside
   * `this` and either morph the section themselves or don't need a refresh — running
   * a fallback render in that case double-renders and can clobber form state.
   * @param {Event} event
   */
  #isExternalCartUpdate(event) {
    return !(event.target instanceof Node) || !this.contains(event.target);
  }

  /** @param {CartDiscountUpdateEvent} event */
  #handleDiscountUpdate = (event) => {
    const external = this.#isExternalCartUpdate(event);
    event.promise
      ?.then(({ detail }) => {
        const sectionsHtml = detail?.sections?.[this.sectionId];
        if (sectionsHtml) {
          morphSection(this.sectionId, sectionsHtml, { mode: this.isDrawer ? 'hydration' : 'full' });
          this.#updateCartQuantitySelectorButtonStates();
        } else if (external) {
          // External caller (Shopify.actions.updateCart or SFAPI default handler) didn't
          // attach sections; refetch so the discount UI reflects the post-mutation cart.
          // Internal cart-discount-component morphs the section itself — no fallback needed.
          sectionRenderer.renderSection(this.sectionId, {
            cache: false,
            mode: this.isDrawer ? 'hydration' : 'full',
          });
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[cart-items] Event promise rejected:', error);
      });
  };

  /** @param {CartNoteUpdateEvent} event */
  #handleNoteUpdate = (event) => {
    // Internal cart-note dispatches don't need a section refresh — the user typed the
    // value and the textarea retains it. Only external callers need the UI synced.
    if (!this.#isExternalCartUpdate(event)) return;
    event.promise
      ?.then(({ detail }) => {
        const sections = /** @type {Record<string, string> | undefined} */ (detail?.sections);
        const sectionsHtml = sections?.[this.sectionId];
        if (sectionsHtml) {
          morphSection(this.sectionId, sectionsHtml, { mode: this.isDrawer ? 'hydration' : 'full' });
        } else {
          sectionRenderer.renderSection(this.sectionId, {
            cache: false,
            mode: this.isDrawer ? 'hydration' : 'full',
          });
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[cart-items] Event promise rejected:', error);
      });
  };

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener(StandardEvents.cartLinesUpdate, this.#handleCartUpdate);
    document.addEventListener(ThemeEvents.quantitySelectorUpdate, this.#debouncedOnChange);
    document.addEventListener(StandardEvents.cartDiscountUpdate, this.#handleDiscountUpdate);
    document.addEventListener(StandardEvents.cartNoteUpdate, this.#handleNoteUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#handleCartUpdate);
    document.removeEventListener(ThemeEvents.quantitySelectorUpdate, this.#debouncedOnChange);
    document.removeEventListener(StandardEvents.cartDiscountUpdate, this.#handleDiscountUpdate);
    document.removeEventListener(StandardEvents.cartNoteUpdate, this.#handleNoteUpdate);
  }

  /**
   * Handles QuantitySelectorUpdateEvent change event.
   * @param {QuantitySelectorUpdateEvent} event - The event.
   */
  #onQuantityChange(event) {
    if (!(event.target instanceof Node) || !this.contains(event.target)) return;

    const { quantity, cartLine: line } = event.detail;

    // Cart items require a line number
    if (!line) return;

    if (quantity === 0) {
      return this.onLineItemRemove(line);
    }

    this.updateQuantity({
      line,
      quantity,
      action: 'change',
    });
    const lineItemRow = this.refs.cartItemRows[line - 1];

    if (!lineItemRow) return;

    const textComponent = /** @type {TextComponent | undefined} */ (lineItemRow.querySelector('text-component'));
    textComponent?.shimmer();
  }

  /**
   * Handles the line item removal.
   * @param {number} line - The line item index.
   */
  onLineItemRemove(line) {
    if (this.#walnutQuantityPending) return;
    this.updateQuantity({
      line,
      quantity: 0,
      action: 'clear',
    });

    const cartItemRowToRemove = this.refs.cartItemRows[line - 1];

    if (!cartItemRowToRemove) return;

    const rowsToRemove = [
      cartItemRowToRemove,
      // Get all nested lines of the row to remove
      ...this.refs.cartItemRows.filter((row) => row.dataset.parentKey === cartItemRowToRemove.dataset.key),
    ];

    // If the cart item row is the last row, optimistically trigger the cart empty state
    const isEmptyCart = rowsToRemove.length == this.refs.cartItemRows.length;

    const template = document.getElementById('empty-cart-template');
    if (isEmptyCart && template instanceof HTMLTemplateElement) {
      const clone = document.importNode(template.content, true);

      startViewTransition(() => {
        document.getElementById('cart-drawer-heading')?.remove();
        this.replaceChildren(clone);
      }, [this.isDrawer ? 'empty-cart-drawer' : 'empty-cart-page']);

      return;
    }

    // Add class to the row to trigger the animation
    rowsToRemove.forEach((row) => {
      const remove = () => row.remove();

      if (prefersReducedMotion()) return remove();

      row.style.setProperty('--row-height', `${row.clientHeight}px`);
      row.classList.add('removing');

      // Remove the row after the animation ends
      onAnimationEnd(row, remove);
    });
  }

  /** Switch the paid subscription between the three Black Walnut offers. */
  onWalnutQuantityStep(event) {
    const button = event.target.closest('[data-av-walnut-step]');
    const row = button?.closest('[data-av-walnut-subscription-line]');
    if (!row || button.disabled || this.#walnutQuantityPending) return;

    const line = Number(row.dataset.avWalnutSubscriptionLine);
    const quantity = Number(row.querySelector('input[name="updates[]"]').value) + Number(button.dataset.avWalnutStep);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) return;
    this.updateQuantity({ line, quantity, action: 'change', walnutRow: row });
  }

  /**
   * Updates the quantity.
   * @param {Object} config - The config.
   * @param {number} config.line - The line.
   * @param {number} config.quantity - The quantity.
   * @param {string} config.action - The action.
   * @param {HTMLTableRowElement} [config.walnutRow] - The paid Black Walnut subscription row.
   */
  updateQuantity(config) {
    if (this.#walnutQuantityPending) return;
    const cartPerformaceUpdateMarker = cartPerformance.createStartingMarker(`${config.action}:user-action`);

    this.#disableCartItems();

    const { line, quantity, walnutRow } = config;
    const { cartTotal } = this.refs;

    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    const sectionsToUpdate = new Set([this.sectionId]);
    cartItemsComponents.forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionsToUpdate.add(item.dataset.sectionId);
      }
    });

    const cartRow = walnutRow ?? this.refs.cartItemRows[line - 1];
    const walnutBundleRemoved = quantity === 0 && cartRow?.dataset.avWalnutKind === 'bundle';
    const sections = {
      sections: Array.from(sectionsToUpdate).join(','),
      sections_url: window.location.pathname,
    };
    const body = JSON.stringify({
      ...(walnutBundleRemoved ? { updates: this.#walnutBundleRemoval(cartRow) } : { line, quantity }),
      ...sections,
    });
    const cartEndpoint = walnutBundleRemoved
      ? `${window.Shopify?.routes?.root || '/'}cart/update.js`
      : Theme.routes.cart_change_url;

    cartTotal?.shimmer();

    const deferredUpdatePromise = CartLinesUpdateEvent.createPromise();
    const lineId = cartRow?.dataset.key ?? '';
    const checkout = walnutRow && this.closest('#cart-drawer')?.querySelector('button[name="checkout"]:enabled');
    if (checkout) checkout.disabled = true;
    if (walnutRow) this.#walnutQuantityPending = true;
    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action: config.action === 'change' && quantity > 0 ? 'update' : 'remove',
        context: 'cart',
        lines: [{ id: lineId, quantity }],
        promise: deferredUpdatePromise.promise,
      })
    );

    const request = walnutRow
      ? this.#changeWalnutQuantity(lineId, quantity, sections)
      : fetch(cartEndpoint, fetchConfig('json', { body })).then(response => response.json());
    request
      .then(async (parsedResponseText) => {
        resetShimmer(this);

        if (parsedResponseText.errors) {
          this.#handleCartError(line, parsedResponseText);
          deferredUpdatePromise.reject(new Error(parsedResponseText.errors));
          return;
        }

        const newSectionHTML = new DOMParser().parseFromString(
          parsedResponseText.sections[this.sectionId],
          'text/html'
        );

        // Grab the new cart item count from a hidden element
        const newCartHiddenItemCount = newSectionHTML.querySelector('[ref="cartItemCount"]')?.textContent;
        const newCartItemCount = newCartHiddenItemCount ? parseInt(newCartHiddenItemCount, 10) : 0;

        // Update data-cart-quantity for all matching variants
        this.#updateQuantitySelectors(parsedResponseText);

        deferredUpdatePromise.resolve({
          cart: CartLinesUpdateEvent.createCartFromAjaxResponse(parsedResponseText),
          detail: {
            sections: parsedResponseText.sections,
            items: parsedResponseText.items,
            itemCount: newCartItemCount,
            source: 'cart-items-component',
            didError: false,
          },
        });

        await morphSection(this.sectionId, parsedResponseText.sections[this.sectionId], {
          mode: this.isDrawer ? 'hydration' : 'full',
        });

        this.#updateCartQuantitySelectorButtonStates();
        if (parsedResponseText.walnutError) {
          const paidRow = this.querySelector('[data-av-walnut-subscription-line]');
          this.#showWalnutError(paidRow, parsedResponseText.walnutError);
        }
      })
      .catch((error) => {
        resetShimmer(this);
        if (walnutRow) this.#showWalnutError(walnutRow, error.message);
        console.error(error);
        deferredUpdatePromise.reject(error);

        this.dispatchEvent(
          new CartErrorEvent({
            error: error?.message || 'Failed to update cart',
            code: 'SERVICE_UNAVAILABLE',
          })
        );
      })
      .finally(() => {
        if (walnutRow) this.#walnutQuantityPending = false;
        if (checkout) checkout.disabled = false;
        this.#enableCartItems();
        cartPerformance.measureFromMarker(cartPerformaceUpdateMarker);
      });
  }

  async #changeWalnutQuantity(key, quantity, sections) {
    const root = window.Shopify?.routes?.root || '/';
    const bonusId = 68655703687328;
    const ebookId = 68655263613088;
    const offers = ['Buy 1', 'Buy 2 Get 1 Free', 'Buy 3 Get 2 Free'];
    const isWalnutLine = line => line.variant_id === ebookId ||
      (line.handle === 'black-walnut-drops' &&
        (line.selling_plan_allocation || offers.includes(line.properties?.['_Avonent bundle']) ||
          line.properties?.['_Avonent bonus'] === 'First order free bottle'));
    const request = async (route, body) => {
      const response = await fetch(root + route, body
        ? fetchConfig('json', { body: JSON.stringify(body) })
        : { cache: 'no-store', headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok || result.errors || result.status) {
        throw new Error(result.description || result.message || 'The bundle could not be updated.');
      }
      return result;
    };
    const addItem = line => ({
      id: line.variant_id,
      quantity: line.quantity,
      properties: line.properties || {},
      ...(line.selling_plan_allocation ? { selling_plan: line.selling_plan_allocation.selling_plan.id } : {}),
    });
    // Shopify can split a line when discounts change. Match merchandise, plan
    // and line properties, then use the latest keys to update the split lines.
    const identity = item => JSON.stringify([
      item.id,
      item.selling_plan ?? null,
      Object.entries(item.properties).sort(([first], [second]) => first.localeCompare(second)),
    ]);
    const applyLines = async (cart, items) => {
      const desired = new Map();
      for (const item of items) {
        const id = identity(item);
        const total = (desired.get(id)?.quantity || 0) + item.quantity;
        desired.set(id, { ...item, quantity: total });
      }
      const remaining = new Map([...desired].map(([id, item]) => [id, item.quantity]));
      for (const line of cart.items.filter(isWalnutLine)) {
        const id = identity(addItem(line));
        if (remaining.has(id)) remaining.set(id, remaining.get(id) - line.quantity);
      }
      const additions = [...desired].flatMap(([id, item]) =>
        remaining.get(id) > 0 ? [{ ...item, quantity: remaining.get(id) }] : []
      );
      if (additions.length) {
        // Appstle's own cart-request flag preserves the explicitly supplied
        // selling plan instead of reading the product widget's selection.
        await request('cart/add.js?appstle=true', { items: additions });
        cart = await request('cart.js');
      }
      const updates = {};
      const limits = new Map([...desired].map(([id, item]) => [id, item.quantity]));
      for (const line of cart.items.filter(isWalnutLine)) {
        const id = identity(addItem(line));
        const limit = limits.get(id) ?? 0;
        const nextQuantity = Math.min(line.quantity, limit);
        limits.set(id, limit - nextQuantity);
        if (nextQuantity !== line.quantity) updates[line.key] = nextQuantity;
      }
      return request('cart/update.js', { updates, ...sections });
    };

    const before = await request('cart.js');
    const paidLine = before.items.find(line => line.key === key &&
      line.handle === 'black-walnut-drops' && line.selling_plan_allocation);
    if (!paidLine) throw new Error('The cart changed. Reopen it to update your bundle.');

    const offer = offers[quantity - 1];
    const paid = { ...addItem(paidLine), quantity, properties: { ...paidLine.properties, '_Avonent bundle': offer } };
    const items = [paid];
    if (quantity > 1) items.push({
      id: bonusId,
      quantity: quantity - 1,
      properties: { '_Avonent bonus': 'First order free bottle', '_Avonent offer': offer },
    });
    if (quantity === 3) items.push({
      id: ebookId,
      quantity: 1,
      properties: { '_Avonent gift': 'Buy 3 first-order e-book' },
    });

    try {
      const updated = await applyLines(before, items);
      const bonus = updated.items.filter(line => line.variant_id === bonusId && isWalnutLine(line));
      const gift = updated.items.filter(line => line.variant_id === ebookId);
      const paidQuantity = updated.items.filter(line => identity(addItem(line)) === identity(paid))
        .reduce((total, line) => total + line.quantity, 0);
      if (paidQuantity !== quantity || bonus.reduce((total, line) => total + line.quantity, 0) !== quantity - 1 ||
          bonus.some(line => line.final_line_price !== 0) ||
          gift.reduce((total, line) => total + line.quantity, 0) !== (quantity === 3 ? 1 : 0) ||
          gift.some(line => line.final_line_price !== 0)) {
        throw new Error('Shopify could not apply the free items. Your original bundle was restored.');
      }
      return updated;
    } catch (error) {
      const restored = await applyLines(await request('cart.js'), before.items.filter(isWalnutLine).map(addItem));
      return { ...restored, walnutError: error.message };
    }
  }

  #showWalnutError(row, message) {
    const container = row?.querySelector('.cart-items__error');
    const text = container?.querySelector('.cart-item__error-text');
    if (!text) return;
    text.textContent = message;
    container.classList.remove('hidden');
  }

  /** Builds a single cart update for the paid bundle and its first-order gifts. */
  #walnutBundleRemoval(removedRow) {
    const updates = { [removedRow.dataset.key]: 0 };
    const remainingBundles = this.refs.cartItemRows.filter(row =>
      row !== removedRow && row.dataset.avWalnutKind === 'bundle'
    );
    let bonusRemaining = remainingBundles.reduce(
      (total, row) => total + Number(row.dataset.avWalnutBonusQuantity), 0
    );
    let ebookRemaining = remainingBundles.some(row => row.hasAttribute('data-av-walnut-earns-ebook')) ? 1 : 0;

    for (const row of this.refs.cartItemRows) {
      const quantity = Number(row.dataset.avWalnutQuantity);
      if (row.dataset.avWalnutKind === 'bonus') {
        updates[row.dataset.key] = Math.min(bonusRemaining, quantity);
        bonusRemaining -= updates[row.dataset.key];
      } else if (row.dataset.avWalnutKind === 'ebook') {
        updates[row.dataset.key] = Math.min(ebookRemaining, quantity);
        ebookRemaining -= updates[row.dataset.key];
      }
    }
    return updates;
  }

  /**
   * Handles the cart error.
   * @param {number} line - The line.
   * @param {Object} parsedResponseText - The parsed response text.
   * @param {string} parsedResponseText.errors - The errors.
   */
  #handleCartError = (line, parsedResponseText) => {
    const quantitySelector = this.refs.quantitySelectors[line - 1];
    const quantityInput = quantitySelector?.querySelector('input');

    if (!quantityInput) throw new Error('Quantity input not found');

    quantityInput.value = quantityInput.defaultValue;

    const cartItemError = this.refs[`cartItemError-${line}`];
    const cartItemErrorContainer = this.refs[`cartItemErrorContainer-${line}`];

    if (!(cartItemError instanceof HTMLElement)) throw new Error('Cart item error not found');
    if (!(cartItemErrorContainer instanceof HTMLElement)) throw new Error('Cart item error container not found');

    cartItemError.textContent = parsedResponseText.errors;
    cartItemErrorContainer.classList.remove('hidden');

    this.dispatchEvent(
      new CartErrorEvent({
        error: parsedResponseText.errors || 'Cart update failed',
        code: 'INVALID',
      })
    );
  };

  /**
   * Handles the cart update.
   *
   * @param {CartLinesUpdateEvent} event
   */
  #handleCartUpdate = (event) => {
    if (event.target === this) return;

    event.promise
      ?.then(async ({ detail }) => {
        const sections = detail?.sections;
        const cartItemsHtml = sections?.[this.sectionId];
        // Animate empty → non-empty in the drawer (possible in squeeze mode
        // where the page is interactive alongside the open drawer). This also
        // needs the response stylesheet because it adds the cart summary markup.
        const wasEmptyCartDrawer = this.isDrawer && this.querySelector('[data-cart-drawer-empty]') !== null;
        /** @type {'hydration' | 'full'} */
        const mode = this.isDrawer ? 'hydration' : 'full';
        const morphOptions = {
          mode,
          injectStylesheet: wasEmptyCartDrawer,
        };

        if (cartItemsHtml) {
          const existingKeys = new Set(this.refs.cartItemRows?.map((row) => row.dataset.key) ?? []);

          if (wasEmptyCartDrawer) {
            startViewTransition(() => {
              morphSection(this.sectionId, cartItemsHtml, morphOptions);
            }, ['fill-cart-drawer']);
          } else {
            await morphSection(this.sectionId, cartItemsHtml, morphOptions);
          }

          // Animate newly added rows (reverse of the remove animation).
          if (!wasEmptyCartDrawer && !prefersReducedMotion()) {
            for (const row of this.refs.cartItemRows ?? []) {
              if (!existingKeys.has(row.dataset.key)) {
                row.classList.add('adding');
                onAnimationEnd(row, () => row.classList.remove('adding'));
              }
            }
          }

          // Update button states for all cart quantity selectors after morph
          this.#updateCartQuantitySelectorButtonStates();
        } else {
          sectionRenderer.renderSection(this.sectionId, { cache: false, ...morphOptions });
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[cart-items] Event promise rejected:', error);
      });
  };

  /**
   * Disables the cart items.
   */
  #disableCartItems() {
    this.classList.add('cart-items-disabled');
  }

  /**
   * Enables the cart items.
   */
  #enableCartItems() {
    this.classList.remove('cart-items-disabled');
  }

  /**
   * Updates quantity selectors for all matching variants in the cart.
   * @param {Object} updatedCart - The updated cart object.
   * @param {Array<{variant_id: number, quantity: number}>} [updatedCart.items] - The cart items.
   */
  #updateQuantitySelectors(updatedCart) {
    if (!updatedCart.items) return;

    for (const item of updatedCart.items) {
      const variantId = item.variant_id.toString();
      const selectors = document.querySelectorAll(`quantity-selector-component[data-variant-id="${variantId}"]`);

      for (const selector of selectors) {
        const input = selector.querySelector('input[data-cart-quantity]');
        if (!input) continue;

        input.setAttribute('data-cart-quantity', item.quantity.toString());

        // Update the quantity selector's internal state
        if ('updateCartQuantity' in selector && typeof selector.updateCartQuantity === 'function') {
          selector.updateCartQuantity();
        }
      }
    }
  }

  /**
   * Updates button states for all cart quantity selector components.
   */
  #updateCartQuantitySelectorButtonStates() {
    for (const selector of document.querySelectorAll('cart-quantity-selector-component')) {
      /** @type {any} */ (selector).updateButtonStates?.();
    }
  }

  async fetchCartData() {
    if (this.#pendingCartFetch) return this.#pendingCartFetch;

    this.#pendingCartFetch = (async () => {
      const response = await fetch(`${Theme.routes.cart_url}.json`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
      const data = await response.json();
      return data;
    })().finally(() => {
      this.#pendingCartFetch = null;
    });

    return this.#pendingCartFetch;
  }

  /**
   * Gets the section id.
   * @returns {string} The section id.
   */
  get sectionId() {
    const { sectionId } = this.dataset;

    if (!sectionId) throw new Error('Section id missing');

    return sectionId;
  }

  /**
   * @returns {boolean} Whether the component is a drawer.
   */
  get isDrawer() {
    return this.dataset.drawer !== undefined;
  }
}

if (!customElements.get('cart-items-component')) {
  customElements.define('cart-items-component', CartItemsComponent);
}
