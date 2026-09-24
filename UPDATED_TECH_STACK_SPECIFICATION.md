# KalaSetu AI — Updated 2026 Technical Architecture & Model Stack Specification

**Event:** Smart India Hackathon (SIH 2026)  
**Theme:** Ministry of Textiles / Rural Development (Rural Artisan Linkage & Provenance)  
**Target Hardware:** Client-side Budget Android Smartphones (< 150 MB RAM) + Host AI Server (AMD Ryzen 7 7445HS + NVIDIA RTX 3050 4GB VRAM)  
**Core Innovation:** Zero-Cloud-Billing Sovereign AI Architecture combining On-Device Edge Models, Native Browser Audio, Small Multimodal Vision (VLMs), and High-Efficiency Local LLMs.

---

## 1. Updated Executive Tech Stack Matrix

| Layer | Component / Model | Deployment Target | Key Technical Metrics & Functionality |
| :--- | :--- | :--- | :--- |
| **Frontend / Client** | **React.js / PWA + Tailwind CSS** | Mobile Phone / Browser | • Packaged via PWABuilder as Trusted Web Activity (TWA) Android APK.<br>• < 150 MB RAM footprint; runs on ₹7,000 budget smartphones.<br>• Offline-first with IndexedDB v2 dual stores (`drafts` & `sync_queue`). |
| **On-Device Edge Extraction** | **Needle 3 (Cactus Compute)** *(Alternative: Jev by TypeSafe AI)* | Mobile Device / Edge | • **8–29 MB micro-footprint**; Laddered Simple Attention Network.<br>• Sub-50ms local tool-calling and structured field extraction from voice/text.<br>• **Jev:** Deterministic sub-100ms claim risk validation and department routing. |
| **Speech-to-Text (STT)** | **Browser Native STT (`webkitSpeechRecognition`) + Bhashini AI API** | Dual Client / Cloud API | • **Browser STT:** Zero-memory, zero-latency streaming across 14+ Indian regional dialects.<br>• **Bhashini AI Mission:** Sovereign Govt of India speech pipeline for 22 scheduled languages.<br>• **Sarvam AI:** High-precision Indic conversational speech fallback. |
| **Micro-Texture Vision (VLM)** | **Qwen2-VL-2B-Instruct** *(Primary)*<br>+ **PaliGemma-2-3B** *(Secondary)* | Host RTX 3050 CUDA (4GB VRAM) | • **Qwen2-VL-2B (2.21B):** **90.1% DocVQA / 79.7% TextVQA** accuracy with Dynamic Native Resolution.<br>• Identifies micro-texture weave patterns (e.g. Bagru block-print motifs, natural indigo saturation).<br>• **PaliGemma-2-3B (2.92B):** Google vision-language model for visual grounding and defect auditing.<br>• **Moondream2 (1.86B):** Ultra-fast 0.6s fallback for low-latency batch processing. |
| **Reasoning & Catalog Brain** | **Gemma 2 (2B / 9B)** / **Qwen2.5-3B-Instruct** | Host RTX 3050 CUDA / RAM | • **Gemma 2 (Google DeepMind):** State-of-the-art multilingual reasoning, knowledge distillation, and instruction following.<br>• **Qwen2.5-3B (Q4_K_M):** ~2.0 GB VRAM consumption; ~55 tokens/sec generation on RTX 3050.<br>• Generates structured catalog schemas, emotional heritage backstories, and fair pricing logic. |
| **Local Document OCR** | **Tesseract.js (v5) + Devanagari (`hin`)** | In-Browser WebAssembly (WASM) | • Client-side offline execution (80 MB RAM).<br>• Extracts handwritten receipts, daily raw material slips, and Pehchan artisan ID cards. |
| **Cloud BaaS & Vector DB** | **Supabase (Free Tier BaaS)** | Cloud Intelligence Layer | • Relational Postgres tables for listings, orders, and facilitator audit logs.<br>• User Authentication, Secure Media Buckets, and `pgvector` for similarity search. |
| **Dynamic Pricing Engine** | **Scikit-learn ML Regression + FairPrice Guard** | Edge / Python Microservice | • Cost-plus mathematical model: $C_{mat} + (T_{hours} \times R_{wage}) + OH$.<br>• Trained on Kaggle Handmade & Indo Fashion datasets; issues ₹0 labor exploitation alerts. |
| **Logistics & Provenance** | **Leaflet.js + OpenStreetMap (OSM)** | Client / Web GIS | • Boundary verification for 378+ recognized SFURTI artisan clusters.<br>• Proves physical origin dispatch within authorized GI geographic polygons. |
| **Marketplace Protocol** | **ONDC Beckn Protocol + DLT SMS Gateway** | Integration Layer | • Open Network for Digital Commerce (ONDC) Beckn protocol compliance.<br>• Transactional SMS confirmations via Fast2SMS/MSG91 DLT gateway for non-smartphones. |

---

## 2. Deep Dive: Small Vision-Language Models (VLM) on RTX 3050 (4 GB VRAM)

