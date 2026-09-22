# Project PRD: KalaSetu AI (SIH26090)
## Multilingual AI-Powered Artisan Marketplace & Voice Enablement Platform

### 1. Executive Summary
KalaSetu AI bridges grassroots Indian artisans and weavers to global and domestic markets by eliminating digital, literacy, and language barriers using Multilingual Voice AI, Offline-First local storage, Story-to-Listing Generation, and Dynamic Fair Pricing.

---

### 2. Core Architecture & Tech Stack
- **Frontend**: Next.js / React with Tailwind / Vanilla CSS, Responsive & Mobile-first.
- **Offline Engine**: Service Worker (Workbox) + IndexedDB for offline drafting & voice note caching.
- **Database & Auth**: Supabase (PostgreSQL, Row-Level Security, Auth, Storage bucket for audio & craft photos).
- **Voice / Speech**: Free-tier STT/TTS APIs with local fallback (Web Speech API) supporting Hindi, Tamil, Bengali, Telugu, Marathi, and English.
- **AI Engine**: Gemini 2.5 Flash / Free-tier LLMs for craft storytelling, automated listing descriptions, and fair pricing suggestions.

---

### 3. Implementation Task Checklist

#### Phase 1: Database & Foundation
- [ ] Initialize Supabase client config (`supabaseClient.js`)
- [ ] Create database tables for `artisans`, `products`, `voice_drafts`, and `orders`
- [ ] Setup authentication (Phone OTP / Email magic link)

#### Phase 2: Voice & Multilingual Input
- [ ] Implement audio recording component for artisan voice descriptions
- [ ] Integrate Speech-to-Text API pipeline with multi-language detection
- [ ] Add Text-to-Speech playback for order updates and artisan instructions

#### Phase 3: Offline-First Engine
- [ ] Configure IndexedDB schema for offline catalog & order drafting
- [ ] Implement Background Sync to automatically upload pending drafts when internet reconnects
- [ ] Provide offline badge & status indicators in the UI

#### Phase 4: AI Craft Story & Pricing Engine
- [ ] Build AI Prompt pipeline: Transform raw voice transcription into evocative artisan product stories
- [ ] Implement fair pricing calculator considering raw materials, weaving hours, and region
- [ ] Add automated photo enhancement & background cleanup

#### Phase 5: Verification & Testing
- [ ] Test offline audio recording and reconnection sync
- [ ] Run CodeRabbit code review across all routes
- [ ] Perform UI accessibility audit for regional artisan usability
