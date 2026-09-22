# KalaSetu AI (SIH26090) — Rural Artisan Market Linkage & Smart Cataloging PWA

An AI-driven, multilingual, offline-first Progressive Web Application designed for marginalized rural artisans and weavers in India. Co-designed with master kaarigars across **Bagru, Sanganer, and Jaipur Blue Pottery** craft clusters.

---

## Table of Contents
1. [Core Differentiation Features (Integrated)](#core-differentiation-features)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Environment Variables & Configuration](#environment-variables--configuration)
4. [Database & Storage Setup](#database--storage-setup)
5. [How to Test ClaimSafe Verification](#how-to-test-claimsafe-verification)
6. [How to Test Offline Drafts & Sync](#how-to-test-offline-drafts--sync)
7. [Example Payloads & Schemas](#example-payloads--schemas)
8. [Automated Test Suite](#automated-test-suite)
9. [Local Development & Demo Server](#local-development--demo-server)

---

## Core Differentiation Features

### 🛡️ Feature 1: ClaimSafe AI / Product Claim Verification
- **Purpose**: Prevents AI-generated catalogs from making unsupported, deceptive, or misleading claims (e.g. *pure silk*, *100% cotton*, *GI-tagged*, *natural dye*, *authentic pashmina*, *food safe*, *chemical-free*).
- **Claim States**: `ai_generated_draft`, `artisan_stated`, `artisan_confirmed`, `document_verified`, `needs_verification`, `rejected`.
- **Claim Sources**: `ai`, `artisan_voice`, `artisan_manual_input`, `facilitator`, `uploaded_document`.
- **Enforcement Gate**: High-risk unconfirmed claims cannot be published until explicitly confirmed by the artisan or verified via uploaded documentation.

### 📸 Feature 2: Truthful Image Studio / Safe Image Policy
- **Purpose**: Preserves authentic handmade details without synthetic or generative alteration of motifs, pottery shapes, or fabric weaves.
- **Dual Storage**: Stores both `originalImageUrl` and `enhancedImageUrl`.
- **Quality Checks**: Automated client-side canvas checks for blur (Laplacian variance), low exposure, and harsh glare highlights.
- **Guidance Cards**: Actionable Hindi-English tips (*"Photo thodi blur hai. Product ko stable surface par rakhkar dobara photo lein"*).
- **Comparison Tool**: One-tap Before/After toggle on craft preview.

### ⚖️ Feature 3: FairPrice Guard / Transparent Pricing
- **Purpose**: Replaces black-box pricing with an explainable cost-plus breakdown.
- **Formulas**:
  $$\text{Minimum Safe Price} = \text{Material} + \text{Labor} + \text{Packaging} + \text{Transport} + \text{Overhead}$$
  $$\text{Suggested Retail} = \text{Minimum Safe Price} \times (1 + \text{Profit Margin} / 100)$$
  $$\text{Suggested Wholesale} = \text{Minimum Safe Price} \times (1 + \text{Wholesale Margin} / 100)$$
- **Labor-Protection Alerts**:
  - Triggers warning if `labourCost === 0`.
  - Danger alert if `finalArtisanPrice < minimumSafePrice`.
  - Alert if AI market suggestion undercuts artisan cost.

### 💬 Feature 4: Craft-Aware Missing-Field Questions
- **Purpose**: Replaces tedious multi-page forms with short, conversational single questions.
- **Templates**:
  - `block_print_textile`: Length, width, dye type, care guide, stock count.
  - `jaipur_blue_pottery`: Dimensions, fragility, glaze finish, care instructions.
- **Zero-Hallucination Rule**: AI never infers certification or materials without explicit confirmation.
- **Answer Methods**: Both keyboard typing and voice speech input.

### 🛂 Feature 5: Artisan Story & Product Passport
- **Purpose**: Preserves craft heritage and provides verifiable provenance to buyers.
- **Product Passport**: Digital share card featuring craft cluster, care guide, verified claim badges, and QR code.
- **Strict Privacy Consent (Default OFF)**:
  - `showArtisanName`: false (by default renders as *Heritage Kaarigar*)
  - `showLocation`: false (by default renders as *Authentic Indian Craft Cluster*)
  - `showStory`: false (story hidden until artisan toggles ON)

### 📴 Feature 6: Offline Draft + Sync Status Engine
- **Purpose**: Enables full listing creation and bookkeeping in areas with zero internet.
- **Sync States**: `Saved on device`, `Waiting to sync`, `Syncing`, `Synced`, `Sync failed`.
- **Conflict Handling**: Concurrent update conflicts automatically create recoverable `[Conflict Copy - <timestamp>]` entries without overwriting user data.
- **Manual Sync**: Instant "Sync Now" trigger in the network status bar.

### 🤝 Feature 7: Facilitator / NGO Review Mode
- **Roles**: `artisan` (default), `facilitator`, `admin`.
- **Desk Dashboard**: 5 live metrics (Total Assigned Kaarigars, Drafts, Needs Verification, Facilitator Reviewed, Published Storefront).
- **Review Notes**: Facilitators add field guidance and review remarks while the artisan retains final authority over pricing and publishing.

---

## Tech Stack & Architecture

- **Frontend**: Vanilla ES6+ SPA/PWA with extensible `featureRegistry` and reactive `appState`.
- **Styles**: Pure Vanilla CSS (`styles.css`, `landing.css`) with light & calm heritage palettes (Ivory `#f8fafc`, Terracotta `#b85d38`, Deep Slate `#1e314b`).
- **Database**: IndexedDB (`KalaSetuDB` v2) with object stores: `listings`, `drafts`, `sync_queue`, `hisab`.
- **Maps**: OpenStreetMap + Leaflet.js (100% free, zero external API billing).
- **AI Brain**:
  - **Groq Cloud** (Llama 3.3 70B for sub-second catalog extraction)
  - **Google Gemini 2.0 Flash** (Multimodal Vision document OCR & craft motif inspection)
  - **Gnani.ai & Web Speech API** (Indian regional speech transcription across 9 languages)

---

## Environment Variables & Configuration

Configuration is managed in `app/js/core/aiConfig.js` and persisted in `localStorage`. Zero mandatory environment variables required to run in offline/local heuristic mode.

| Key | Storage / Location | Description | Default Fallback |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | `localStorage: kalasetu_ai_config` | Groq LPU API Token | Local heuristic regex parser |
| `GEMINI_API_KEY` | `localStorage: kalasetu_ai_config` | Google Gemini Vision API Key | Local canvas analyzer |
| `GNANI_API_KEY` | `localStorage: kalasetu_ai_config` | Gnani.ai regional STT token | Web Speech API (`webkitSpeechRecognition`) |

---

## Database & Storage Setup

KalaSetu AI uses browser **IndexedDB** (`KalaSetuDB`). Version 2 upgrades automatically via `onupgradeneeded`:

```javascript
// Stores created in KalaSetuDB v2:
1. 'listings'    // Key: id (autoIncrement). Indexes: 'synced', 'createdAt'
2. 'drafts'      // Key: draftId. Index: 'updatedAt'
3. 'sync_queue'  // Key: queueId (autoIncrement). Index: 'attempts'
4. 'hisab'       // Key: id (autoIncrement). Index: 'date'
```

### Migration Steps:
Upgrading from v1 to v2 is fully automatic. Opening the application triggers `indexedDB.open('KalaSetuDB', 2)` which adds `drafts` and `sync_queue` without altering existing listings.

---

## How to Test ClaimSafe Verification

1. Open the app at `http://localhost:8080/index.html`.
2. In the **Voice Catalog** tab (`Card 1`), tap **1-Tap Sample Voice Demo**.
3. Notice that the voice note contains *"100% कॉटन"* and *"प्राकृतिक नील रंग"*.
4. In **Card 3 (AI Generated Listing)**, view the **Trust & Verification** card:
   - Claims like **Natural Dye** and **100% Cotton** will appear as yellow chips (`Needs Verification`).
   - Notice the warning prompt: *"Is claim ko publish karne se pehle artisan se confirm karein."*
5. Tap **✓ Confirm** on a claim to turn it green (`artisan_confirmed`), or tap **✕ Remove** to strip it.
6. Try clicking **Approve & Add to Catalog** with unverified claims: the validation gate will prompt the artisan to confirm before publication.

---

## How to Test Offline Drafts & Sync

1. In DevTools, set Network to **Offline** (or toggle your computer's Wi-Fi).
2. The network status bar updates to: `Offline Mode · Saved Locally` (red status dot).
3. Take a craft photo and record voice details.
4. Click **Approve & Add to Catalog**:
   - The listing is saved locally to IndexedDB `listings` with `synced: 0` and status `Waiting to sync`.
5. Re-enable network connectivity in DevTools.
6. KalaSetu AI automatically detects the network reconnection, flushes the `sync_queue`, updates the status to `Synced (सत्यापित व सुरक्षित)`, and shows a success toast.
7. You can also tap **🔄 Sync Now** at any time.

---

## Example Payloads & Schemas

### 1. Product Listing with ClaimSafe & FairPrice Schema
```json
{
  "id": 1,
  "title": "Bagru Hand-Block Printed Cotton Dupatta",
  "category": "Textiles & Handloom",
  "material": "100% Pure Cotton & Natural Indigo",
  "dimensions": "2.5m x 0.9m",
  "leadTime": "3 Days",
  "stockQuantity": "5 pieces",
  "careInstructions": "Cold gentle hand wash, dry in shade",
  "descHi": "प्रामाणिक बगरू हैंड-ब्लॉक दुपट्टा।",
  "descEn": "Authentic Bagru hand-block printed cotton dupatta.",
  "originalImageUrl": "data:image/jpeg;base64,...",
  "enhancedImageUrl": "data:image/jpeg;base64,...",
  "imageIntegrityStatus": "safely_enhanced",
  "artisan": "Ramji Lal Meena",
  "cluster": "Bagru / Sanganer (Jaipur)",
  "price": 1300,
  "pricingBreakdown": {
    "costs": {
      "materialCost": 350,
      "labourCost": 500,
      "packagingCost": 50,
      "transportCost": 50,
      "overheadCost": 50
    },
    "minimumSafePrice": 1000,
    "suggestedRetailPrice": 1300,
    "suggestedWholesalePrice": 1150,
    "bulkUnitPrice": 1035
  },
  "claims": [
    {
      "key": "natural_dye",
      "label": "Natural / Organic Dye",
      "claim_status": "artisan_confirmed",
      "claim_source": "artisan_manual_input"
    },
    {
      "key": "gi_tagged",
      "label": "GI Tagged / Certified",
      "claim_status": "artisan_confirmed",
      "claim_source": "artisan_voice"
    }
  ],
  "privacyConsent": {
    "showArtisanName": false,
    "showLocation": false,
    "showStory": false
  },
  "listingStatus": "approved",
  "synced": 1
}
```

---

## Automated Test Suite

The repository includes a comprehensive Node.js unit test suite verifying all core differentiation logic:

```bash
# Run unit tests
node tests/differentiation_features.test.js
# Or via npm
npm test
```

### Test Coverage:
- `Feature 1`: Risky claim regex and token detection.
- `Feature 1`: Publishing restriction gate checks.
- `Feature 1`: Public text sanitizer and claim masking.
- `Feature 3`: Minimum safe price & retail/wholesale math.
- `Feature 3`: Labor-protection and below-cost warning alerts.
- `Feature 4`: Craft template matching and missing field detection.
- `Feature 5`: Product Passport privacy consent boundaries (Default OFF).
- `Feature 6`: Offline sync queue and conflict copy preservation.

---

## Local Development & Demo Server

```bash
# Start local development server
python -m http.server 8080 --directory app
```

- **Artisan PWA Portal**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Official Heritage Landing Page**: [http://localhost:8080/landing.html](http://localhost:8080/landing.html)
