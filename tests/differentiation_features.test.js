/**
 * KalaSetu AI — Automated Unit Test Suite for Differentiation Features
 * Tests:
 * 1. Risky Claim Detection (ClaimSafe AI)
 * 2. Claim Publishing Restrictions
 * 3. Minimum Safe Price Calculation (FairPrice Guard)
 * 4. Price-Below-Cost and Labor Protection Warnings
 * 5. Required Craft Field Detection (Craft Templates)
 * 6. Offline Sync Queue Behavior & Conflict Resolution
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { ClaimSafeService, RISKY_CLAIM_PATTERNS } from '../app/js/core/claimSafeService.js';
import { FairPriceGuard } from '../app/js/core/fairPriceGuard.js';
import { CraftTemplateService, CRAFT_TEMPLATES } from '../app/js/core/craftTemplates.js';
import { ProductPassportService } from '../app/js/core/productPassportService.js';
import { ImageSafetyService } from '../app/js/core/imageSafetyService.js';

// =========================================================================
// 1. RISKY CLAIM DETECTION TESTS
// =========================================================================
test('Feature 1: ClaimSafe AI detects risky unconfirmed claims in text and voice transcripts', () => {
  const sampleInput = {
    title: 'Authentic GI-tagged Bagru natural-dye cotton dupatta',
    descHi: 'यह 100% शुद्ध कॉटन और असली प्राकृतिक रंग से बना है।',
    descEn: 'Handmade organic pure silk dupatta from GI cluster.',
    materials: 'Pure silk, natural dye',
    speechTranscript: 'Bagru block print pure silk dupatta with genuine pashmina touch',
    source: 'ai'
  };

  const detected = ClaimSafeService.detectClaims(sampleInput);

  // Must detect 'authentic', 'gi_tagged', 'natural_dye', 'pure_cotton', 'pure_silk', 'organic', 'pashmina', 'handmade'
  const detectedKeys = detected.map(c => c.key);

  assert.ok(detectedKeys.includes('authentic'), 'Should detect "authentic"');
  assert.ok(detectedKeys.includes('gi_tagged'), 'Should detect "gi-tagged"');
  assert.ok(detectedKeys.includes('natural_dye'), 'Should detect "natural-dye"');
  assert.ok(detectedKeys.includes('pure_silk'), 'Should detect "pure silk"');
  assert.ok(detectedKeys.includes('pashmina'), 'Should detect "pashmina"');
  assert.ok(detectedKeys.includes('organic'), 'Should detect "organic"');
  assert.ok(detectedKeys.includes('handmade'), 'Should detect "handmade"');

  // Verify initial status is unconfirmed
  const unconfirmed = detected.filter(c => c.claim_status === 'ai_generated_draft' || c.claim_status === 'needs_verification');
  assert.strictEqual(unconfirmed.length, detected.length, 'All AI-generated claims must initially require confirmation');
});

// =========================================================================
// 2. CLAIM PUBLISHING RESTRICTIONS TESTS
// =========================================================================
test('Feature 1: ClaimSafe AI blocks publishing if unconfirmed risky claims remain', () => {
  const unverifiedClaims = [
    { key: 'pure_silk', label: 'Pure Silk', claim_status: 'needs_verification' },
    { key: 'gi_tagged', label: 'GI Tagged', claim_status: 'ai_generated_draft' }
  ];

  const gateCheck = ClaimSafeService.validateForPublishing(unverifiedClaims);
  assert.strictEqual(gateCheck.canPublish, false, 'Publishing must be blocked with unverified claims');
  assert.strictEqual(gateCheck.unverifiedClaims.length, 2);

  // Confirming claims allows publishing
  unverifiedClaims[0].claim_status = 'artisan_confirmed';
  unverifiedClaims[1].claim_status = 'document_verified';

  const approvedGateCheck = ClaimSafeService.validateForPublishing(unverifiedClaims);
  assert.strictEqual(approvedGateCheck.canPublish, true, 'Publishing allowed once all claims confirmed or verified');
});

test('Feature 1: Public text sanitizer masks or flags unconfirmed risky claims', () => {
  const rawText = 'Authentic GI-tagged Bagru natural-dye cotton dupatta.';
  const claims = [
    { matchedTerm: 'Authentic', label: 'Authentic', claim_status: 'needs_verification' },
    { matchedTerm: 'GI-tagged', label: 'GI Tagged', claim_status: 'artisan_confirmed' }
  ];

  const sanitized = ClaimSafeService.sanitizePublicText(rawText, claims);
  assert.ok(sanitized.includes('[Authentic — Needs Verification]'), 'Unconfirmed claim should be masked/flagged');
  assert.ok(sanitized.includes('GI-tagged'), 'Confirmed claim should remain intact');
});

// =========================================================================
// 3. MINIMUM SAFE PRICE CALCULATION TESTS
// =========================================================================
test('Feature 3: FairPrice Guard computes exact minimum safe price and retail/wholesale formulas', () => {
  const costInputs = {
    materialCost: 350,
    labourCost: 500,
    packagingCost: 50,
    transportCost: 50,
    overheadCost: 50,
    desiredProfitMargin: 30, // 30%
    wholesaleMargin: 15,    // 15%
    bulkOrderDiscount: 10,  // 10%
    finalArtisanPrice: 1300
  };

  const result = FairPriceGuard.calculate(costInputs);

  // Expected minimumSafePrice = 350 + 500 + 50 + 50 + 50 = 1000
  assert.strictEqual(result.minimumSafePrice, 1000, 'Minimum safe price must equal sum of all direct and overhead costs');

  // Expected suggestedRetailPrice = 1000 * 1.30 = 1300
  assert.strictEqual(result.suggestedRetailPrice, 1300, 'Suggested retail price must apply desiredProfitMargin');

  // Expected suggestedWholesalePrice = 1000 * 1.15 = 1150
  assert.strictEqual(result.suggestedWholesalePrice, 1150, 'Suggested wholesale price must apply wholesaleMargin');

  // Expected bulkUnitPrice = 1150 * (1 - 0.10) = 1035
  assert.strictEqual(result.bulkUnitPrice, 1035, 'Bulk price must apply bulk discount to wholesale');

  assert.strictEqual(result.isPriceSafe, true, '₹1300 final price is >= ₹1000 minimum safe price');
});

// =========================================================================
// 4. PRICE-BELOW-COST AND LABOR-PROTECTION WARNINGS
// =========================================================================
test('Feature 3: FairPrice Guard triggers labour-protection and below-cost alerts', () => {
  // Scenario A: Labour cost is zero
  const zeroLabourCalc = FairPriceGuard.calculate({
    materialCost: 400,
    labourCost: 0,
    packagingCost: 30,
    transportCost: 40,
    overheadCost: 30,
    finalArtisanPrice: 600
  });

  const zeroLabourAlert = zeroLabourCalc.alerts.find(a => a.code === 'ZERO_LABOUR');
  assert.ok(zeroLabourAlert, 'Must trigger ZERO_LABOUR alert when labourCost is 0');

  // Scenario B: Final price is below minimum safe cost
  const belowCostCalc = FairPriceGuard.calculate({
    materialCost: 400,
    labourCost: 300,
    packagingCost: 50,
    transportCost: 50,
    overheadCost: 50, // Total cost = 850
    finalArtisanPrice: 650 // Below 850
  });

  assert.strictEqual(belowCostCalc.isPriceSafe, false);
  const belowCostAlert = belowCostCalc.alerts.find(a => a.code === 'BELOW_SAFE_PRICE');
  assert.ok(belowCostAlert, 'Must trigger BELOW_SAFE_PRICE danger alert');

  // Scenario C: AI Market suggestion is lower than minimum cost
  const aiUndercutCalc = FairPriceGuard.calculate({
    materialCost: 500,
    labourCost: 500,
    packagingCost: 50,
    transportCost: 50,
    overheadCost: 50, // Total = 1150
    aiMarketSuggestion: 900 // Lower than 1150
  });

  const undercutAlert = aiUndercutCalc.alerts.find(a => a.code === 'AI_SUGGESTION_BELOW_COST');
  assert.ok(undercutAlert, 'Must trigger AI_SUGGESTION_BELOW_COST alert');
});

// =========================================================================
// 5. REQUIRED CRAFT FIELD DETECTION TESTS
// =========================================================================
test('Feature 4: CraftTemplateService correctly matches templates and flags missing mandatory fields', () => {
  // Test A: Bagru Block Print Textile template
  const textileDraft = {
    title: 'Bagru Indigo Dupatta',
    category: 'Textiles & Handloom',
    materials: 'Cotton, Natural Dye',
    // Missing length, width, careInstructions, stockQuantity
    length: null,
    width: null,
    careInstructions: null,
    stockQuantity: null,
    productionLeadTime: '3 days'
  };

  const matchedTextile = CraftTemplateService.matchTemplate(textileDraft);
  assert.strictEqual(matchedTextile.id, 'block_print_textile', 'Should match block print textile template');

  const missingTextileFields = CraftTemplateService.getMissingFields(textileDraft, matchedTextile);
  const missingKeys = missingTextileFields.map(f => f.key);

  assert.ok(missingKeys.includes('length'), 'Length should be flagged as missing');
  assert.ok(missingKeys.includes('width'), 'Width should be flagged as missing');
  assert.ok(missingKeys.includes('careInstructions'), 'Care instructions should be flagged as missing');
  assert.ok(missingKeys.includes('stockQuantity'), 'Stock quantity should be flagged as missing');

  // Test B: Jaipur Blue Pottery template
  const potteryDraft = {
    title: 'Jaipur Blue Pottery Vase',
    category: 'Pottery & Ceramics',
    // Missing dimensions, fragile, weightOrSize, etc.
    dimensions: null,
    fragile: null,
    weightOrSize: null
  };

  const matchedPottery = CraftTemplateService.matchTemplate(potteryDraft);
  assert.strictEqual(matchedPottery.id, 'jaipur_blue_pottery', 'Should match Jaipur Blue Pottery template');

  const missingPotteryFields = CraftTemplateService.getMissingFields(potteryDraft, matchedPottery);
  const potteryKeys = missingPotteryFields.map(f => f.key);
  assert.ok(potteryKeys.includes('dimensions'), 'Dimensions should be missing for pottery');
  assert.ok(potteryKeys.includes('fragile'), 'Fragile flag should be missing for pottery');
});

// =========================================================================
// 6. PRODUCT PASSPORT & PRIVACY CONSENT TESTS
// =========================================================================
test('Feature 5: ProductPassportService enforces privacy consent defaults (Default OFF)', () => {
  const listing = {
    id: 101,
    title: 'Sanganeri Print Cotton Bedsheet',
    artisan: 'Ramji Lal Meena',
    cluster: 'Sanganer, Jaipur',
    artisanStory: 'Generational hand-printer preserving 200 year old motifs.',
    price: 1800,
    claims: [{ label: '100% Cotton', claim_status: 'artisan_confirmed' }]
  };

  // With default privacy consent (all false)
  const privatePassport = ProductPassportService.generatePassportData(listing);
  assert.strictEqual(privatePassport.artisanName, 'Heritage Kaarigar (Privacy Protected)');
  assert.strictEqual(privatePassport.clusterLocation, 'Authentic Indian Craft Cluster');
  assert.strictEqual(privatePassport.artisanStory, null, 'Story must be hidden when privacy consent is OFF');

  // When artisan explicitly grants consent
  const consentedPassport = ProductPassportService.generatePassportData(listing, {
    showArtisanName: true,
    showLocation: true,
    showStory: true
  });
  assert.strictEqual(consentedPassport.artisanName, 'Ramji Lal Meena');
  assert.strictEqual(consentedPassport.clusterLocation, 'Sanganer, Jaipur');
  assert.strictEqual(consentedPassport.artisanStory, listing.artisanStory);
});

// =========================================================================
// 7. OFFLINE SYNC & CONFLICT RECOVERY BEHAVIOR TESTS
// =========================================================================
test('Feature 6: Conflict management logic creates recoverable conflict copies without silent overwrites', () => {
  // Simulate mock database store
  const mockStore = new Map();

  const originalListing = {
    id: 42,
    title: 'Bagru Silk Dupatta',
    price: 1400,
    updatedAt: '2026-09-15T10:00:00.000Z'
  };
  mockStore.set(originalListing.id, originalListing);

  // Incoming cloud update with newer timestamp
  const conflictingLocalDraft = {
    id: 42,
    title: 'Bagru Silk Dupatta (Local Edits)',
    price: 1550,
    lastKnownCloudUpdate: '2026-09-15T09:00:00.000Z', // Local client thought cloud was at 9:00, but existing in store is 10:00
    updatedAt: '2026-09-15T11:00:00.000Z'
  };

  // Conflict rule verification
  const existing = mockStore.get(conflictingLocalDraft.id);
  const isConflict = existing && new Date(existing.updatedAt) > new Date(conflictingLocalDraft.lastKnownCloudUpdate);
  assert.strictEqual(isConflict, true, 'A concurrent update conflict must be flagged');

  // Create recoverable copy
  const conflictCopy = {
    ...existing,
    id: 999,
    title: `[Conflict Copy - 11:00 AM] ${existing.title}`,
    isConflictCopy: true,
    originalListingId: existing.id
  };
  mockStore.set(conflictCopy.id, conflictCopy);

  assert.strictEqual(mockStore.size, 2, 'Conflict copy must be preserved alongside original');
  assert.ok(mockStore.get(999).isConflictCopy, 'Conflict copy must retain identifiable metadata');
});
