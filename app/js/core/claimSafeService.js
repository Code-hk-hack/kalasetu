/**
 * KalaSetu AI — Feature 1: ClaimSafe AI / Product Claim Verification Service
 * Prevents AI-generated catalogs from making unsupported or misleading product claims.
 * 100% zero-dependency, works offline and in browser.
 */

export const RISKY_CLAIM_PATTERNS = [
  { key: 'pure_silk', terms: ['pure silk', '100% silk', 'शुद्ध सिल्क', 'प्योर सिल्क'], label: 'Pure Silk', category: 'material' },
  { key: 'pashmina', terms: ['genuine pashmina', 'authentic pashmina', 'असली पश्मीना', 'पश्मीना'], label: 'Genuine Pashmina', category: 'material' },
  { key: 'gi_tagged', terms: ['gi-tagged', 'gi tagged', 'gi certified', 'जीआई टैग', 'gi tag', 'geographical indication'], label: 'GI Tagged / Certified', category: 'origin' },
  { key: 'natural_dye', terms: ['natural dye', 'natural-dye', 'organic dye', 'प्राकृतिक रंग', 'प्राकृतिक नील'], label: 'Natural / Organic Dye', category: 'process' },
  { key: 'organic', terms: ['organic', 'ऑर्गेनिक', 'जैविक'], label: 'Organic', category: 'material' },
  { key: 'chemical_free', terms: ['chemical-free', 'chemical free', 'रसायन मुक्त'], label: 'Chemical-Free', category: 'process' },
  { key: 'handwoven', terms: ['handwoven', 'hand-woven', 'हथकरघा बुनाई', 'हाथ से बुना'], label: 'Handwoven', category: 'technique' },
  { key: 'handmade', terms: ['handmade', 'hand-made', 'हाथ से बना', 'हस्तनिर्मित', 'handcrafted', 'hand-crafted'], label: 'Handmade / Handcrafted', category: 'technique' },
  { key: 'authentic', terms: ['authentic', 'original', 'प्रामाणिक', 'असली'], label: 'Authentic / Original', category: 'authenticity' },
  { key: 'pure_cotton', terms: ['100% cotton', 'pure cotton', '100% सूती', 'शुद्ध कॉटन'], label: '100% Cotton', category: 'material' },
  { key: 'food_safe', terms: ['food safe', 'food-safe', 'खाने योग्य सुरक्षित'], label: 'Food Safe Glaze', category: 'safety' },
  { key: 'lead_free', terms: ['lead free', 'lead-free', 'सीसा रहित'], label: 'Lead Free', category: 'safety' },
  { key: 'eco_friendly', terms: ['eco-friendly', 'eco friendly', 'पर्यावरण अनुकूल'], label: 'Eco-Friendly', category: 'environmental' },
  { key: 'fair_trade', terms: ['fair trade', 'fair-trade', 'उचित व्यापार'], label: 'Fair Trade', category: 'ethics' },
  { key: 'export_quality', terms: ['export quality', 'निर्यात गुणवत्ता'], label: 'Export Quality', category: 'standard' },
  { key: 'certified', terms: ['certified', 'प्रमाणित'], label: 'Certified', category: 'certification' }
];

