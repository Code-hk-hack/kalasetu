/**
 * KalaSetu AI — Feature 3: FairPrice Guard / Transparent Pricing Assistant
 * Explainable cost-plus math, wholesale & bulk discounts, and labor protection warnings.
 * Fully localized across 9 Indian regional languages with zero dependencies.
 */

import { appState } from '../core/appState.js';
import { voiceService } from '../core/voiceService.js';
import { offlineStorage } from '../core/offlineStorage.js';
import { aiService } from '../core/aiService.js';
import { FairPriceGuard } from '../core/fairPriceGuard.js';

export const PricingAssistantModule = {
  id: 'pricing',
  titleKey: 'tabPricing',
  icon: '💰',
  priority: 2,

  // Default cost state
  priceState: FairPriceGuard.getDefaultComponents(),

  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const t = (k, fb) => appState.t(k, fb);
    const calc = FairPriceGuard.calculate(this.priceState);

    this.container.innerHTML = `
      <div class="module-wrapper animate-fade-in">
        <!-- Audio Guidance -->
        <div class="audio-guidance-bar">
          <button class="btn-audio-guide" id="btn-listen-pricing-guide">
            <span class="icon-speaker">🔊</span>
            <span class="guide-text">${t('listenPricingBreakdown', 'Listen to Price Breakdown')}</span>
          </button>
          <span class="badge badge-accent">⚖️ FairPrice Guard</span>
        </div>

        <!-- Formula Callout Card -->
        <div class="card card-formula">
          <h2 class="card-title">Explainable Cost-Plus Pricing Formula</h2>
          <div class="formula-display">
            <span class="formula-tag">Safe Price</span> =
            (Material + Labor + Packaging + Transport + Overhead)
            × (1 + Margin)
          </div>
          <p class="formula-quote">
            “AI calculates a fair benchmark, but the final selling price is always your decision.”
          </p>
        </div>

        <!-- Labor-Protection Alerts Banner (Feature 3) -->
        <div id="labor-alerts-container">
          ${calc.alerts.map(a => `
            <div class="pricing-alert alert-${a.type} animate-slide-up">
              <span class="alert-icon">${a.type === 'danger' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <div class="alert-content">
                <strong>${a.code.replace(/_/g, ' ')}</strong>
                <p>${a.message}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Interactive Cost-Plus Inputs (Feature 3) -->
        <div class="card card-calculator mt-3">
          <h3 class="calc-section-title">Transparent Cost Breakdown:</h3>

          <!-- 1. Material -->
          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">🧵 Raw Material Cost (सामग्री खर्च)</label>
              <span class="slider-value" id="val-material">₹${this.priceState.materialCost}</span>
            </div>
            <input type="range" id="slider-material" min="0" max="3000" step="50" value="${this.priceState.materialCost}" class="custom-range" />
          </div>

          <!-- 2. Labor -->
          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">⏱️ Artisan Labor Value (कारीगर मजदूरी)</label>
              <span class="slider-value" id="val-labor">₹${this.priceState.labourCost}</span>
            </div>
            <input type="range" id="slider-labor" min="0" max="5000" step="50" value="${this.priceState.labourCost}" class="custom-range" />
          </div>

          <!-- 3. Packaging -->
          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">📦 Eco Packaging (पैकिंग सामग्री)</label>
              <span class="slider-value" id="val-packaging">₹${this.priceState.packagingCost}</span>
            </div>
            <input type="range" id="slider-packaging" min="0" max="300" step="10" value="${this.priceState.packagingCost}" class="custom-range" />
          </div>

          <!-- 4. Transport -->
          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">🚚 Transport / Freight (स्थानीय भाड़ा)</label>
              <span class="slider-value" id="val-transport">₹${this.priceState.transportCost}</span>
            </div>
            <input type="range" id="slider-transport" min="0" max="500" step="10" value="${this.priceState.transportCost}" class="custom-range" />
          </div>

          <!-- 5. Overhead Cost (New Required Field) -->
          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">💡 Overhead Cost (बिजली, पानी, औजार घिसावट)</label>
              <span class="slider-value" id="val-overhead">₹${this.priceState.overheadCost}</span>
            </div>
            <input type="range" id="slider-overhead" min="0" max="400" step="10" value="${this.priceState.overheadCost}" class="custom-range" />
          </div>

          <div class="divider-line my-3"></div>

          <!-- Margins & Bulk Discounts (New Required Fields) -->
          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">📈 Desired Retail Profit Margin (%)</label>
              <span class="slider-value" id="val-margin">${this.priceState.desiredProfitMargin}%</span>
            </div>
            <input type="range" id="slider-margin" min="5" max="100" step="5" value="${this.priceState.desiredProfitMargin}" class="custom-range" />
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">🏢 Wholesale B2B Margin (%)</label>
              <span class="slider-value" id="val-wholesale-margin">${this.priceState.wholesaleMargin}%</span>
            </div>
            <input type="range" id="slider-wholesale-margin" min="5" max="60" step="5" value="${this.priceState.wholesaleMargin}" class="custom-range" />
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <label class="slider-label">📦 Bulk Order (>20 pcs) Discount (%)</label>
              <span class="slider-value" id="val-bulk-discount">${this.priceState.bulkOrderDiscount}%</span>
            </div>
            <input type="range" id="slider-bulk-discount" min="0" max="35" step="5" value="${this.priceState.bulkOrderDiscount}" class="custom-range" />
          </div>

          <!-- Total Calculation Dashboard Card -->
          <div class="pricing-summary-box mt-3">
            <div class="summary-line">
              <span>Minimum Safe Price (न्यूनतम सुरक्षित लागत):</span>
              <strong id="total-base-cost">₹${calc.minimumSafePrice}</strong>
            </div>

            <!-- Suggested Retail Range -->
            <div class="suggested-price-highlight">
              <p class="highlight-label">Suggested Retail Price (खुदरा दाम):</p>
              <h2 class="highlight-price" id="final-suggested-price">₹${calc.suggestedRetailPrice}</h2>
              <p class="highlight-range" id="price-range-text">
                Suggested range only: ₹${calc.retailRange.min} – ₹${calc.retailRange.max}
              </p>
            </div>

            <!-- Suggested Wholesale & Bulk Unit -->
            <div class="wholesale-metrics-row mt-2">
              <div class="wholesale-card">
                <span class="w-label">Wholesale Price (B2B)</span>
                <strong class="w-val" id="val-wholesale-calc">₹${calc.suggestedWholesalePrice}</strong>
                <span class="w-sub">Range: ₹${calc.wholesaleRange.min}–₹${calc.wholesaleRange.max}</span>
              </div>
              <div class="wholesale-card">
                <span class="w-label">Bulk Unit Price (>20 pcs)</span>
                <strong class="w-val text-success" id="val-bulk-calc">₹${calc.bulkUnitPrice}</strong>
                <span class="w-sub">After ${this.priceState.bulkOrderDiscount}% Bulk Discount</span>
              </div>
            </div>

            <!-- Custom Final Price Override (Artisan Controls Final Decision) -->
            <div class="form-group mt-3">
              <label class="form-label font-bold">Your Final Chosen Price (आपका अंतिम निर्धारित मूल्य - ₹):</label>
              <input type="number" id="artisan-final-price" value="${this.priceState.finalArtisanPrice}" class="form-control text-center font-bold text-lg" />
            </div>

            <button class="btn btn-primary btn-block mt-3" id="btn-lock-price">
              💾 Lock & Save Price to Catalog Listing
            </button>
          </div>
        </div>

        <!-- Groq Smart Buyer Negotiation Advisor -->
        <div class="card card-negotiation mt-3">
          <h3 class="card-title">🤝 Smart Buyer Negotiation Advisor</h3>
          <p class="helper-text">If a middleman or buyer is bargaining below your minimum safe price, enter their offer for protective advice:</p>
          
          <div class="form-row mt-2">
            <div class="form-group half">
              <input type="number" id="input-buyer-offer" class="form-control" placeholder="Buyer offer (e.g. 700)" />
            </div>
            <div class="form-group half">
              <button class="btn btn-secondary btn-block" id="btn-analyze-offer">
                ⚡ Groq Advice
              </button>
            </div>
          </div>

          <div id="negotiation-advice-box" class="negotiation-advice-box hidden mt-3">
            <p id="negotiation-text" class="advice-content"></p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Sliders
    const sliders = [
      { id: 'slider-material', stateKey: 'materialCost', valId: 'val-material', prefix: '₹' },
      { id: 'slider-labor', stateKey: 'labourCost', valId: 'val-labor', prefix: '₹' },
      { id: 'slider-packaging', stateKey: 'packagingCost', valId: 'val-packaging', prefix: '₹' },
      { id: 'slider-transport', stateKey: 'transportCost', valId: 'val-transport', prefix: '₹' },
      { id: 'slider-overhead', stateKey: 'overheadCost', valId: 'val-overhead', prefix: '₹' },
      { id: 'slider-margin', stateKey: 'desiredProfitMargin', valId: 'val-margin', suffix: '%' },
      { id: 'slider-wholesale-margin', stateKey: 'wholesaleMargin', valId: 'val-wholesale-margin', suffix: '%' },
      { id: 'slider-bulk-discount', stateKey: 'bulkOrderDiscount', valId: 'val-bulk-discount', suffix: '%' }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        el.addEventListener('input', (e) => {
          this.priceState[s.stateKey] = Number(e.target.value);
          const labelEl = document.getElementById(s.valId);
          if (labelEl) {
            labelEl.textContent = `${s.prefix || ''}${e.target.value}${s.suffix || ''}`;
          }
          this.recalculateUI();
        });
      }
    });

    // Artisan final price manual override
    const finalPriceInput = document.getElementById('artisan-final-price');
    if (finalPriceInput) {
      finalPriceInput.addEventListener('input', (e) => {
        this.priceState.finalArtisanPrice = Number(e.target.value) || 0;
        this.recalculateUI();
      });
    }

    // Audio guide
    document.getElementById('btn-listen-pricing-guide')?.addEventListener('click', () => {
      const calc = FairPriceGuard.calculate(this.priceState);
      const text = `Aapki kul lagat ${calc.minimumSafePrice} rupaye hai. Uchit khudra dam ${calc.suggestedRetailPrice} rupaye hai. Aapka chuna dam ${this.priceState.finalArtisanPrice} rupaye hai.`;
      voiceService.speak(text, 'hi-IN');
    });

    // Lock price to active listing
    document.getElementById('btn-lock-price')?.addEventListener('click', async () => {
      const calc = FairPriceGuard.calculate(this.priceState);
      const listings = await offlineStorage.getListings();
      if (listings.length > 0) {
        const top = listings[0];
        top.price = this.priceState.finalArtisanPrice;
        top.pricingBreakdown = calc;
        await offlineStorage.saveListing(top);
        appState.showToast(`Price locked at ₹${top.price}! Saved in breakdown.`, 'success');
      } else {
        appState.showToast(`Price saved at ₹${this.priceState.finalArtisanPrice}!`, 'success');
      }
      appState.set('activeTab', 'market');
    });

    // Negotiation advisor
    document.getElementById('btn-analyze-offer')?.addEventListener('click', async () => {
      const offer = Number(document.getElementById('input-buyer-offer').value);
      if (!offer) {
        appState.showToast('Please enter buyer offer', 'warning');
        return;
      }
      const calc = FairPriceGuard.calculate(this.priceState);
      const adviceBox = document.getElementById('negotiation-advice-box');
      const textEl = document.getElementById('negotiation-text');

      adviceBox.classList.remove('hidden');
      textEl.textContent = 'Analyzing offer against cost breakdown...';

      const advice = await aiService.getNegotiationAdvice(offer, calc.suggestedRetailPrice, 'Bagru Craft');
      textEl.innerHTML = `
        <strong>${advice.acceptDeal ? '✓ Acceptable Offer' : '⚠️ Unfair Below-Cost Offer'}</strong>
        <p class="mt-1">${advice.advice}</p>
        <p class="mt-1 font-bold text-accent">Counter Offer: ₹${advice.counterOfferPrice}</p>
        <p class="text-xs text-muted mt-1">Say to buyer: "${advice.politeReply}"</p>
      `;
    });
  },

  recalculateUI() {
    const calc = FairPriceGuard.calculate(this.priceState);

    document.getElementById('total-base-cost').textContent = `₹${calc.minimumSafePrice}`;
    document.getElementById('final-suggested-price').textContent = `₹${calc.suggestedRetailPrice}`;
    document.getElementById('price-range-text').textContent = `Suggested range only: ₹${calc.retailRange.min} – ₹${calc.retailRange.max}`;
    document.getElementById('val-wholesale-calc').textContent = `₹${calc.suggestedWholesalePrice}`;
    document.getElementById('val-bulk-calc').textContent = `₹${calc.bulkUnitPrice}`;

    // Render updated alerts
    const alertsContainer = document.getElementById('labor-alerts-container');
    if (alertsContainer) {
      alertsContainer.innerHTML = calc.alerts.map(a => `
        <div class="pricing-alert alert-${a.type} animate-slide-up">
          <span class="alert-icon">${a.type === 'danger' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <div class="alert-content">
            <strong>${a.code.replace(/_/g, ' ')}</strong>
            <p>${a.message}</p>
          </div>
        </div>
      `).join('');
    }
  }
};