Micro-texture craft verification requires high-resolution visual processing without exceeding the 4.0 GB VRAM limit of the NVIDIA RTX 3050 Laptop GPU:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    SMALL VLM BENCHMARK & HARDWARE ALLOCATION (RTX 3050)                │
├──────────────────────┬─────────────┬──────────────────────────┬────────────────────────┤
│ Model Architecture   │ Scale       │ Image Resolution Strategy│ DocVQA / TextVQA Acc.  │
├──────────────────────┼─────────────┼──────────────────────────┼────────────────────────┤
│ Moondream2           │ 1.86B       │ Fixed (378 × 378)        │ 70.5% / 65.2%          │
│ SmolVLM-Instruct     │ 2.20B       │ Dynamic Patch (384 × 384)│ 81.6% / 72.7%          │
│ Qwen2-VL-2B-Instruct │ 2.21B (SOTA)│ Dynamic Native Resolution│ 90.1% / 79.7% 🏆       │
│ PaliGemma-2-3B       │ 2.92B       │ Fixed (448 × 448)        │ 84.5% / 74.1%          │
└──────────────────────┴─────────────┴──────────────────────────┴────────────────────────┘
```

### Why Qwen2-VL-2B + PaliGemma-2-3B Win for Artisans:
1. **Dynamic Native Resolution (Qwen2-VL):** Traditional models downsample images to fixed small squares (e.g. 384x384), blurring intricate handloom threads and miniature pottery paintstrokes. Qwen2-VL processes images at their native aspect ratios, reading micro-motifs accurately.
2. **Document Understanding:** Qwen2-VL achieves a staggering **90.1% DocVQA score**, effortlessly parsing crumpled handwritten mandi receipts and faded artisan Pehchan ID cards.
3. **PaliGemma-2-3B:** Google's latest open vision-language model excels at object localization and bounding-box detection, enabling **Multi-Object Visual Search** (detecting a necklace, dupatta, and vase in a single lifestyle photo).

---

## 3. Deep Dive: On-Device Edge Automation (Needle 3 & Jev)

### Needle 3 by Cactus Compute
- **Footprint:** 8 MB to 29 MB GGUF binary.
- **Function:** Runs locally on the artisan's Android smartphone or edge device without sending raw text over the network.
- **Role in KalaSetu:** Maps raw transcribed vernacular speech into immediate UI actions:
  - *"बगरू दुपट्टे की फोटो जोड़ो"* ➔ Automatically triggers Camera input.
  - *"कीमत 850 करो"* ➔ Updates the FairPrice slider state directly on the device.

### Jev by TypeSafe AI
- **Role:** High-speed deterministic decision engine (70–150ms).
- **Function:** Runs pre-validation rules on artisan product claims before pushing data to the backend, catching sensitive claims (*100% Pure Silk*, *GI Tagged*) instantly.

---

## 4. Deep Dive: Speech & Language Architecture (Browser STT + Bhashini + Gemma 2)

### 1. Dual-Layer Speech Recognition (STT):
- **Layer 1 (Browser Native Web Speech API):** Zero latency, zero RAM overhead on mobile. Transcribes spoken Hindi, Bengali, Tamil, Telugu, and Marathi directly in the WebView.
- **Layer 2 (Bhashini AI Mission):** Sovereign Government of India API for 22 scheduled languages with dialectal resilience (Rajasthani, Bhojpuri, Maithili).

### 2. Google Gemma 2 (2B & 9B) / Qwen2.5:
- **Gemma 2 2B (Q4_K_M ~1.6 GB VRAM):** Provides luxury storytelling and global English descriptions while maintaining the artisan's emotional heritage voice.
- **Gemma 2 9B (Q4_K_M ~5.2 GB mixed RAM/VRAM):** Deployed on host machines for deep buyer negotiation reasoning, anti-exploitation advice, and export market analysis.

---

## 5. End-to-End Operational Pipeline Diagram

```
[1. Acquisition]         [2. Edge Computing]         [3. Cloud & GPU Host]         [4. Marketplace Output]
 📸 Smartphone Camera    📱 Needle 3 (Edge Tools)    💻 Host RTX 3050 (CUDA)       🛍️ KalaSetu Marketplace
 🎙️ Browser Native STT  🌐 Web Speech (Hindi/Eng)   ├── Qwen2-VL-2B (Motif/OCR)   ├── Verified Passport QR
 📄 Receipt Photo        📑 Tesseract.js (WASM)      ├── Gemma 2 (Pricing/Story)   ├── Kala Reels (1-Tap Buy)
                                                     ☁️ Supabase + pgvector        └── ONDC Beckn Network
```

---

## 6. Official Datasets for Training & Grounding

1. **4th All India Handloom Census:** 35.22 Lakh artisan demographic profiles, cluster distribution, and base wage benchmarks.
2. **EPCH Annual Report 2024-25:** Export market pricing data (₹33,424 Cr handicraft export valuation) for global pricing recommendations.
3. **SFURTI Cluster Directory (MSME):** 378 recognized rural artisan craft clusters with precise GIS geographic boundaries.
4. **Kaggle Handmade Products & Indo Fashion:** Multi-category pricing regression and visual embedding training sets.
5. **Bhashini AI Mission Corpus:** 22 Indian regional languages for vernacular voice fine-tuning.
