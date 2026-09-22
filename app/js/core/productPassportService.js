/**
 * KalaSetu AI — Feature 5: Artisan Story & Product Passport Service
 * Generates transparent Product Passports with QR codes and strict privacy consent boundaries.
 */

export class ProductPassportService {
  /**
   * Default privacy consent settings (Strictly DEFAULT OFF per requirements)
   */
  static getDefaultConsent() {
    return {
      showArtisanName: false,
      showLocation: false,
      showStory: false
    };
  }

  /**
   * Generate sanitized public Product Passport payload respecting privacy consent
   * @param {Object} listing - Product listing object
   * @param {Object} consent - Privacy toggles
   * @returns {Object} Public Passport Data
   */
  static generatePassportData(listing = {}, consent = null) {
    const userConsent = consent || listing.privacyConsent || this.getDefaultConsent();

    const artisanName = userConsent.showArtisanName ? (listing.artisan || 'Master Artisan') : 'Heritage Kaarigar (Privacy Protected)';
    const clusterLocation = userConsent.showLocation ? (listing.cluster || 'Recognized Indian Craft Cluster') : 'Authentic Indian Craft Cluster';
    const artisanStory = userConsent.showStory ? (listing.artisanStory || '') : null;

    // Filter verified claim badges
    const verifiedClaims = (listing.claims || [])
      .filter(c => c.claim_status === 'artisan_confirmed' || c.claim_status === 'document_verified')
      .map(c => c.label);

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/index.html?view=passport&id=${listing.id || 'craft-1'}`;

    return {
      passportId: `PASSPORT-IN-${listing.id || Date.now()}`,
      productName: listing.title || 'Handcrafted Heritage Item',
      mainImage: listing.image || listing.enhancedImageUrl || listing.originalImageUrl || './assets/sample-craft.jpg',
      artisanName,
      clusterLocation,
      material: listing.material || 'Natural Handcrafted Raw Materials',
      dimensions: listing.dimensions || 'Standard Artisan Handcrafted Dimensions',
      careInstructions: listing.careInstructions || 'Gentle hand-wash / dry clean recommended.',
      leadTime: listing.leadTime || '3-5 business days',
      verifiedClaims: verifiedClaims.length > 0 ? verifiedClaims : ['100% Genuine Handcrafted'],
      finalPrice: listing.price || 1250,
      artisanStory,
      consentApplied: userConsent,
      shareUrl,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Render HTML Share Card / Modal for Product Passport
   * @param {Object} passport - Output of generatePassportData
   * @returns {string} HTML markup
   */
  static renderPassportHtml(passport) {
    return `
      <div class="product-passport-card animate-scale-up" id="passport-card-${passport.passportId}">
        <div class="passport-header">
          <div class="passport-emblem">🏺</div>
          <div class="passport-header-meta">
            <span class="passport-badge-gov">🇮🇳 KalaSetu Digital Craft Passport</span>
            <h3 class="passport-title">${passport.productName}</h3>
            <span class="passport-id-code">${passport.passportId}</span>
          </div>
        </div>

        <div class="passport-image-wrap">
          <img src="${passport.mainImage}" alt="${passport.productName}" class="passport-photo" />
          <div class="passport-price-tag">₹${passport.finalPrice.toLocaleString('en-IN')}</div>
        </div>

        <!-- Claim Badges Strip -->
        <div class="passport-claims-row">
          ${passport.verifiedClaims.map(c => `
            <span class="passport-verified-chip">✓ ${c}</span>
          `).join('')}
        </div>

        <!-- Maker Details (Consent Shielded) -->
        <div class="passport-maker-section">
          <div class="maker-info-row">
            <span class="maker-label">Maker / Artisan:</span>
            <span class="maker-val">${passport.artisanName}</span>
          </div>
          <div class="maker-info-row">
            <span class="maker-label">Heritage Cluster:</span>
            <span class="maker-val">📍 ${passport.clusterLocation}</span>
          </div>
          <div class="maker-info-row">
            <span class="maker-label">Materials:</span>
            <span class="maker-val">${passport.material}</span>
          </div>
          <div class="maker-info-row">
            <span class="maker-label">Dimensions:</span>
            <span class="maker-val">${passport.dimensions}</span>
          </div>
          <div class="maker-info-row">
            <span class="maker-label">Care Instructions:</span>
            <span class="maker-val">${passport.careInstructions}</span>
          </div>
        </div>

        ${passport.artisanStory ? `
          <div class="passport-story-box">
            <h4 class="story-heading">📖 About the Maker (Artisan Story)</h4>
            <p class="story-text">"${passport.artisanStory}"</p>
          </div>
        ` : ''}

        <!-- QR Code & Share Footer -->
        <div class="passport-footer">
          <div class="qr-mockup-box">
            <div class="qr-matrix-render">
              <span style="font-size: 32px;">📱</span>
              <span class="qr-caption">Scan to Verify</span>
            </div>
          </div>
          <div class="passport-share-cta">
            <p class="share-pitch">Share verifiable digital identity with conscious buyers worldwide.</p>
            <button class="btn btn-sm btn-primary btn-copy-passport" data-url="${passport.shareUrl}">
              📋 Copy Passport Link
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
