(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

    main.querySelectorAll('.av-moringa-journey-leadin').forEach((el) => el.remove());

    const claimMarker = (symbol) => `<sup class="avonent-claim-marker" aria-hidden="true">${symbol}</sup>`;

    const appendSingleMarker = (el, symbol) => {
      if (!el) return;
      el.querySelectorAll('.avonent-claim-marker').forEach((marker) => marker.remove());
      el.insertAdjacentHTML('beforeend', claimMarker(symbol));
    };

    if (!document.getElementById('avonent-moringa-copy-styles')) {
      const style = document.createElement('style');
      style.id = 'avonent-moringa-copy-styles';
      style.textContent = `
        main[data-template*="product.moringa"] .av-moringa-lead {
          color:#111; font-size:1.02em; line-height:1.6; margin:0 0 12px;
        }
        main[data-template*="product.moringa"] .av-moringa-proof {
          margin:14px 0 4px; padding:12px 14px; border:1px solid #cfeaf0;
          border-radius:12px; background:#f2fbfd; color:#26343a; line-height:1.5;
        }
        main[data-template*="product.moringa"] .av-moringa-proof strong { color:#078aa5; }
        main[data-template*="product.moringa"] .avonent-accordion__item--benefits .avonent-accordion__content-inner li::before {
          background:#02c6ea;
        }
        main[data-template*="product.moringa"] .avonent-claim-marker {
          color:inherit !important;
          margin-left:0 !important;
          padding-left:0 !important;
          position:relative;
          left:-1px;
          font-size:.67em;
          font-weight:800;
          line-height:0;
          vertical-align:super;
          text-decoration:none !important;
          pointer-events:none;
          cursor:default;
          opacity:.92;
        }
      `;
      document.head.appendChild(style);
    }

    const accordion = main.querySelector('.avonent-accordion');
    if (accordion) {
      const items = accordion.querySelectorAll('.avonent-accordion__item');
      const replaceItem = (index, title, html) => {
        const item = items[index];
        if (!item) return;
        const titleEl = item.querySelector('.avonent-accordion__title');
        const body = item.querySelector('.avonent-accordion__content-inner');
        if (titleEl) titleEl.textContent = title;
        if (body) body.innerHTML = html;
      };

      replaceItem(0, 'Description', `
        <p class="av-moringa-lead"><strong>Avonent Pure Moringa</strong> keeps daily wellness refreshingly simple: one featured botanical, Moringa oleifera leaf, in an easy two-capsule serving.</p>
        <p>Each serving provides <strong>800 mg of moringa leaf</strong>. Moringa has a long history as a food and wellness plant, and modern research continues to explore its naturally occurring polyphenols and other plant compounds for antioxidant, metabolic, cardiovascular, and whole-body wellness.</p>
        <p>There is no complicated multi-ingredient blend here. Just a straightforward way to make moringa leaf part of a consistent daily routine.</p>
        <div class="av-moringa-proof"><strong>Simple by design:</strong> 800 mg Moringa oleifera leaf per serving · vegetable capsule · 30 servings per bottle.</div>
      `);

      replaceItem(1, 'Benefits', `
        <ul>
          <li><strong>Daily vitality:</strong> plant-based nutritional support for everyday energy, resilience, and an active routine.${claimMarker('†')}</li>
          <li><strong>Antioxidant defense:</strong> moringa contains naturally occurring polyphenols and other antioxidant plant compounds that support the body’s defenses against oxidative stress.${claimMarker('†')}</li>
          <li><strong>Healthy aging support:</strong> antioxidant and plant-compound support designed to fit a long-term wellness routine.${claimMarker('†')}</li>
          <li><strong>Heart wellness:</strong> moringa has been studied for cardiometabolic markers including blood pressure and lipid-related measures; human evidence is still developing.${claimMarker('‡')}</li>
          <li><strong>Healthy glucose metabolism:</strong> human research has explored moringa’s relationship with fasting glucose and HbA1c. Findings are promising in some studies but remain preliminary and inconsistent.${claimMarker('‡')}</li>
          <li><strong>Joint & active-lifestyle support:</strong> moringa’s antioxidant plant compounds can complement a routine built around normal inflammatory balance, movement, and recovery.${claimMarker('†')}</li>
          <li><strong>Whole-body wellness:</strong> a simple single-botanical addition for people who want broad plant-based support without another complicated stack.${claimMarker('†')}</li>
        </ul>
      `);

      replaceItem(2, 'Recommended Use', `
        <p><strong>Take 2 capsules once daily</strong> with an 8 oz (237 mL) glass of water.</p>
        <p>For best results, the product label recommends taking your serving <strong>20–30 minutes before a meal</strong>, or using it as directed by your healthcare professional. Consistency matters more than chasing a perfect time of day, so pair it with a routine you can actually keep.</p>
        <p><strong>Important:</strong> Do not exceed the recommended dose. Consult a physician before use if you are pregnant, nursing, under 18, taking medication, or have a medical condition. Because moringa has been studied for glucose and blood-pressure effects, people using medications for either should speak with a healthcare professional before adding it to their routine.${claimMarker('‡')}</p>
      `);
    }

    const benefitGrid = main.querySelector('.avonent-benefits');
    if (benefitGrid) {
      benefitGrid.querySelectorAll('.avonent-benefits__text').forEach((el) => {
        const text = el.textContent;
        const marker = /heart|metabolic|glucose|blood pressure/i.test(text) ? '‡' : '†';
        appendSingleMarker(el, marker);
      });
    }

    const proof = main.querySelector('.avonent-proof-stats');
    if (proof) {
      const eyebrow = proof.querySelector('.avonent-proof-stats__eyebrow');
      const heading = proof.querySelector('.avonent-proof-stats__heading');
      const desc = proof.querySelector('.avonent-proof-stats__description');
      if (eyebrow) eyebrow.textContent = 'TRADITION MEETS MODERN WELLNESS';
      if (heading) heading.textContent = 'Rooted in nature. Made for everyday wellness.';
      if (desc) {
        desc.innerHTML = '<p>Pure Moringa brings one of the world’s most studied traditional botanicals into a simple daily routine—plant-based support for vitality, antioxidant defense, healthy aging, and whole-body wellness.</p>';
        appendSingleMarker(desc.querySelector('p'), '†');
      }
    }

    // The Wellness Journey copy is intentionally NOT overwritten here.
    // Its text stays editable in the Shopify Theme Editor.

    const bottomOffer = main.querySelector('.avonent-bottom-offer');
    if (bottomOffer) {
      const desc = bottomOffer.querySelector('.avonent-bottom-offer__description');
      if (desc) desc.innerHTML = '<p>Choose the supply that fits your routine and keep your daily Moringa wellness support within reach.</p>';
    }

    main.querySelectorAll('.avonent-formula, .av-ba').forEach((section) => {
      const wrapper = section.closest('.shopify-section') || section;
      wrapper.style.display = 'none';
    });

    const reviews = main.querySelector('.avonent-customer-reviews');
    if (reviews) {
      const wrapper = reviews.closest('.shopify-section') || reviews;
      wrapper.style.display = 'none';
    }

    // ---------------------------------------------------------------------
    // Moringa subscription cart guard
    // Horizon creates a fresh FormData(form) inside product-form.js. Appstle
    // and section morphing can remove/disable selling_plan before that happens.
    // This guard patches the FINAL /cart/add request Shopify actually receives.
    // It only changes requests containing the Pure Moringa variant.
    // ---------------------------------------------------------------------
    const purchaseState = {
      source: 'main',
      mainMode: 'subscription',
      variantId: '',
      planId: ''
    };

    const refreshIds = () => {
      const priceOffer = main.querySelector('[data-avonent-price-offer]');
      const mainForm = main.querySelector(
        '.buy-buttons-block form[data-type="add-to-cart-form"], product-form-component form[data-type="add-to-cart-form"]'
      );

      const variantInput = mainForm?.querySelector('input[name="id"]');
      if (variantInput?.value) purchaseState.variantId = String(variantInput.value);

      if (priceOffer?.dataset.planId) purchaseState.planId = String(priceOffer.dataset.planId);

      const subscribeRow = priceOffer?.querySelector('[data-moringa-subscribe]');
      if (subscribeRow) {
        purchaseState.mainMode = subscribeRow.getAttribute('aria-pressed') === 'false' ? 'one_time' : 'subscription';
      }
    };

    refreshIds();

    document.addEventListener('avonent:purchase-mode-change', (event) => {
      const nextMode = event.detail?.mode;
      if (nextMode === 'subscription' || nextMode === 'one_time' || nextMode === 'one-time') {
        purchaseState.mainMode = nextMode === 'subscription' ? 'subscription' : 'one_time';
      }
      if (event.detail?.sellingPlanId) purchaseState.planId = String(event.detail.sellingPlanId);
    });

    document.addEventListener(
      'click',
      (event) => {
        const addButton = event.target.closest(
          'button[type="submit"][name="add"], button[type="submit"][data-add-to-cart], [data-testid="add-to-cart"], [data-testid="avonent-bottom-offer-add-to-cart"]'
        );

        if (!addButton) {
          if (event.target.closest('[data-moringa-subscribe], [data-moringa-one-time]')) {
            window.setTimeout(refreshIds, 0);
          }
          return;
        }

        refreshIds();
        const bottom = addButton.closest('[data-avonent-bottom-offer]');

        if (bottom) {
          purchaseState.source = 'bottom';
          const bottomPlan = bottom.querySelector('[data-abo-selling-plan-input]');
          if (bottomPlan?.dataset.planId || bottomPlan?.value) {
            purchaseState.planId = String(bottomPlan?.dataset.planId || bottomPlan?.value);
          }

          const bottomVariant = bottom.querySelector('input[name="id"]');
          if (bottomVariant?.value) purchaseState.variantId = String(bottomVariant.value);
        } else {
          purchaseState.source = 'main';
          const form = addButton.closest('form');
          const formVariant = form?.querySelector('input[name="id"]');
          if (formVariant?.value) purchaseState.variantId = String(formVariant.value);
        }
      },
      true
    );

    const getDesiredMode = () => {
      if (purchaseState.source === 'bottom') {
        const bottom = main.querySelector('[data-avonent-bottom-offer]');
        const toggle = bottom?.querySelector('[data-abo-purchase-toggle]');
        if (toggle) return toggle.getAttribute('aria-pressed') === 'true' ? 'one_time' : 'subscription';
      }
      return purchaseState.mainMode;
    };

    const getDesiredPlan = () => {
      if (purchaseState.source === 'bottom') {
        const bottom = main.querySelector('[data-avonent-bottom-offer]');
        const input = bottom?.querySelector('[data-abo-selling-plan-input]');
        const id = input?.dataset.planId || input?.value;
        if (id) return String(id);
      }
      return String(purchaseState.planId || '');
    };

    const isMoringaVariant = (id) => {
      if (!id || !purchaseState.variantId) return false;
      return String(id) === String(purchaseState.variantId);
    };

    const patchFormData = (body) => {
      const id = body.get('id');
      if (!isMoringaVariant(id)) return body;

      body.delete('selling_plan');
      const planId = getDesiredPlan();
      if (getDesiredMode() === 'subscription' && planId) body.set('selling_plan', planId);
      return body;
    };

    const patchSearchParams = (body) => {
      const id = body.get('id');
      if (!isMoringaVariant(id)) return body;

      body.delete('selling_plan');
      const planId = getDesiredPlan();
      if (getDesiredMode() === 'subscription' && planId) body.set('selling_plan', planId);
      return body;
    };

    const patchJsonObject = (payload) => {
      if (!payload || typeof payload !== 'object') return payload;

      const planId = getDesiredPlan();
      const subscribe = getDesiredMode() === 'subscription' && Boolean(planId);

      if (Array.isArray(payload.items)) {
        payload.items.forEach((item) => {
          if (!isMoringaVariant(item?.id || item?.variant_id)) return;
          delete item.selling_plan;
          if (subscribe) item.selling_plan = planId;
        });
        return payload;
      }

      if (isMoringaVariant(payload.id || payload.variant_id)) {
        delete payload.selling_plan;
        if (subscribe) payload.selling_plan = planId;
      }
      return payload;
    };

    if (!window.__avonentMoringaCartGuardInstalled) {
      window.__avonentMoringaCartGuardInstalled = true;
      const nativeFetch = window.fetch.bind(window);

      window.fetch = function avonentMoringaFetch(input, init) {
        try {
          const rawUrl = typeof input === 'string' ? input : input?.url;
          const url = new URL(rawUrl || '', window.location.origin);
          const isCartAdd = /\/cart\/add(?:\.js)?$/.test(url.pathname);

          if (!isCartAdd || !init?.body) return nativeFetch(input, init);

          const nextInit = { ...init };
          const body = init.body;

          if (body instanceof FormData) {
            nextInit.body = patchFormData(body);
          } else if (body instanceof URLSearchParams) {
            nextInit.body = patchSearchParams(body);
          } else if (typeof body === 'string') {
            const trimmed = body.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try {
                nextInit.body = JSON.stringify(patchJsonObject(JSON.parse(body)));
              } catch (error) {
                // Leave malformed/unexpected payloads untouched.
              }
            } else {
              const params = new URLSearchParams(body);
              nextInit.body = patchSearchParams(params).toString();
            }
          }

          return nativeFetch(input, nextInit);
        } catch (error) {
          return nativeFetch(input, init);
        }
      };
    }
  });
})();
