/**
 * KalaSetu AI — Multilingual Voice-to-Catalog & Camera Studio Module
 * Integrated with:
 * - Feature 1: ClaimSafe AI (Risky claim detection & artisan verification gate)
 * - Feature 2: Truthful Image Studio & Safe Image Policy (Original/Enhanced dual storage, quality checks, Before/After toggle)
 * - Feature 4: Craft-Aware Missing-Field Wizard (Bagru Textile & Blue Pottery templates)
 * - Feature 5: Artisan Story & Privacy Consent boundaries
 */

import { appState } from '../core/appState.js';
import { voiceService } from '../core/voiceService.js';
import { offlineStorage } from '../core/offlineStorage.js';
import { aiService } from '../core/aiService.js';
import { ClaimSafeService } from '../core/claimSafeService.js';
import { ImageSafetyService } from '../core/imageSafetyService.js';
import { CraftTemplateService } from '../core/craftTemplates.js';
import { ProductPassportService } from '../core/productPassportService.js';

export const VoiceCatalogerModule = {
  id: 'cataloger',
  titleKey: 'tabCataloger',
  icon: '📸',
  priority: 1,

  currentDraft: null,
  originalImageUrl: null,
  enhancedImageUrl: null,
  imageIntegrityStatus: 'original_only', // 'original_only' | 'safely_enhanced' | 'quality_warning' | 'manually_approved'
  isShowingEnhanced: false,
  qualityWarnings: [],
  claims: [],
  missingFieldsQueue: [],
  currentQuestionIndex: 0,
  activeTemplate: null,
  privacyConsent: ProductPassportService.getDefaultConsent(),

  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const t = (k, fb) => appState.t(k, fb);
    const isHindi = appState.get('language') === 'hi';

    this.container.innerHTML = `
      <div class="module-wrapper animate-fade-in">
        <!-- Audio Guidance Button for low-literacy kaarigars -->
        <div class="audio-guidance-bar">
          <button class="btn-audio-guide" id="btn-listen-guide" aria-label="Listen to step-by-step instructions">
            <span class="icon-speaker-anim">🔊</span>
            <span class="guide-text">${t('listenInstructions', 'Listen to Instructions')}</span>
          </button>
          <div class="cluster-badge-wrap">
            <span class="pulse-indicator-dot"></span>
            <span class="tag-cluster">${appState.get('artisan').cluster} • Verified</span>
          </div>
        </div>

        <!-- 1. Smart Camera Studio Card (Feature 2: Truthful Image Studio) -->
        <div class="card card-studio">
          <div class="studio-header">
            <h2 class="card-title">
              <span class="step-num">1</span>
              <span>${t('capturePhoto', 'Capture Craft Photo')}</span>
            </h2>
            <div class="header-badge-group">
              <span class="badge badge-ai-sparkle">📸 Truthful Studio</span>
              <span class="badge badge-craft-safe" id="badge-integrity">🌿 ${this.imageIntegrityStatus.replace('_', ' ')}</span>
            </div>
          </div>

          <!-- Truthful Image Policy Visible Note -->
          <div class="safe-image-policy-note">
            <span class="policy-icon">🛡️</span>
            <p class="policy-text">
              ${isHindi ? ImageSafetyService.POLICY_NOTICE_HI : ImageSafetyService.POLICY_NOTICE}
            </p>
          </div>

          <div class="camera-viewport-box" id="camera-box" role="button" tabindex="0">
            <div class="camera-guide-overlay">
              <div class="guide-corner tl"></div>
              <div class="guide-corner tr"></div>
              <div class="guide-corner bl"></div>
              <div class="guide-corner br"></div>
              <p class="guide-overlay-tip">${t('cameraCenterTip', 'Keep craft centered inside box')}</p>
            </div>
            
            <img id="preview-img" class="hidden preview-img" alt="Captured Craft Photo" />
            
            <div id="camera-placeholder" class="camera-placeholder">
              <div class="camera-lens-halo">
                <div class="camera-lens-circle">
                  <span class="camera-icon">📸</span>
                </div>
              </div>
              <h3 class="camera-prompt-title">${t('tapToCapture', 'Tap to Take Photo or Upload')}</h3>
              <p class="camera-prompt-subtitle">Auto-removes clutter & preserves authentic handmade motifs</p>
              <div class="camera-perks-row">
                <span class="perk-chip">🌿 Natural Dye Safe</span>
                <span class="perk-chip">🔍 Auto Quality Check</span>
              </div>
            </div>
            <input type="file" id="file-input" accept="image/*" class="file-input-hidden" />
          </div>

          <!-- Photo Quality Warning Guidance Card (If quality is suboptimal) -->
          <div id="quality-guidance-card" class="quality-guidance-card hidden">
            <div class="guidance-header">
              <span class="guidance-icon" id="guidance-icon">💡</span>
              <strong id="guidance-title">Photo Quality Guidance</strong>
            </div>
            <p class="guidance-msg" id="guidance-msg"></p>
            <span class="guidance-subtip">Aap bina roke aage badh sakte hain, ya behtar bikri ke liye dubara photo le sakte hain.</span>
          </div>

          <!-- Studio Enhancement Toolbar with Before/After Toggle -->
          <div id="studio-controls" class="studio-controls hidden">
            <button class="btn-chip" id="btn-toggle-compare">
              👁️ <span id="toggle-compare-text">Show Enhanced</span>
            </button>
            <button class="btn-chip" id="btn-enhance-light">✨ ${t('studioLighting', 'Studio Lighting')}</button>
            <button class="btn-chip" id="btn-remove-bg">✂️ ${t('cleanBackdrop', 'Clean Backdrop')}</button>
            <button class="btn-chip btn-ai-chip" id="btn-ai-inspect">🔍 ${t('inspectCraftBtn', 'Gemini Vision AI')}</button>
            <button class="btn-chip" id="btn-retake">🔄 ${t('retake', 'Retake')}</button>
          </div>
        </div>

        <!-- 2. Multilingual Hold-to-Speak Voice Note -->
        <div class="card card-voice">
          <div class="voice-header">
            <h2 class="card-title">
              <span class="step-num">2</span>
              <span>${t('step2Title', 'Speak About Your Craft')}</span>
            </h2>
            <span class="badge badge-groq-lpu">⚡ Groq LPU Brain</span>
          </div>

          <p class="helper-text">
            ${t('voicePromptHelp', 'Mention craft name, materials, size, and making days in your mother tongue:')}
          </p>

          <!-- Voice Mic Centerpiece -->
          <div class="mic-stage-container">
            <div class="mic-glow-backdrop"></div>
            <div class="mic-wave" id="mic-wave"></div>
            <button class="btn-mic" id="btn-mic" aria-label="Hold to record voice note">
              <span class="mic-icon">🎙️</span>
            </button>

            <!-- Soundwave Live Equalizer Bars -->
            <div class="soundwave-bars" id="soundwave-anim">
              <span class="bar bar-1"></span>
              <span class="bar bar-2"></span>
              <span class="bar bar-3"></span>
              <span class="bar bar-4"></span>
              <span class="bar bar-5"></span>
            </div>

            <span class="mic-status-label" id="mic-status-label">
              ${t('holdToSpeak', 'Hold Mic & Speak (बोलने के लिए दबाएं)')}
            </span>
          </div>

          <!-- Live Voice Transcription -->
          <div class="transcript-box" id="transcript-box">
            <div class="transcript-header-line">
              <span class="transcript-tag">📝 Spoken Words</span>
            </div>
            <p class="transcript-text text-muted" id="transcript-text">
              ${t('speechPlaceholder', 'Say e.g.: "Bagru block print dupatta, 2.5m, natural indigo dye, took 2 days"')}
            </p>
          </div>

          <button class="btn btn-sample-deluxe btn-block mt-3" id="btn-sample-voice">
            <span class="sparkle-glyph">⚡</span>
            <span>${t('sampleVoiceDemo', '1-Tap Sample Voice Demo (बगरू दुपट्टा - Live SIH Demo)')}</span>
          </button>
        </div>

        <!-- 3. Craft-Aware Missing Field Wizard (Feature 4) -->
        <div id="craft-wizard-card" class="card card-wizard hidden">
          <div class="wizard-header">
            <div>
              <span class="wizard-badge" id="wizard-craft-type">🏷️ Block Print Textile</span>
              <h3 class="card-title mt-1">Short Craft Questions</h3>
            </div>
            <span class="badge badge-remaining" id="wizard-progress-badge">2 details remaining</span>
          </div>

          <div class="wizard-body mt-2">
            <p class="wizard-question" id="wizard-question-text">Yeh kis material ka hai—cotton, silk ya kuch aur?</p>
            <div class="wizard-input-row mt-2">
              <input type="text" id="wizard-answer-input" class="form-control" placeholder="Type answer or tap mic..." />
              <button class="btn btn-icon btn-secondary" id="btn-wizard-mic" title="Speak Answer">🎙️</button>
              <button class="btn btn-primary" id="btn-wizard-save-field">Save ✓</button>
            </div>
            <div class="wizard-nav-footer mt-2">
              <button class="btn-link text-xs" id="btn-wizard-skip">Skip this detail →</button>
            </div>
          </div>
        </div>

        <!-- 4. Generated Listing Draft with ClaimSafe AI (Features 1, 3, 5) -->
        <div id="draft-result-card" class="card card-draft hidden">
          <div class="draft-header">
            <h2 class="card-title">
              <span class="step-num">3</span>
              ${t('step3Title', 'AI Generated Digital Listing')}
            </h2>
            <span class="badge badge-verified">✓ ${t('reviewDraft', 'Review Draft')}</span>
          </div>

          <!-- Feature 1: ClaimSafe AI Trust & Verification Section -->
          <div class="trust-verification-card">
            <div class="trust-header">
              <div class="trust-title-row">
                <span class="trust-shield">🛡️</span>
                <strong>ClaimSafe AI — Trust & Verification (प्रमाणिकता दावे)</strong>
              </div>
              <span class="badge-claim-guide">Zero False Advertising</span>
            </div>

            <div class="trust-prompt-box">
              <p class="trust-prompt-text">
                ⚠️ <em>Is claim ko publish karne se pehle artisan se confirm karein.</em>
              </p>
            </div>

            <div class="claims-chips-list" id="claims-chips-container">
              <!-- Dynamically populated claim chips -->
            </div>

            <div class="claim-quick-actions-bar mt-2">
              <button class="btn btn-sm btn-outline" id="btn-confirm-all-claims">✓ Confirm All Claims</button>
              <button class="btn btn-sm btn-outline" id="btn-remove-unverified-claims">✕ Strip Unverified</button>
            </div>
          </div>

          <!-- Listing Fields Grid -->
          <div class="draft-fields-grid mt-3">
            <div class="form-group">
              <label class="form-label">${t('craftName', 'Product Title')}</label>
              <input type="text" id="draft-name" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">${t('craftType', 'Craft Category')}</label>
              <input type="text" id="draft-craft" class="form-control" />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">${t('materials', 'Material')}</label>
                <input type="text" id="draft-material" class="form-control" />
              </div>
              <div class="form-group half">
                <label class="form-label">${t('dimensions', 'Dimensions')}</label>
                <input type="text" id="draft-dimensions" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">${t('makingTime', 'Lead Time')}</label>
                <input type="text" id="draft-leadtime" class="form-control" />
              </div>
              <div class="form-group half">
                <label class="form-label">Stock Quantity</label>
                <input type="text" id="draft-stock" class="form-control" placeholder="e.g. 5 pieces" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Care Instructions</label>
              <input type="text" id="draft-care" class="form-control" placeholder="e.g. Cold hand wash, shade dry" />
            </div>

            <!-- Bilingual Descriptions -->
            <div class="form-group">
              <label class="form-label">
                ${t('hindiDesc', 'Regional Description')}
                <button type="button" class="btn-tts-mini" id="btn-read-hindi">🔊</button>
              </label>
              <textarea id="draft-desc-hi" class="form-control" rows="2"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">
                ${t('englishDesc', 'English Description (For Buyers)')}
                <button type="button" class="btn-tts-mini" id="btn-read-en">🔊</button>
              </label>
              <textarea id="draft-desc-en" class="form-control" rows="2"></textarea>
            </div>

            <!-- Feature 5: Artisan Story / About the Maker -->
            <div class="artisan-story-card">
              <div class="story-header-row">
                <label class="form-label font-bold">📖 About the Maker / Artisan Story (वैकल्पिक)</label>
                <button type="button" class="btn-tts-mini" id="btn-mic-story" title="Speak Artisan Story">🎙️</button>
              </div>
              <textarea id="draft-artisan-story" class="form-control" rows="2" 
                placeholder="Share your heritage journey, family craft lineage, or cluster history..."></textarea>
              
              <!-- Privacy Consent Toggles (Default OFF) -->
              <div class="privacy-consent-box mt-2">
                <span class="privacy-heading">🔒 Privacy Consent (गोपनीयता अनुमति)</span>
                <label class="consent-row">
                  <input type="checkbox" id="consent-artisan-name" />
                  <span>Show artisan name publicly on marketplace (सार्वजनिक नाम दिखाएं)</span>
                </label>
                <label class="consent-row">
                  <input type="checkbox" id="consent-artisan-location" />
                  <span>Show workshop / village location publicly (गांव व क्लस्टर पता दिखाएं)</span>
                </label>
                <label class="consent-row">
                  <input type="checkbox" id="consent-artisan-story" />
                  <span>Show artisan heritage story publicly on Product Passport (कहानी प्रकाशित करें)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="draft-action-footer">
            <button class="btn btn-secondary" id="btn-goto-pricing">
              💰 ${t('calculatePriceBtn', 'Calculate Fair Price')}
            </button>
            <button class="btn btn-primary" id="btn-save-listing">
              ✓ ${t('confirmListingBtn', 'Approve & Add to Catalog')}
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const isHindi = appState.get('language') === 'hi';

    // 1. Audio Guidance
    document.getElementById('btn-listen-guide')?.addEventListener('click', () => {
      const text = isHindi 
        ? 'कलासेतु में आपका स्वागत है। पहले शिल्प की साफ फोटो खींचें, फिर माइक दबाकर अपनी भाषा में बताएं।' 
        : 'Welcome to KalaSetu. First take a photo of your craft, then hold the microphone and speak about your product in your language.';
      voiceService.speak(text);
    });

    // 2. Camera Upload & Photo Quality Analysis (Feature 2)
    const cameraBox = document.getElementById('camera-box');
    const fileInput = document.getElementById('file-input');
    const previewImg = document.getElementById('preview-img');
    const placeholder = document.getElementById('camera-placeholder');
    const studioControls = document.getElementById('studio-controls');
    const guidanceCard = document.getElementById('quality-guidance-card');

    cameraBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        this.originalImageUrl = dataUrl;
        this.enhancedImageUrl = null;
        this.imageIntegrityStatus = 'original_only';
        this.isShowingEnhanced = false;

        previewImg.src = dataUrl;
        previewImg.classList.remove('hidden');
        placeholder.classList.add('hidden');
        studioControls.classList.remove('hidden');

        // Run Photo-Quality Checks
        const quality = await ImageSafetyService.analyzePhotoQuality(dataUrl);
        if (!quality.isQualityGood && quality.warnings.length > 0) {
          this.qualityWarnings = quality.warnings;
          this.imageIntegrityStatus = 'quality_warning';
          const firstWarning = quality.warnings[0];
          document.getElementById('guidance-icon').textContent = firstWarning.icon;
          document.getElementById('guidance-title').textContent = firstWarning.title;
          document.getElementById('guidance-msg').textContent = firstWarning.message;
          guidanceCard.classList.remove('hidden');
        } else {
          this.qualityWarnings = [];
          guidanceCard.classList.add('hidden');
        }

        document.getElementById('badge-integrity').textContent = `🌿 ${this.imageIntegrityStatus.replace('_', ' ')}`;
        appState.showToast(isHindi ? 'फोटो लोड हो गई!' : 'Craft photo loaded!', 'success');
      };
      reader.readAsDataURL(file);
    });

    // Before/After comparison toggle
    document.getElementById('btn-toggle-compare')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.enhancedImageUrl) {
        appState.showToast(isHindi ? 'पहले लाइटिंग या बैकग्राउंड पर क्लिक करें' : 'Click Studio Lighting or Clean Backdrop first', 'info');
        return;
      }
      this.isShowingEnhanced = !this.isShowingEnhanced;
      previewImg.src = this.isShowingEnhanced ? this.enhancedImageUrl : this.originalImageUrl;
      document.getElementById('toggle-compare-text').textContent = this.isShowingEnhanced ? 'Show Original' : 'Show Enhanced';
      appState.showToast(this.isShowingEnhanced ? 'Viewing Enhanced Image' : 'Viewing Original Image', 'info');
    });

    // Safe Enhancement: Lighting
    document.getElementById('btn-enhance-light')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!this.originalImageUrl) return;
      this.enhancedImageUrl = await ImageSafetyService.safelyEnhance(this.originalImageUrl, { mode: 'studio_light' });
      this.isShowingEnhanced = true;
      previewImg.src = this.enhancedImageUrl;
      this.imageIntegrityStatus = 'safely_enhanced';
      document.getElementById('badge-integrity').textContent = '🌿 Safely Enhanced';
      document.getElementById('toggle-compare-text').textContent = 'Show Original';
      appState.showToast(isHindi ? 'लाइट और स्पष्टता सुधारी गई!' : 'Safe studio lighting applied!', 'success');
    });

    // Safe Enhancement: Clean backdrop
    document.getElementById('btn-remove-bg')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!this.originalImageUrl) return;
      this.enhancedImageUrl = await ImageSafetyService.safelyEnhance(this.originalImageUrl, { mode: 'clean_backdrop' });
      this.isShowingEnhanced = true;
      previewImg.src = this.enhancedImageUrl;
      this.imageIntegrityStatus = 'safely_enhanced';
      document.getElementById('badge-integrity').textContent = '🌿 Safely Enhanced';
      document.getElementById('toggle-compare-text').textContent = 'Show Original';
      appState.showToast(isHindi ? 'बैकग्राउंड साफ कर दिया गया!' : 'Clean backdrop applied!', 'success');
    });

    // Retake
    document.getElementById('btn-retake')?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      this.originalImageUrl = null;
      this.enhancedImageUrl = null;
      previewImg.src = '';
      previewImg.classList.add('hidden');
      placeholder.classList.remove('hidden');
      studioControls.classList.add('hidden');
      guidanceCard.classList.add('hidden');
    });

    // 3. Voice Mic Recording
    const btnMic = document.getElementById('btn-mic');
    const micWave = document.getElementById('mic-wave');
    const micStatus = document.getElementById('mic-status-label');
    const transcriptText = document.getElementById('transcript-text');

    const startRecording = () => {
      btnMic.classList.add('recording');
      micWave.classList.add('active');
      micStatus.textContent = isHindi ? 'सुन रहे हैं... बोलिए' : 'Listening... speak now';
      
      voiceService.startRecording({
        onInterim: (text) => {
          transcriptText.textContent = text;
          transcriptText.classList.remove('text-muted');
        },
        onFinal: (text) => {
          transcriptText.textContent = text;
          this.processVoiceNote(text);
        },
        onError: () => {
          appState.showToast(isHindi ? 'माइक एक्सेस नहीं मिला' : 'Microphone error', 'warning');
          this.stopRecordingUI();
        }
      });
    };

    const stopRecording = () => {
      voiceService.stopRecording();
      this.stopRecordingUI();
    };

    btnMic.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startRecording();
    });

    window.addEventListener('pointerup', () => {
      if (btnMic.classList.contains('recording')) {
        stopRecording();
      }
    });

    // 1-Tap Sample Voice Demo
    document.getElementById('btn-sample-voice')?.addEventListener('click', () => {
      const sample = isHindi
        ? 'बगरू का हाथ से छपा हुआ कॉटन दुपट्टा है, 100% कॉटन, प्राकृतिक नील का रंग, 2.5 मीटर लंबा, 2 दिन लगे'
        : 'Authentic Bagru hand-block printed pure cotton dupatta, natural dye indigo, 2.5 meters length, took 2 days';
      transcriptText.textContent = sample;
      transcriptText.classList.remove('text-muted');
      this.processVoiceNote(sample);
      appState.showToast(isHindi ? 'नमूना आवाज़ से विवरण तैयार!' : 'Sample voice note analyzed!', 'success');
    });

    // 4. Wizard Events (Feature 4)
    document.getElementById('btn-wizard-save-field')?.addEventListener('click', () => {
      this.saveWizardAnswer();
    });

    document.getElementById('btn-wizard-skip')?.addEventListener('click', () => {
      this.skipWizardQuestion();
    });

    document.getElementById('btn-wizard-mic')?.addEventListener('click', () => {
      voiceService.startRecording({
        onFinal: (text) => {
          document.getElementById('wizard-answer-input').value = text;
          this.saveWizardAnswer();
        }
      });
    });

    // 5. Claim Verification Buttons (Feature 1)
    document.getElementById('btn-confirm-all-claims')?.addEventListener('click', () => {
      this.claims.forEach(c => c.claim_status = 'artisan_confirmed');
      this.renderClaimChips();
      appState.showToast(isHindi ? 'सभी दावों की कारीगर पुष्टि हो गई!' : 'All claims confirmed by artisan!', 'success');
    });

    document.getElementById('btn-remove-unverified-claims')?.addEventListener('click', () => {
      this.claims = this.claims.filter(c => c.claim_status === 'artisan_confirmed');
      this.renderClaimChips();
      appState.showToast(isHindi ? 'अपुष्ट दावे हटा दिए गए' : 'Unverified claims stripped', 'info');
    });

    // 6. Artisan Story Voice Input (Feature 5)
    document.getElementById('btn-mic-story')?.addEventListener('click', () => {
      voiceService.startRecording({
        onFinal: (text) => {
          const area = document.getElementById('draft-artisan-story');
          area.value = (area.value ? area.value + ' ' : '') + text;
          appState.showToast('Story recorded!', 'success');
        }
      });
    });

    // 7. TTS readouts
    document.getElementById('btn-read-hindi')?.addEventListener('click', () => {
      const text = document.getElementById('draft-desc-hi').value;
      if (text) voiceService.speak(text, 'hi-IN');
    });

    document.getElementById('btn-read-en')?.addEventListener('click', () => {
      const text = document.getElementById('draft-desc-en').value;
      if (text) voiceService.speak(text, 'en-IN');
    });

    // 8. Navigate to Pricing
    document.getElementById('btn-goto-pricing')?.addEventListener('click', () => {
      appState.set('activeTab', 'pricing');
    });

    // 9. Save Listing
    document.getElementById('btn-save-listing')?.addEventListener('click', async () => {
      await this.saveCurrentListing();
    });
  },

  stopRecordingUI() {
    const isHindi = appState.get('language') === 'hi';
    const btnMic = document.getElementById('btn-mic');
    const micWave = document.getElementById('mic-wave');
    const micStatus = document.getElementById('mic-status-label');
    if (btnMic) btnMic.classList.remove('recording');
    if (micWave) micWave.classList.remove('active');
    if (micStatus) micStatus.textContent = isHindi ? 'माइक दबाकर रखें और बोलें' : 'Hold Mic & Speak';
  },

  /**
   * Process spoken note and run ClaimSafe detection and craft-aware missing questions
   */
  async processVoiceNote(speechText) {
    const isHindi = appState.get('language') === 'hi';
    const draftCard = document.getElementById('draft-result-card');
    draftCard.classList.remove('hidden');

    // 1. Call AI Service
    const aiData = await aiService.parseSpeechToCatalog(speechText, appState.get('language'));

    const craftName = aiData.craftName || (isHindi ? 'हस्तनिर्मित पारंपरिक शिल्प' : 'Handcrafted Heritage Art');
    const craftCategory = aiData.category || 'Textiles & Handloom';
    const material = aiData.materials || (isHindi ? 'कॉटन एवं रंग' : 'Natural Fibers & Eco Dye');
    const dimensions = aiData.dimensions || 'Standard';
    const leadTime = `${Math.ceil((aiData.timeSpentHours || 16) / 8)} Days (${aiData.timeSpentHours || 16} hrs)`;
    const descHi = aiData.descriptionRegional || `प्रामाणिक ${craftName}।`;
    const descEn = aiData.descriptionEn || `Authentic ${craftName}.`;
    const suggestedPrice = aiData.suggestedPrice || 1250;

    // Fill UI inputs
    document.getElementById('draft-name').value = craftName;
    document.getElementById('draft-craft').value = craftCategory;
    document.getElementById('draft-material').value = material;
    document.getElementById('draft-dimensions').value = dimensions;
    document.getElementById('draft-leadtime').value = leadTime;
    document.getElementById('draft-desc-hi').value = descHi;
    document.getElementById('draft-desc-en').value = descEn;

    // 2. Feature 1: Detect Risky Claims
    this.claims = ClaimSafeService.detectClaims({
      title: craftName,
      descHi,
      descEn,
      materials: material,
      speechTranscript: speechText,
      source: 'ai'
    });
    this.renderClaimChips();

    // 3. Feature 4: Match Craft Template & Find Missing Fields
    this.activeTemplate = CraftTemplateService.matchTemplate({
      title: craftName,
      category: craftCategory,
      materials: material,
      cluster: aiData.giCluster || appState.get('artisan').cluster
    });

    const draftData = {
      productType: craftName,
      material: material,
      length: dimensions.includes('x') ? dimensions.split('x')[0] : null,
      width: dimensions.includes('x') ? dimensions.split('x')[1] : null,
      dimensions: dimensions !== 'Standard' ? dimensions : null,
      primaryColours: speechText.toLowerCase().includes('नील') || speechText.toLowerCase().includes('indigo') ? 'Indigo Blue' : null,
      careInstructions: null,
      stockQuantity: null,
      productionLeadTime: leadTime
    };

    this.missingFieldsQueue = CraftTemplateService.getMissingFields(draftData, this.activeTemplate);
    this.currentQuestionIndex = 0;
    this.showWizardQuestion();

    // Store draft reference
    this.currentDraft = {
      title: craftName,
      category: craftCategory,
      material: material,
      dimensions: dimensions,
      leadTime: leadTime,
      stockQuantity: '5 pieces',
      careInstructions: 'Gentle hand wash recommended',
      descHi: descHi,
      descEn: descEn,
      originalImageUrl: this.originalImageUrl || './assets/sample-craft.jpg',
      enhancedImageUrl: this.enhancedImageUrl || null,
      image: this.enhancedImageUrl || this.originalImageUrl || './assets/sample-craft.jpg',
      imageIntegrityStatus: this.imageIntegrityStatus,
      artisan: appState.get('artisan').name,
      cluster: aiData.giCluster || appState.get('artisan').cluster,
      suggestedPrice: suggestedPrice,
      price: suggestedPrice,
      claims: this.claims,
      listingStatus: 'draft'
    };

    // Save offline draft immediately (Feature 6)
    await offlineStorage.saveDraft(this.currentDraft);

    appState.showToast(isHindi ? 'AI ने लिस्टिंग तैयार कर दी! दावे जांचें।' : 'AI Listing Drafted! Review claims.', 'success');
    draftCard.scrollIntoView({ behavior: 'smooth' });
  },

  /**
   * Render ClaimSafe verification chips
   */
  renderClaimChips() {
    const container = document.getElementById('claims-chips-container');
    if (!container) return;

    if (!this.claims || this.claims.length === 0) {
      container.innerHTML = '<span class="text-xs text-muted">No high-risk claims detected. Listing is safe.</span>';
      return;
    }

    container.innerHTML = this.claims.map(claim => {
      const badgeInfo = ClaimSafeService.getStatusBadgeInfo(claim.claim_status);
      return `
        <div class="claim-chip-row animate-fade-in" data-claim-id="${claim.id}">
          <span class="claim-pill" style="background: ${badgeInfo.bg}; color: ${badgeInfo.color}; border: 1px solid ${badgeInfo.border};">
            ${badgeInfo.icon} <strong>${claim.label}</strong>: ${badgeInfo.label}
          </span>
          <div class="claim-action-buttons">
            <button class="btn-claim-action btn-confirm-claim" title="Confirm Claim" data-id="${claim.id}">✓ Confirm</button>
            <button class="btn-claim-action btn-remove-claim" title="Remove Claim" data-id="${claim.id}">✕ Remove</button>
            <button class="btn-claim-action btn-edit-claim" title="Edit Claim" data-id="${claim.id}">✏️</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind chip actions
    container.querySelectorAll('.btn-confirm-claim').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const c = this.claims.find(x => x.id === id);
        if (c) {
          c.claim_status = 'artisan_confirmed';
          c.claim_source = 'artisan_manual_input';
          c.reviewedAt = new Date().toISOString();
          this.renderClaimChips();
        }
      });
    });

    container.querySelectorAll('.btn-remove-claim').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.claims = this.claims.filter(x => x.id !== id);
        this.renderClaimChips();
      });
    });

    container.querySelectorAll('.btn-edit-claim').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const c = this.claims.find(x => x.id === id);
        if (c) {
          const newTerm = prompt('Edit claim description:', c.label);
          if (newTerm) {
            c.label = newTerm;
            c.claim_status = 'artisan_confirmed';
            this.renderClaimChips();
          }
        }
      });
    });
  },

  /**
   * Craft-Aware Missing Field Wizard Display (Feature 4)
   */
  showWizardQuestion() {
    const wizardCard = document.getElementById('craft-wizard-card');
    if (!wizardCard) return;

    if (this.missingFieldsQueue.length === 0 || this.currentQuestionIndex >= this.missingFieldsQueue.length) {
      wizardCard.classList.add('hidden');
      return;
    }

    const field = this.missingFieldsQueue[this.currentQuestionIndex];
    const remainingCount = this.missingFieldsQueue.length - this.currentQuestionIndex;

    wizardCard.classList.remove('hidden');
    document.getElementById('wizard-craft-type').textContent = `🏷️ ${this.activeTemplate.name}`;
    document.getElementById('wizard-progress-badge').textContent = `${remainingCount} details remaining`;
    document.getElementById('wizard-question-text').textContent = field.question || `What is the ${field.label}?`;
    document.getElementById('wizard-answer-input').value = '';
    document.getElementById('wizard-answer-input').placeholder = field.placeholder || 'Your answer...';
  },

  saveWizardAnswer() {
    const input = document.getElementById('wizard-answer-input');
    const answer = input ? input.value.trim() : '';
    if (answer && this.missingFieldsQueue[this.currentQuestionIndex]) {
      const field = this.missingFieldsQueue[this.currentQuestionIndex];
      // Map answer to draft field
      if (field.key === 'careInstructions' && document.getElementById('draft-care')) {
        document.getElementById('draft-care').value = answer;
      } else if (field.key === 'stockQuantity' && document.getElementById('draft-stock')) {
        document.getElementById('draft-stock').value = answer;
      } else if (field.key === 'material' && document.getElementById('draft-material')) {
        document.getElementById('draft-material').value = answer;
      } else if (field.key === 'dimensions' && document.getElementById('draft-dimensions')) {
        document.getElementById('draft-dimensions').value = answer;
      }
      appState.showToast(`Saved ${field.label}!`, 'success');
    }
    this.currentQuestionIndex++;
    this.showWizardQuestion();
  },

  skipWizardQuestion() {
    this.currentQuestionIndex++;
    this.showWizardQuestion();
  },

  /**
   * Save and publish gate with claim verification
   */
  async saveCurrentListing() {
    const isHindi = appState.get('language') === 'hi';
    if (!this.currentDraft) {
      appState.showToast(isHindi ? 'कृपया पहले विवरण दें' : 'Please record craft details first', 'warning');
      return;
    }

    // Enforce Feature 1 ClaimSafe gate
    const validation = ClaimSafeService.validateForPublishing(this.claims);
    if (!validation.canPublish) {
      const confirmProceed = confirm(`${validation.message}\n\nDo you want to confirm these claims now and proceed?`);
      if (confirmProceed) {
        this.claims.forEach(c => c.claim_status = 'artisan_confirmed');
        this.renderClaimChips();
      } else {
        appState.showToast('Cannot publish unconfirmed claims.', 'warning');
        return;
      }
    }

    // Collect values
    this.currentDraft.title = document.getElementById('draft-name').value;
    this.currentDraft.category = document.getElementById('draft-craft').value;
    this.currentDraft.material = document.getElementById('draft-material').value;
    this.currentDraft.dimensions = document.getElementById('draft-dimensions').value;
    this.currentDraft.leadTime = document.getElementById('draft-leadtime').value;
    this.currentDraft.stockQuantity = document.getElementById('draft-stock')?.value || 'Available';
    this.currentDraft.careInstructions = document.getElementById('draft-care')?.value || 'Hand wash gently';
    this.currentDraft.descHi = document.getElementById('draft-desc-hi').value;
    this.currentDraft.descEn = document.getElementById('draft-desc-en').value;
    this.currentDraft.artisanStory = document.getElementById('draft-artisan-story')?.value || '';

    // Privacy Consent
    this.currentDraft.privacyConsent = {
      showArtisanName: document.getElementById('consent-artisan-name')?.checked || false,
      showLocation: document.getElementById('consent-artisan-location')?.checked || false,
      showStory: document.getElementById('consent-artisan-story')?.checked || false
    };

    this.currentDraft.claims = this.claims;
    this.currentDraft.originalImageUrl = this.originalImageUrl;
    this.currentDraft.enhancedImageUrl = this.enhancedImageUrl;
    this.currentDraft.image = this.enhancedImageUrl || this.originalImageUrl || './assets/sample-craft.jpg';
    this.currentDraft.imageIntegrityStatus = this.imageIntegrityStatus;
    this.currentDraft.listingStatus = 'approved';

    await offlineStorage.saveListing(this.currentDraft);
    appState.showToast(isHindi ? 'लिस्टिंग सफलतापूर्वक सेव हो गई!' : 'Listing verified & saved!', 'success');

    // Switch to Showcase
    appState.set('activeTab', 'market');
  }
};
