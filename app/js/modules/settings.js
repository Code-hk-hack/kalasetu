/**
 * KalaSetu AI — Artisan Profile & AI Engine Settings Module
 * Supports language preference, cluster identity, and custom Indian Language STT/TTS API keys.
 * Fully localized across 9 Indian regional languages.
 */

import { appState } from '../core/appState.js';
import { voiceService } from '../core/voiceService.js';

export const SettingsModule = {
  id: 'settings',
  titleKey: 'tabSettings',
  icon: '⚙️',
  priority: 5,

  mount(container) {
    this.container = container;
    this.render();
  },

  render() {
    const t = (k, fb) => appState.t(k, fb);
    const artisan = appState.get('artisan');

    this.container.innerHTML = `
      <div class="module-wrapper animate-fade-in">
        <div class="card card-profile">
          <h2 class="card-title">👤 ${t('artisanProfileTitle', 'Artisan Profile & Cluster Lineage')}</h2>

          <div class="form-group">
            <label class="form-label">${t('artisanNameLabel', 'Artisan Name')}</label>
            <input type="text" id="setting-name" class="form-control" value="${artisan.name}" />
          </div>

          <div class="form-group">
            <label class="form-label">${t('craftLineageLabel', 'Heritage Craft Specialization')}</label>
            <input type="text" id="setting-craft" class="form-control" value="${artisan.craft}" />
          </div>

          <div class="form-group">
            <label class="form-label">${t('recognizedClusterLabel', 'Recognized Craft Cluster')}</label>
            <input type="text" id="setting-cluster" class="form-control" value="${artisan.cluster}" />
          </div>

          <div class="form-group">
            <label class="form-label">📱 ${t('phoneNumberLabel', 'Phone Number (For SMS Alerts)')}</label>
            <input type="tel" id="setting-phone" class="form-control" value="${artisan.phone}" />
          </div>

          <button class="btn btn-secondary btn-block mt-2" id="btn-save-profile">
            💾 ${t('updateProfileBtn', 'Update Profile')}
          </button>
        </div>

        <!-- Language Switcher -->
        <div class="card card-language">
          <h2 class="card-title">🌐 ${t('selectLanguageTitle', 'Select Regional Language')}</h2>
          <p class="helper-text">
            ${t('chooseLangSubtitle', 'Choose your preferred language for voice instructions & UI:')}
          </p>

          <div class="lang-grid">
            <button class="btn-lang ${appState.get('language') === 'hi' ? 'active' : ''}" data-lang="hi">
              <strong>हिंदी</strong>
              <small>Hindi</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'en' ? 'active' : ''}" data-lang="en">
              <strong>English</strong>
              <small>Indian English</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'bn' ? 'active' : ''}" data-lang="bn">
              <strong>বাংলা</strong>
              <small>Bengali</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'mr' ? 'active' : ''}" data-lang="mr">
              <strong>मराठी</strong>
              <small>Marathi</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'ta' ? 'active' : ''}" data-lang="ta">
              <strong>தமிழ்</strong>
              <small>Tamil</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'te' ? 'active' : ''}" data-lang="te">
              <strong>తెలుగు</strong>
              <small>Telugu</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'gu' ? 'active' : ''}" data-lang="gu">
              <strong>ગુજરાતી</strong>
              <small>Gujarati</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'kn' ? 'active' : ''}" data-lang="kn">
              <strong>ಕನ್ನಡ</strong>
              <small>Kannada</small>
            </button>
            <button class="btn-lang ${appState.get('language') === 'or' ? 'active' : ''}" data-lang="or">
              <strong>ଓଡ଼ିଆ</strong>
              <small>Odia</small>
            </button>
          </div>
        <!-- Feature 7: Role Selector (Artisan / Facilitator / Admin) -->
        <div class="card card-role mt-3">
          <h2 class="card-title">👥 App Operational Mode & Role</h2>
          <p class="helper-text">
            Switch between standard Artisan mode and NGO/Cluster Facilitator review mode:
          </p>

          <div class="role-selector-group">
            <label class="role-radio-label">
              <input type="radio" name="userRole" value="artisan" ${appState.get('userRole') !== 'facilitator' ? 'checked' : ''} />
              <div>
                <strong>Artisan / Kaarigar (कारीगर मोड)</strong>
                <p class="text-xs text-muted">Standard voice cataloging, fair pricing, and sales.</p>
              </div>
            </label>

            <label class="role-radio-label mt-2">
              <input type="radio" name="userRole" value="facilitator" ${appState.get('userRole') === 'facilitator' ? 'checked' : ''} />
              <div>
                <strong>Cluster Facilitator / NGO Leader (सहायता डेस्क)</strong>
                <p class="text-xs text-muted">Review queue, claim proof verification, multi-artisan support dashboard.</p>
              </div>
            </label>
          </div>

          <button class="btn btn-secondary btn-block mt-3" id="btn-save-role">
            ✓ Apply Role & Switch Workspace
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const t = (k, fb) => appState.t(k, fb);

    // Profile save
    document.getElementById('btn-save-profile')?.addEventListener('click', () => {
      const updated = {
        name: document.getElementById('setting-name').value.trim(),
        craft: document.getElementById('setting-craft').value.trim(),
        cluster: document.getElementById('setting-cluster').value.trim(),
        phone: document.getElementById('setting-phone').value.trim()
      };
      appState.set('artisan', updated);
      appState.showToast(t('profileUpdatedToast', 'Profile updated!'), 'success');
    });

    // Language selection with instant voice feedback in mother tongue
    const langGreetings = {
      hi: 'हिंदी भाषा चुनी गई।',
      en: 'English language selected.',
      mr: 'मराठी भाषा निवडली.',
      bn: 'বাংলা ভাষা নির্বাচন করা হয়েছে.',
      ta: 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது.',
      te: 'తెలుగు భాష ఎంపిక చేయబడింది.',
      gu: 'ગુજરાતી ભાષા પસંદ કરી.',
      kn: 'ಕನ್ನಡ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ.',
      or: 'ଓଡ଼ିଆ ଭାଷା ଚୟନ କରାଗଲା.'
    };

    document.querySelectorAll('.btn-lang').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        appState.set('language', lang);
        const msg = langGreetings[lang] || `Language set to ${lang.toUpperCase()}`;
        appState.showToast(msg, 'success');
        voiceService.speak(msg);
      });
    });

    document.getElementById('btn-save-role')?.addEventListener('click', () => {
      const selected = document.querySelector('input[name="userRole"]:checked')?.value || 'artisan';
      appState.set('userRole', selected);
      appState.showToast(`Switched to ${selected.toUpperCase()} mode!`, 'success');
      if (selected === 'facilitator') {
        appState.set('activeTab', 'facilitator');
      } else {
        appState.set('activeTab', 'cataloger');
      }
    });
  }
};
