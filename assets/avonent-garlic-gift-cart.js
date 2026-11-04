/**
 * Reconciles Avonent's garlic digital bonus with cart quantity changes.
 * The reward applies ONLY to the aged-garlic-capsules product; it is a one-time
 * $0 digital cart line, never an Appstle recurring subscription item.
 */
(() => {
  if (window.__avonentGarlicGiftCartReady) return;
  window.__avonentGarlicGiftCartReady = true;

  const script = document.currentScript;
  const ebookVariantId = Number(script?.dataset.ebookVariantId || 0);
  const garlicHandle = 'aged-garlic-capsules';
  if (!ebookVariantId) return;

  let syncing = false;
  let resync = false;
  let timeoutId;

  const rootPath = () => window.Shopify?.routes?.root || '/';
  const getCart = async () => {
    const response = await fetch(rootPath() + 'cart.js', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Could not load cart for garlic gift.');
    return response.json();
  };
  const cartPost = async (endpoint, body) => {
    const response = await fetch(rootPath() + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status) {
      throw new Error(data.description || data.message || 'Could not update garlic gift.');
    }
    return data;
  };

  const sync = async () => {
    if (syncing) {
      resync = true;
      return;
    }
    syncing = true;
    try {
      const cart = await getCart();
      const garlicQuantity = cart.items.reduce((sum, item) =>
        sum + (item.handle === garlicHandle ? Number(item.quantity || 0) : 0), 0);
      const giftLines = cart.items.filter((item) =>
        Number(item.variant_id) === ebookVariantId &&
        item.properties?._avonent_garlic_gift === 'buy3');

      let changed = false;
      if (garlicQuantity >= 1 && !cart.items.some((item) => Number(item.variant_id) === ebookVariantId)) {
        await cartPost('cart/add.js', {
          items: [{
            id: ebookVariantId,
            quantity: 1,
            properties: { _avonent_garlic_gift: 'buy3', _gift_for: 'Aged Garlic' }
          }]
        });
        changed = true;
      } else if (garlicQuantity < 1 && giftLines.length) {
        for (const item of giftLines) {
          await cartPost('cart/change.js', { id: item.key, quantity: 0 });
        }
        changed = true;
      } else if (giftLines.length > 1 || (giftLines[0]?.quantity || 0) > 1) {
        for (let i = 0; i < giftLines.length; i += 1) {
          await cartPost('cart/change.js', {
            id: giftLines[i].key,
            quantity: i === 0 ? 1 : 0
          });
        }
        changed = true;
      }

      if (changed) {
        // Reloading the cart surfaces the correct item count, price and digital gift.
        const onCartPage = window.location.pathname.replace(/\/$/, '') ===
          (rootPath() + 'cart').replace(/\/$/, '');
        const drawerIsOpen = !!document.querySelector('#cart-drawer dialog[open]');
        if (onCartPage || drawerIsOpen) window.location.reload();
      }
    } catch (error) {
      console.error('[Avonent garlic gift reconciliation]', error);
    } finally {
      syncing = false;
      if (resync) {
        resync = false;
        schedule(500);
      }
    }
  };

  function schedule(delay = 450) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(sync, delay);
  }

  const init = () => {
    schedule(100);
    document.querySelectorAll('cart-items-component')
      .forEach((element) => {
        new MutationObserver(() => schedule(500)).observe(element, {
          childList: true,
          subtree: true
        });
      });
  };

  document.addEventListener('quantity-selector:update', () => {
    schedule(800);
    window.setTimeout(() => schedule(400), 1900);
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('.cart-items__remove, [data-cart-remove], cart-items-component quantity-selector')) {
      schedule(1000);
      window.setTimeout(() => schedule(500), 2100);
    }
  }, true);
  document.addEventListener('shopify:section:load', () => schedule(450));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