export class ClaimSafeService {
  /**
   * Scan text fields (title, desc, tags, transcript, attributes) for risky claims
   * @param {Object} input - { title, descHi, descEn, tags, materials, speechTranscript, source }
   * @returns {Array} List of detected claims with verification metadata
   */
  static detectClaims(input = {}) {
    const combinedText = [
      input.title || '',
      input.descHi || '',
      input.descEn || '',
      input.materials || '',
      input.speechTranscript || '',
      ...(Array.isArray(input.tags) ? input.tags : [])
    ].join(' ').toLowerCase();

    const detected = [];
    const source = input.source || 'ai';

    for (const pattern of RISKY_CLAIM_PATTERNS) {
      const matchedTerm = pattern.terms.find(term => combinedText.includes(term.toLowerCase()));
      if (matchedTerm) {
        // Source-based initial status
        let initialStatus = 'needs_verification';
        if (source === 'artisan_confirmed') {
          initialStatus = 'artisan_confirmed';
        } else if (source === 'artisan_voice') {
          initialStatus = 'artisan_stated';
        } else if (source === 'uploaded_document') {
          initialStatus = 'document_verified';
        } else if (source === 'ai') {
          initialStatus = 'ai_generated_draft';
        }

        detected.push({
          id: `claim-${pattern.key}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          key: pattern.key,
          label: pattern.label,
          matchedTerm: matchedTerm,
          category: pattern.category,
          claim_status: initialStatus, // 'ai_generated_draft' | 'artisan_stated' | 'artisan_confirmed' | 'document_verified' | 'needs_verification' | 'rejected'
          claim_source: source, // 'ai' | 'artisan_voice' | 'artisan_manual_input' | 'facilitator' | 'uploaded_document'
          proofDocumentUrl: null,
          reviewedAt: null,
          reviewNote: null,
          requiredConfirmationPrompt: `Is claim ko publish karne se pehle artisan se confirm karein: "${pattern.label}"`
        });
      }
    }

    return detected;
  }

  /**
   * Validate whether a listing is eligible for public publishing
   * Unconfirmed risky claims block publishing or must be stripped
   * @param {Array} claims
   * @returns {Object} { canPublish: boolean, unverifiedClaims: Array, message: string }
   */
  static validateForPublishing(claims = []) {
    if (!Array.isArray(claims) || claims.length === 0) {
      return { canPublish: true, unverifiedClaims: [], message: 'No risky claims detected. Listing is safe to publish.' };
    }

    const unverified = claims.filter(c => 
      c.claim_status === 'needs_verification' || 
      c.claim_status === 'ai_generated_draft' || 
      c.claim_status === 'artisan_stated'
    );

    const rejected = claims.filter(c => c.claim_status === 'rejected');

    if (unverified.length > 0) {
      return {
        canPublish: false,
        unverifiedClaims: unverified,
        rejectedClaims: rejected,
        message: `Is claim ko publish karne se pehle artisan se confirm karein: ${unverified.map(c => c.label).join(', ')}`
      };
    }

    return {
      canPublish: true,
      unverifiedClaims: [],
      rejectedClaims: rejected,
      message: 'Sabhi claims ka satyapan ho gaya hai (All claims verified).'
    };
  }

  /**
   * Sanitize description for public viewing by stripping or warning on unconfirmed claims
   * @param {string} text 
   * @param {Array} claims 
   */
  static sanitizePublicText(text = '', claims = []) {
    let sanitized = text;
    const unverifiedOrRejected = claims.filter(c => 
      c.claim_status !== 'artisan_confirmed' && 
      c.claim_status !== 'document_verified'
    );

    for (const claim of unverifiedOrRejected) {
      if (claim.matchedTerm) {
        const regex = new RegExp(`\\b${claim.matchedTerm}\\b`, 'gi');
        // Replace unconfirmed high-risk claims with neutral craft terms
        sanitized = sanitized.replace(regex, `[${claim.label} — Needs Verification]`);
      }
    }
    return sanitized;
  }

  /**
   * Helper to return CSS badge color class and icon
   */
  static getStatusBadgeInfo(status) {
    switch (status) {
      case 'artisan_confirmed':
      case 'document_verified':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#86efac',
          icon: '✓',
          label: 'Confirmed (सत्यापित)'
        };
      case 'needs_verification':
      case 'artisan_stated':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          icon: '⚠️',
          label: 'Needs Verification (पुष्टि आवश्यक)'
        };
      case 'ai_generated_draft':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          icon: '🤖',
          label: 'AI Draft (एआई ड्राफ्ट)'
        };
      case 'rejected':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fca5a5',
          icon: '✕',
          label: 'Rejected (अस्वीकृत)'
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          icon: '•',
          label: status
        };
    }
  }
}
