# SIH26090: Advanced Feature Specification & Technical Architecture
**Project**: AI-Driven Zero-Barrier Market Linkage & Smart Cataloging Ecosystem for Marginalized Artisans
**Author**: SIH Development Team | **Date**: September 2026

---

## 🌟 Executive Summary of New Features
This specification outlines the integration of **Buyer-Facing AI Discovery & Customization** and **Seller-Facing AI Micro-Business Management** into the SIH26090 platform. The goal is to build an emotionally engaging, high-trust ecosystem connecting local artisans, micro-entrepreneurs, and handicraft creators directly with national and global consumers.

---

## 📱 Feature Breakdown & Architecture

### 1. 💬 Instant SMS Order Confirmation & Notifications
* **Purpose:** Instant order confirmation and status dispatch without requiring active mobile data. Rural logistics and Indian consumer habits rely heavily on SMS for transactional legitimacy.
* **Workflow:**
  1. Customer places order $\rightarrow$ Trigger event in backend (`orders.create`).
  2. Backend queues transactional SMS payload (Order ID, Item Name, Artisan Name, Estimated Dispatch Date, Tracking Link).
  3. Dispatches via DLT-compliant SMS Gateway.
* **Tech Stack:**
  - **Gateway:** Fast2SMS / MSG91 / Twilio (Free trial/Indian DLT compliant).
  - **Fallback:** WhatsApp Business Cloud API / Webhook notification.

---

### 2. 🗺️ Map-Based Location Tracking & Cluster Geo-Fencing
* **Purpose:** Visual, transparent delivery tracking from the rural artisan cluster hub (e.g., Sanganer or Bastar) to the buyer's doorstep, establishing authenticity and local provenance.
* **Core Capabilities:**
  - **Cluster Geo-Fencing:** Pre-mapped polygons around recognized craft clusters (SFURTI clusters, One District One Product - ODOP zones). When a pickup occurs within the geo-fence, the product gets an automated *"Cluster Origin Verified"* badge.
  - **Live Delivery Map:** Interactive map showing movement across hubs (Rural SHG Hub $\rightarrow$ District Aggregation Center $\rightarrow$ Buyer City).
* **Tech Stack:**
  - **Mapping:** OpenStreetMap (OSM) + Leaflet.js / MapLibre GL (Zero cost, open-source).
  - **Logistics Protocol:** ONDC Beckn Protocol `track` API combined with 3PL webhooks (Delhivery/Shadowfax).

---

### 3. 🎙️ AI Daily Business Summary ("Dukandar Hisab-Kitab" Manager)
* **Purpose:** Overcoming rural innumeracy and digital bookkeeping barriers for illiterate or semi-literate artisans.
* **Key Metrics Tracked:**
  1. **Material Consumption:** E.g., *"Aaj 8 meters Chanderi silk aur 300g natural indigo use hua."*
  2. **Earnings & Revenue:** Gross sales, pending payouts, platform fees (0% for rural artisans).
  3. **Order Status:** Orders completed today, orders packed, orders pending dispatch.
* **Artisan Interface:**
  - Spoken two-way voice prompt via Bhashini: *"Kaka, aaj ka hisab suniye: Aaj aapne 3 order poore kiye aur ₹2,400 kamaye. 2 order abhi baaki hain."*
  - High-contrast visual card dashboard with large numerical fonts and color-coded statuses (Green = Paid, Yellow = Pending).
* **Tech Stack:**
  - **Database Aggregation:** SQL summary query running on Supabase / PostgreSQL.
  - **Voice Output:** Bhashini Text-to-Speech (TTS) in regional languages (Hindi, Marathi, Bengali, Tamil, etc.).

---

### 4. 🔍 AI Visual Search & Image Matching ("Reels-to-Artisan" Engine)
* **Purpose:** Bridging social media inspiration with rural craft discovery. Users take a screenshot of a handmade saree, ceramic plate, or brass lamp from Instagram Reels, Pinterest, or YouTube Shorts and find it on the platform.
* **Workflow:**
  1. User uploads screenshot or photo.
  2. **Visual Feature Extraction:** The image is passed to a lightweight visual embedding model (OpenAI CLIP / MobileCLIP).
  3. **Vector Similarity Search:** Embeddings are matched against the platform's product catalog embeddings using cosine similarity.
  4. Returns: Ranked list of identical or aesthetically similar artisan products with prices and craft origin.
* **Tech Stack:**
  - **Embedding Model:** MobileCLIP / CLIP ViT-B/32 (Runs on free tier or client-side ONNX).
  - **Vector Database:** PostgreSQL `pgvector` on Supabase / FAISS.

---

