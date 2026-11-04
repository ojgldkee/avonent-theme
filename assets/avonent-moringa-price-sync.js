(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

    let mode = 'subscription';
    let announcing = false;

    const money = (cents) => {
      const amount = Number(cents || 0) / 100;
      const currency = window.Shopify?.currency?.active || 'USD';
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(amount);
      } catch (_) {
        return `$${amount.toFixed(2)}`;
      }
    };

    const offer = () => main.querySelector('[data-avonent-price-offer]');
    const options = () => Array.from(main.querySelectorAll('[data-av-bundle-option]'));
    const selected = () =>
      main.querySelector('[data-av-bundle-option].is-selected:not(:disabled)') ||
      main.querySelector('[data-av-bundle-option][aria-checked="true"]:not(:disabled)') ||
      main.querySelector('[data-av-bundle-option]:not(:disabled)');

    const form = () =>
      main.querySelector('.buy-buttons-block form[data-type="add-to-cart-form"]') ||
      main.querySelector('product-form-component form[data-type="add-to-cart-form"]') ||
      main.querySelector('form[action*="/cart/add"]');

    const values = (option) => {
      const root = offer();
      const quantity = Math.max(1, Number(option?.dataset.quantity || 1));
      const subscriptionUnit = Number(option?.dataset.subscriptionUnit || root?.dataset.subscriptionPrice || 0);
      const oneTimeUnit = Number(option?.dataset.oneTimeUnit || root?.dataset.oneTimePrice || 0);
      const oneTimeCompareUnit = Number(option?.dataset.oneTimeCompareUnit || oneTimeUnit);

      // For Subscribe & Save only, use Shopify's editable Compare-at price when one exists.
      // This lets the merchant control the crossed-out anchor price without changing the
      // actual selling-plan price or the one-time purchase display.
      const subscriptionCompareUnit = Number(
        option?.dataset.oneTimeCompareUnit ||
        option?.dataset.subscriptionCompareUnit ||
        oneTimeUnit
      );

      return {
        quantity,
        subscriptionUnit,
        subscriptionCompareUnit,
        oneTimeUnit,
        oneTimeCompareUnit,
        subscriptionTotal: subscriptionUnit * quantity,
        subscriptionCompareTotal: subscriptionCompareUnit * quantity,
        oneTimeTotal: oneTimeUnit * quantity,
        oneTimeCompareTotal: oneTimeUnit * quantity
      };
    };

    const setText = (el, text) => {
      if (el && el.textContent !== text) el.textContent = text;
    };

    const enforcePlan = () => {
      const root = offer();
      const targetForm = form();
      if (!root || !targetForm) return;
      const planId = String(root.dataset.planId || '');

      let input = targetForm.querySelector('[data-avonent-moringa-selling-plan-global]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.setAttribute('data-avonent-moringa-selling-plan-global', '');
        targetForm.appendChild(input);
      }

      targetForm.querySelectorAll('[name="selling_plan"]').forEach((control) => {
        if (control === input) return;
        control.disabled = true;
        if (control.matches('[type="radio"], [type="checkbox"]')) control.checked = false;
      });

      if (mode === 'subscription' && planId) {
        input.disabled = false;
        input.name = 'selling_plan';
        input.value = planId;
        input.setAttribute('value', planId);
      } else {
        input.disabled = true;
        input.name = 'selling_plan';
        input.value = '';
        input.removeAttribute('value');
      }
    };

    const renderCards = () => {
      options().forEach((option) => {
        const v = values(option);
        const total = mode === 'subscription' ? v.subscriptionTotal : v.oneTimeTotal;
        const compareTotal = mode === 'subscription' ? v.subscriptionCompareTotal : v.oneTimeTotal;
        const price = option.querySelector('[data-av-bundle-price]');
        const compare = option.querySelector('[data-av-bundle-compare]');
        const savings = option.querySelector('[data-av-bundle-savings]');

        setText(price, money(total));
        if (compare) {
          const show = mode === 'subscription' && compareTotal > total;
          setText(compare, show ? money(compareTotal) : '');
          compare.hidden = !show;
        }
        if (savings) {
          if (mode === 'one_time') {
            savings.hidden = true;
          } else if (savings.dataset.customText === 'true') {
            // Merchant-entered "Savings text" in the Theme Editor always wins.
            savings.hidden = false;
          } else {
            const saved = Math.max(0, compareTotal - total);
            setText(savings, saved > 0 ? `Save ${money(saved)}` : '');
            savings.hidden = saved <= 0;
          }
        }
      });
    };

    const ensureMeta = () => {
      const targetForm = form();
      if (!targetForm) return null;
      let meta = targetForm.querySelector('[data-moringa-purchase-meta]');
      if (!meta) {
        const buttons = targetForm.querySelector('.product-form-buttons');
        if (!buttons) return null;
        meta = document.createElement('div');
        meta.className = 'moringa-purchase-meta';
        meta.setAttribute('data-moringa-purchase-meta', '');
        meta.innerHTML = `
          <div class="moringa-purchase-meta__recurring" data-moringa-recurring>
            <span class="moringa-purchase-meta__item">↻ <span>Refills ship every 30 days</span></span>
            <i aria-hidden="true"></i>
            <span class="moringa-purchase-meta__item">◷ <span>Skip or cancel anytime</span></span>
          </div>
          <button type="button" class="moringa-purchase-meta__one-time" data-moringa-one-time></button>
          <p class="moringa-purchase-meta__status" data-moringa-one-time-status>One-time purchase selected · No recurring charges</p>`;
        buttons.insertAdjacentElement('afterend', meta);
      }
      let status = meta.querySelector('[data-moringa-one-time-status]');
      if (!status) {
        status = document.createElement('p');
        status.className = 'moringa-purchase-meta__status';
        status.setAttribute('data-moringa-one-time-status', '');
        status.textContent = 'One-time purchase selected · No recurring charges';
        meta.appendChild(status);
      }
      return meta;
    };

    const renderOffer = () => {
      const root = offer();
      const option = selected();
      if (!root || !option) return;
      const v = values(option);
      const label = root.querySelector('.avonent-price-offer__label');
      const price = root.querySelector('.avonent-price-offer__price');
      const compare = root.querySelector('.avonent-price-offer__compare');
      const save = root.querySelector('.avonent-price-offer__save');
      const helper = root.querySelector('.avonent-price-offer__helper');
      const subscribe = root.querySelector('[data-moringa-subscribe]');

      setText(label, mode === 'subscription' ? 'Subscribe & Save' : 'One-Time Purchase');
      setText(price, money(mode === 'subscription' ? v.subscriptionTotal : v.oneTimeTotal));

      if (compare) {
        const show = mode === 'subscription' && v.subscriptionCompareTotal > v.subscriptionTotal;
        setText(compare, show ? money(v.subscriptionCompareTotal) : '');
        compare.hidden = !show;
      }
      if (save) {
        const saved = Math.max(0, v.subscriptionCompareTotal - v.subscriptionTotal);
        setText(save, mode === 'subscription' && saved > 0 ? `Save ${money(saved)}` : '');
        save.hidden = mode !== 'subscription' || saved <= 0;
      }
      if (helper) helper.hidden = mode === 'one_time';
      if (subscribe) {
        subscribe.classList.toggle('is-selected', mode === 'subscription');
        subscribe.setAttribute('aria-pressed', mode === 'subscription' ? 'true' : 'false');
      }

      const meta = ensureMeta();
      const recurring = meta?.querySelector('[data-moringa-recurring]');
      const switcher = meta?.querySelector('[data-moringa-one-time]');
      const status = meta?.querySelector('[data-moringa-one-time-status]');
      if (recurring) recurring.hidden = mode !== 'subscription';
      if (status) status.hidden = mode !== 'one_time';

      if (switcher) {
        switcher.type = 'button';
        switcher.disabled = false;
        switcher.classList.remove('is-selected');
        switcher.setAttribute('aria-pressed', 'false');
        switcher.dataset.purchaseSwitch = mode === 'subscription' ? 'one_time' : 'subscription';
        switcher.innerHTML = mode === 'subscription'
          ? `One-Time Purchase <strong>${money(v.oneTimeTotal)}</strong> + $4.95 Shipping <span>(No Free Gifts Included).</span>`
          : `Switch back to Subscribe & Save — <strong>${money(v.subscriptionTotal)}</strong>`;
      }

      root.dataset.purchaseMode = mode;
      root.dataset.selectedQuantity = String(v.quantity);
      root.dataset.subscriptionTotal = String(v.subscriptionTotal);
      root.dataset.oneTimeTotal = String(v.oneTimeTotal);
    };

    const render = () => {
      renderCards();
      renderOffer();
      enforcePlan();
    };

    const announce = () => {
      if (announcing) return;
      announcing = true;
      document.dispatchEvent(new CustomEvent('avonent:purchase-mode-change', {
        detail: {
          mode,
          sellingPlanId: mode === 'subscription' ? String(offer()?.dataset.planId || '') : null,
          source: 'moringa-price-controller'
        }
      }));
      announcing = false;
    };

    const setMode = (nextMode) => {
      mode = nextMode === 'one_time' || nextMode === 'one-time' ? 'one_time' : 'subscription';
      render();
      announce();
      [0, 30, 100, 250, 600, 1200, 2500].forEach((delay) => window.setTimeout(render, delay));
    };

    document.addEventListener('click', (event) => {
      const switcher = event.target.closest('[data-moringa-one-time]');
      if (switcher && main.contains(switcher)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMode(switcher.dataset.purchaseSwitch || (mode === 'subscription' ? 'one_time' : 'subscription'));
        return;
      }

      const subscribe = event.target.closest('[data-moringa-subscribe]');
      if (subscribe && main.contains(subscribe)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMode('subscription');
        return;
      }

      if (event.target.closest('[data-av-bundle-option]')) {
        [0, 30, 100, 220].forEach((delay) => window.setTimeout(render, delay));
      }

      const add = event.target.closest('button[type="submit"][name="add"], button[type="submit"][data-add-to-cart], [data-testid="add-to-cart"]');
      if (add && main.contains(add)) enforcePlan();
    }, true);

    document.addEventListener('avonent:bundle-change', () => {
      [0, 30, 100, 220].forEach((delay) => window.setTimeout(render, delay));
    });

    document.addEventListener('avonent:purchase-mode-change', (event) => {
      if (event.detail?.source === 'moringa-price-controller' || announcing) return;
      const requested = event.detail?.mode;
      if (requested === 'subscription' || requested === 'one_time' || requested === 'one-time') {
        mode = requested === 'subscription' ? 'subscription' : 'one_time';
        window.setTimeout(render, 0);
      }
    });

    document.addEventListener('formdata', (event) => {
      const targetForm = form();
      if (!targetForm || event.target !== targetForm) return;
      event.formData.delete('selling_plan');
      const planId = String(offer()?.dataset.planId || '');
      if (mode === 'subscription' && planId) event.formData.set('selling_plan', planId);
    });

    if (!document.getElementById('avonent-moringa-purchase-controller-style')) {
      const style = document.createElement('style');
      style.id = 'avonent-moringa-purchase-controller-style';
      style.textContent = `
        main[data-template*="product.moringa"] [data-moringa-one-time] {
          cursor:pointer !important; pointer-events:auto !important; color:#00a9cc !important;
          border-bottom:1px solid currentColor !important; font-weight:750 !important;
          opacity:1 !important; background:transparent !important;
        }
        main[data-template*="product.moringa"] [data-moringa-one-time]:disabled { pointer-events:auto !important; opacity:1 !important; }
        main[data-template*="product.moringa"] .moringa-purchase-meta__status {
          margin:10px 0 0 !important; color:#181818 !important; font-size:14px !important;
          line-height:1.3 !important; text-align:center !important; font-weight:400 !important;
        }`;
      document.head.appendChild(style);
    }

    mode = 'subscription';
    [0, 80, 250, 700, 1400, 3000].forEach((delay) => window.setTimeout(render, delay));
  });
})();