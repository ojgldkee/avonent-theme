/**
 * Avonent Black Walnut Buy 3 Get 2 Free: one-time, $0 digital gift.
 * Keeps the unlisted bonus out of nonqualifying carts without touching
 * the live Buy X Get Y free-bottle discounts or the $24.99 retail eBook.
 */
(() => {
  'use strict';
  if (window.__avonentWalnutBuy3GiftReady) return;
  window.__avonentWalnutBuy3GiftReady = true;

  const WALNUT_VARIANT = 68650911137952;
  const GIFT_VARIANT = 68655263613088;
  const MARKER = '_avonent_walnut_gift';
  const script = document.currentScript;
  const productPage = window.location.pathname.includes('/products/black-walnut-drops');
  const root = () => window.Shopify?.routes?.root || '/';
  let hasWalnut = script?.dataset.walnutInCart === 'true';
  let pending = null;
  let scheduled = null;
  let checkingOut = false;

  async function readCart() {
    const response = await fetch(root() + 'cart.js', {
      credentials: 'same-origin', cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Cannot retrieve cart');
    return response.json();
  }

  async function writeCart(endpoint, payload) {
    const response = await fetch(root() + endpoint, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status || result.errors) {
      throw new Error(result.description || result.message || 'Cannot update eBook gift');
    }
    return result;
  }

  const qualifiedQty = cart => (cart.items || []).reduce((count, line) => {
    return count + (
      Number(line.variant_id) === WALNUT_VARIANT && !!line.selling_plan_allocation && line.properties?.['_Avonent bundle'] === 'Buy 3 Get 2 Free'
        ? Number(line.quantity || 0) : 0
    );
  }, 0);
  const isGift = line => Number(line.variant_id) === GIFT_VARIANT;

  async function reconcile() {
    if (pending) return pending;
    pending = (async () => {
      let cart = await readCart();
      const eligible = qualifiedQty(cart) >= 3;
      hasWalnut = (cart.items || []).some(line => Number(line.variant_id) === WALNUT_VARIANT);
      const gifts = (cart.items || []).filter(isGift);
      let changed = false;

      if (!eligible && gifts.length) {
        for (const item of gifts) {
          await writeCart('cart/change.js', { id: item.key, quantity: 0 });
          changed = true;
        }
      } else if (eligible && gifts.length === 0) {
        await writeCart('cart/add.js', {
          items: [{ id: GIFT_VARIANT, quantity: 1, properties: {
            [MARKER]: 'buy3', '_Avonent gift': 'Buy 3 first-order e-book'
          } }]
        });
        changed = true;
      } else if (eligible) {
        for (let index = 0; index < gifts.length; index += 1) {
          const quantity = index === 0 ? 1 : 0;
          if (Number(gifts[index].quantity) !== quantity) {
            await writeCart('cart/change.js', { id: gifts[index].key, quantity });
            changed = true;
          }
        }
      }

      if (changed) cart = await readCart();
      return { cart, changed };
    })().finally(() => { pending = null; });
    return pending;
  }

  const cartPage = () =>
    window.location.pathname.replace(/\/$/, '') === (root() + 'cart').replace(/\/$/, '');
  const drawerOpen = () => !!document.querySelector(
    '#cart-drawer dialog[open], theme-drawer#cart-drawer[open], #cart-drawer[open]'
  );

  async function refreshGift() {
    try {
      const { changed } = await reconcile();
      if (changed && (cartPage() || drawerOpen())) window.location.reload();
    } catch (error) {
      console.error('[Avonent Black Walnut gift]', error);
    }
  }

  function schedule(delay = 650) {
    window.clearTimeout(scheduled);
    scheduled = window.setTimeout(refreshGift, delay);
  }

  const checkoutButton = target => target instanceof Element && target.closest(
    'button[name="checkout"], input[name="checkout"], #checkout, a[href*="/checkout"], button[formaction*="/checkout"]'
  );

  async function verifiedCheckout() {
    if (checkingOut) return;
    checkingOut = true;
    try {
      const { cart } = await reconcile();
      const qualifies = qualifiedQty(cart) >= 3;
      const gift = (cart.items || []).find(isGift);
      if (qualifies && !gift) throw new Error('Your free eBook could not be added. Try again.');
      if (!qualifies && gift) throw new Error('The free eBook must be removed from this cart.');
      if (gift && Number(gift.final_line_price || 0) > 0) {
        throw new Error('Your eBook should be free. Please refresh the cart.');
      }
      window.location.assign(root() + 'checkout');
    } catch (error) {
      checkingOut = false;
      console.error('[Avonent Black Walnut checkout]', error);
      window.alert(error.message || 'Could not verify your cart. Please try again.');
    }
  }

  document.addEventListener('click', event => {
    const checkout = checkoutButton(event.target);
    if (checkout && (hasWalnut || productPage) && !checkout.disabled && !event.defaultPrevented) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void verifiedCheckout();
      return;
    }
    if (event.target instanceof Element && event.target.closest(
      '.cart-items__remove, [data-cart-remove], cart-items-component quantity-selector, [data-testid="cart-drawer-trigger"], [data-av-cb-bundle], [data-av-cb-walnut-add]'
    )) {
      schedule(1100);
      window.setTimeout(() => schedule(450), 2200);
    }
  }, true);

  document.addEventListener('submit', event => {
    if (event.submitter && (hasWalnut || productPage) && checkoutButton(event.submitter)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void verifiedCheckout();
    }
  }, true);
  document.addEventListener('quantity-selector:update', () => schedule(850));
  document.addEventListener('cart:updated', () => schedule(450));
  document.addEventListener('shopify:section:load', () => schedule(550));

  function init() {
    schedule(180);
    document.querySelectorAll('cart-items-component').forEach(element => {
      new MutationObserver(() => schedule(750)).observe(element, { childList: true, subtree: true });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