### 5. 🎨 Bespoke Custom Order Pipeline ("Direct Artisan Request")
* **Purpose:** If a user finds a dream product on social media that is **not** currently listed, they can commission an artisan to create it.
* **Workflow:**
  1. User clicks *"Can't find this? Request Custom Creation"*.
  2. App tags the craft category (e.g., Blue Pottery, Terracotta, Wood Carving) from the uploaded image.
  3. Generates a structured Request for Quote (RFQ) broadcasted to verified artisans in that craft category.
  4. Artisans receive a voice note and image preview $\rightarrow$ Artisan quotes price & turnaround time via voice.
  5. Buyer approves quote $\rightarrow$ Funds held in escrow milestone until artisan uploads completion photo $\rightarrow$ Shipped.

---

### 6. 🛋️ AI Home Decor & Room Space Stager ("Vastu-Craft Room Advisor")
* **Purpose:** Helping modern urban homeowners and interior designers incorporate traditional Indian handicrafts into contemporary spaces.
* **Workflow:**
  1. User uploads a photo of an empty wall, coffee table, hallway, or living room.
  2. **Multimodal Scene Analysis:** Multimodal AI (Gemini Vision) analyzes:
     - Wall color & texture (e.g., Warm Beige, Exposed Brick, Minimal White).
     - Lighting conditions (Natural ambient, Warm LED).
     - Available space & furniture design (Modern Scandinavian, Bohemian, Traditional Indian).
  3. **Recommendation Engine:** Suggests specific craft pairings:
     - E.g., *"For your beige living room wall: A 36-inch Bastar Dhokra Bell Wall Hanging or a Madhubani Triptych Painting will provide a stunning high-contrast centerpiece."*
  4. Generates an AR / visual overlay preview of the craft placed in their actual room photo.
  5. One-click purchase of recommended items directly from the makers.

---

### 7. 👤 Verified Creator Profiles & Direct-to-Consumer Storefronts
* **Purpose:** Elevating artisans from anonymous factory suppliers to celebrated cultural creators and micro-entrepreneurs.
* **Profile Components:**
  - **Artisan Bio & Heritage:** Lineage (e.g., *"4th Generation Sanganeri Block Printer"*), awards, GI (Geographical Indication) tag certificates.
  - **Portfolio & Catalog:** Showcase of masterworks and items available for immediate order.
  - **Direct Storefront Link & QR Code:** Custom shareable URL (e.g., `karigar.in/@ramesh-sanganer`) for artisans to share directly on WhatsApp and local fairs.

---

### 8. 🎥 10-Second Artisan Micro-Videos ("KalaReels" & Authenticity Feed)
* **Purpose:** Proving authentic handcrafting, humanizing the creator, and destroying buyer skepticism about machine-made fakes.
* **Workflow:**
  1. Artisan shoots a ~10-second video of their hands working (potter's wheel spinning, handloom shuttling, chisel carving wood).
  2. **AI Content Studio Assistant:**
     - Auto-generates catchy titles, craft storytelling captions, and tags (e.g., `#PureHandloom #VocalForLocal #ArtisanCrafted`).
     - Cleans audio or overlays serene ambient Indian classical / loom acoustic sound.
  3. Videos appear in a vertical TikTok/Reels-style "Craft Discovery Feed" where users can swipe through authentic making processes and click *"Buy This Piece"* directly from the video.

---

## 🏗️ End-to-End System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                               BUYER APPLICATION                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Visual Search      |  | AI Room Stager     |  | KalaReels Video Feed        |  |
|  | (Screenshot Match) |  | (Upload Wall/Room) |  | (10s Making Videos)         |  |
|  +---------+----------+  +---------+----------+  +--------------+--------------+  |
+------------|-----------------------|----------------------------|-----------------+
             |                       |                            |
             v                       v                            v
+-----------------------------------------------------------------------------------+
|                               AI SERVICE LAYER                                    |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | CLIP ViT Vector    |  | Gemini Vision      |  | Bhashini Voice / AI Content |  |
|  | Similarity Engine  |  | Room Decor Engine  |  | Auto-Captioning Studio      |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                         BACKEND & LOGISTICS INTEGRATION                           |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Supabase DB & Auth |  | ONDC Beckn / Maps  |  | SMS Gateway (DLT / MSG91)   |  |
|  | (pgvector search)  |  | Geo-Fencing Engine |  | Instant Order Confirmation  |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                              ARTISAN APPLICATION                                  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Voice Dukandar     |  | Custom Order RFQ   |  | Direct Storefront           |  |
|  | Daily Hisab-Kitab  |  | Quoting Engine     |  | Profile & Portfolio         |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🏆 How These Features Win SIH26090
1. **Solves the #1 Problem in Indian Handicrafts (Trust & Fakes):** The 10-second video feed and Cluster Geo-fencing provide unforgeable proof of authenticity.
2. **Solves the E-Commerce Barrier for Buyers:** Visual search allows Gen-Z and urban buyers to find rural products without needing to know obscure traditional craft names.
3. **High Innovation & Viral Potential:** The AI Room Decor Stager provides an unmatched "wow" factor during the live SIH jury demo.
4. **Complete Inclusivity:** Voice-first daily summaries ensure that even illiterate artisans are in complete financial control of their enterprise.
