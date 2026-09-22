/**
 * KalaSetu AI — Feature 3: FairPrice Guard / Transparent Pricing Engine
 * Replaces black-box pricing with explainable cost-plus math and labor protection warnings.
 * Zero external dependencies.
 */

export class FairPriceGuard {
  /**
   * Default price component structure
   */
  static getDefaultComponents() {
    return {
      materialCost: 350,
      labourCost: 500,
      packagingCost: 50,
      transportCost: 50,
      overheadCost: 50, // Electricity, tool wear, water, studio space
      desiredProfitMargin: 30, // % for retail
      wholesaleMargin: 15, // % for B2B/wholesale orders
      bulkOrderDiscount: 10, // % discount on orders > 20 pcs
      aiMarketSuggestion: 1250,
      finalArtisanPrice: 1250
    };
  }

  /**
   * Calculate complete transparent pricing breakdown
   * @param {Object} input - Cost parameters
   * @returns {Object} Complete calculation with warnings and ranges
   */
  static calculate(input = {}) {
    const material = Math.max(0, Number(input.materialCost) || 0);
    const labour = Math.max(0, Number(input.labourCost) || 0);
    const packaging = Math.max(0, Number(input.packagingCost) || 0);
    const transport = Math.max(0, Number(input.transportCost) || 0);
    const overhead = Math.max(0, Number(input.overheadCost) || 0);

    const profitMargin = Math.max(0, Number(input.desiredProfitMargin) || 30);
    const wholesaleMargin = Math.max(0, Number(input.wholesaleMargin) || 15);
    const bulkDiscount = Math.max(0, Number(input.bulkOrderDiscount) || 10);

    // 1. Minimum Safe Price: Total direct + indirect cost to make the item
    const minimumSafePrice = material + labour + packaging + transport + overhead;

    // 2. Suggested Retail Price
    const suggestedRetailPrice = Math.round(minimumSafePrice * (1 + profitMargin / 100));

    // 3. Suggested Wholesale Price
    const suggestedWholesalePrice = Math.round(minimumSafePrice * (1 + wholesaleMargin / 100));

    // 4. Retail Range (e.g. ±5% to +12%)
    const retailRangeMin = Math.round(suggestedRetailPrice * 0.95);
    const retailRangeMax = Math.round(suggestedRetailPrice * 1.12);

    // 5. Wholesale Range (e.g. ±4%)
    const wholesaleRangeMin = Math.round(suggestedWholesalePrice * 0.96);
    const wholesaleRangeMax = Math.round(suggestedWholesalePrice * 1.05);

    // 6. Bulk Order Unit Price (with bulk discount applied on wholesale)
    const bulkUnitPrice = Math.round(suggestedWholesalePrice * (1 - bulkDiscount / 100));

    const aiMarketSuggestion = input.aiMarketSuggestion !== undefined ? Number(input.aiMarketSuggestion) : null;
    const finalPrice = input.finalArtisanPrice !== undefined ? Number(input.finalArtisanPrice) : suggestedRetailPrice;

    // 7. Labor-Protection and Fair Wage Alerts
    const alerts = [];

    // Alert A: Zero labor cost
    if (labour <= 0) {
      alerts.push({
        type: 'warning',
        code: 'ZERO_LABOUR',
        message: 'Labour cost add karein. Aapke kaam ka time aur skill bhi product price mein include hona chahiye.',
        messageEn: 'Add labour cost. Your time and craftsmanship must be included in the product price.'
      });
    }

    // Alert B: Final price below minimum safe cost
    if (finalPrice < minimumSafePrice) {
      alerts.push({
        type: 'danger',
        code: 'BELOW_SAFE_PRICE',
        message: 'Warning: Yeh price estimated cost se kam hai. Isse aapki material ya labour cost cover nahi ho sakti.',
        messageEn: 'Warning: This price is lower than estimated production cost. Material and labor costs will not be covered.'
      });
    }

    // Alert C: AI market suggestion is lower than minimum safe cost
    if (aiMarketSuggestion !== null && aiMarketSuggestion > 0 && aiMarketSuggestion < minimumSafePrice) {
      alerts.push({
        type: 'info',
        code: 'AI_SUGGESTION_BELOW_COST',
        message: 'Market suggestion low hai. App aapke cost-based minimum price ko priority de raha hai.',
        messageEn: 'Market suggestion is low. KalaSetu AI prioritizes your cost-based minimum safe price.'
      });
    }

    return {
      costs: {
        materialCost: material,
        labourCost: labour,
        packagingCost: packaging,
        transportCost: transport,
        overheadCost: overhead
      },
      margins: {
        desiredProfitMargin: profitMargin,
        wholesaleMargin: wholesaleMargin,
        bulkOrderDiscount: bulkDiscount
      },
      minimumSafePrice,
      suggestedRetailPrice,
      suggestedWholesalePrice,
      retailRange: { min: retailRangeMin, max: retailRangeMax },
      wholesaleRange: { min: wholesaleRangeMin, max: wholesaleRangeMax },
      bulkUnitPrice,
      aiMarketSuggestion,
      finalArtisanPrice: finalPrice,
      isPriceSafe: finalPrice >= minimumSafePrice,
      alerts,
      disclaimer: "Suggested range only. Final selling price is always decided by the artisan."
    };
  }
}
