/**
 * KalaSetu AI — Feature 4: Craft-Aware Missing-Field Templates & Wizard Engine
 * Configurable schema for specific heritage clusters.
 * Enforces zero-hallucination policy (never infers risky claims without artisan confirmation).
 */

export const CRAFT_TEMPLATES = {
  block_print_textile: {
    id: 'block_print_textile',
    name: 'Bagru / Sanganeri / Block Print Textile',
    nameHi: 'बगरू / सांगानेरी हैंड-ब्लॉक प्रिंट वस्त्र',
    matchKeywords: ['bagru', 'sanganer', 'block', 'print', 'textile', 'cotton', 'silk', 'dupatta', 'saree', 'bedsheet', 'कपड़ा', 'दुपट्टा', 'साड़ी', 'प्रिंट'],
    requiredFields: [
      { key: 'productType', label: 'Product Type', labelHi: 'उत्पाद का प्रकार (दुपट्टा, साड़ी, चादर)', question: 'Yeh kis tarah ka product hai (Dupatta, Saree, Bedsheet ya Fabric)?', placeholder: 'e.g. Dupatta / Saree' },
      { key: 'material', label: 'Material Base', labelHi: 'सामग्री (कॉटन, मलबरी सिल्क, चंदेरी)', question: 'Yeh kis material ka hai—cotton, silk ya kuch aur?', placeholder: 'e.g. Pure Cotton / Chanderi Silk' },
      { key: 'length', label: 'Length', labelHi: 'लंबाई (मीटर या इंच)', question: 'Iski length kitni hai?', placeholder: 'e.g. 2.5 meters' },
      { key: 'width', label: 'Width', labelHi: 'चौड़ाई (पना / चौड़ाई)', question: 'Iski width kitni hai?', placeholder: 'e.g. 44 inches / 1 meter' },
      { key: 'primaryColours', label: 'Primary Colours', labelHi: 'मुख्य रंग', question: 'Isme kaun se mukhya rang istemal hue hain?', placeholder: 'e.g. Indigo Blue & Madder Red' },
      { key: 'careInstructions', label: 'Care Instructions', labelHi: 'धुलाई व रख-रखाव निर्देश', question: 'Isko wash kaise karna chahiye?', placeholder: 'e.g. Cold gentle wash / Dry clean' },
      { key: 'stockQuantity', label: 'Ready Stock', labelHi: 'उपलब्ध पीस (स्टॉक)', question: 'Ready stock mein kitne pieces available hain?', placeholder: 'e.g. 5 pieces' },
      { key: 'productionLeadTime', label: 'Production Time', labelHi: 'बनाने में लगने वाला समय', question: 'Order banane mein kitne din lagenge?', placeholder: 'e.g. 2–3 days' }
    ],
    optionalFields: [
      { key: 'printingTechnique', label: 'Printing Technique', labelHi: 'छपाई तकनीक (Dabu / Direct / Discharge)' },
      { key: 'dyeType', label: 'Dye Type', labelHi: 'रंग का प्रकार (Needs confirmation)' },
      { key: 'customizationAvailable', label: 'Custom Order Possible', labelHi: 'कस्टम आर्डर संभव' },
      { key: 'artisanStory', label: 'Artisan Story', labelHi: 'कारीगर की कहानी' }
    ]
  },

  jaipur_blue_pottery: {
    id: 'jaipur_blue_pottery',
    name: 'Jaipur Blue Pottery',
    nameHi: 'जयपुर ब्लू पॉटरी (नीली मिट्टी के बर्तन व फूलदान)',
    matchKeywords: ['blue pottery', 'pottery', 'vase', 'plate', 'planter', 'ceramic', 'quartz', 'फूलदान', 'ब्लू पॉटरी', 'बर्तन', 'प्लेट'],
    requiredFields: [
      { key: 'productType', label: 'Product Type', labelHi: 'उत्पाद प्रकार (Vase, Bowl, Plate, Tile)', question: 'Is product ka type kya hai (Vase, Bowl, Plate ya Tile)?', placeholder: 'e.g. Decorative Flower Vase' },
      { key: 'dimensions', label: 'Dimensions / Size', labelHi: 'आकार / साइज', question: 'Is product ka size kya hai (Height & Diameter)?', placeholder: 'e.g. 10 inches height, 5 inches diameter' },
      { key: 'weightOrSize', label: 'Weight or Capacity', labelHi: 'वज़न या क्षमता', question: 'Iska wajan ya volume capacity kitna hai?', placeholder: 'e.g. 850 grams' },
      { key: 'primaryColours', label: 'Primary Colours', labelHi: 'मुख्य रंग व डिज़ाइन', question: 'Isme kaun se rang v motifs hain?', placeholder: 'e.g. Persian Blue, Turquoise, White' },
      { key: 'fragile', label: 'Fragility / Breakable', labelHi: 'नाजुक / टूटने योग्य (Yes/No)', question: 'Kya yeh fragile (tootne yogya) item hai?', placeholder: 'e.g. Yes - Fragile ceramic packing needed' },
      { key: 'careInstructions', label: 'Cleaning & Care Guide', labelHi: 'साफ-सफाई निर्देश', question: 'Isko safely clean kaise karna chahiye?', placeholder: 'e.g. Wipe with dry/damp cloth. Avoid harsh chemicals.' },
      { key: 'stockQuantity', label: 'Ready Stock', labelHi: 'उपलब्ध पीस (स्टॉक)', question: 'Ready stock mein kitne pieces hain?', placeholder: 'e.g. 2 pieces' },
      { key: 'productionLeadTime', label: 'Production Time', labelHi: 'नया बनाने में दिन', question: 'Custom order banane mein kitne din lagenge?', placeholder: 'e.g. 7 days' }
    ],
    optionalFields: [
      { key: 'glazeFinish', label: 'Glaze Finish', labelHi: 'ग्लेज़ फिनिश (Glossy / Matte)' },
      { key: 'foodSafeStatus', label: 'Food Safe Status', labelHi: 'फूड-सेफ स्थिति (Needs confirmation)' },
      { key: 'customizationAvailable', label: 'Customization Possible', labelHi: 'कस्टम आर्डर' },
      { key: 'artisanStory', label: 'Artisan Story', labelHi: 'कारीगर की कहानी' }
    ]
  }
};

export class CraftTemplateService {
  /**
   * Determine matching craft template based on extracted fields or text
   * @param {Object} draft - { title, category, materials, cluster }
   * @returns {Object} Template configuration
   */
  static matchTemplate(draft = {}) {
    const text = [
      draft.title || '',
      draft.category || '',
      draft.materials || '',
      draft.cluster || ''
    ].join(' ').toLowerCase();

    for (const [key, tpl] of Object.entries(CRAFT_TEMPLATES)) {
      if (tpl.matchKeywords.some(kw => text.includes(kw.toLowerCase()))) {
        return tpl;
      }
    }

    // Default to block print textile as fallback
    return CRAFT_TEMPLATES.block_print_textile;
  }

  /**
   * Find missing mandatory fields in the current draft
   * @param {Object} draft 
   * @param {Object} template 
   * @returns {Array} List of missing field definitions
   */
  static getMissingFields(draft = {}, template = null) {
    const tpl = template || this.matchTemplate(draft);
    const missing = [];

    for (const reqField of tpl.requiredFields) {
      const val = draft[reqField.key];
      if (val === undefined || val === null || String(val).trim() === '' || String(val).toLowerCase() === 'standard' || String(val).toLowerCase() === 'standard dimensions') {
        missing.push(reqField);
      }
    }

    return missing;
  }
}
