/**
 * KalaSetu AI — Daily Business Summary ("Hisab-Kitab") Module
 * Voice-first accounting ledger tracking daily materials, sales, orders, and profit.
 * Fully localized across 9 Indian regional languages.
 */

import { appState } from '../core/appState.js';
import { voiceService } from '../core/voiceService.js';
import { offlineStorage } from '../core/offlineStorage.js';
import { aiService } from '../core/aiService.js';

export const HisabKitabModule = {
  id: 'hisab',
  titleKey: 'tabHisab',
  icon: '📖',
  priority: 3,

  mount(container) {
    this.container = container;
    this.render();
  },

  async render() {
    const t = (k, fb) => appState.t(k, fb);
    const entries = await offlineStorage.getHisabEntries();

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    entries.forEach(e => {
      totalIncome += (e.income || 0);
      totalExpense += (e.expense || 0);
    });
    const netProfit = totalIncome - totalExpense;

    this.container.innerHTML = `
      <div class="module-wrapper animate-fade-in">
        <!-- Audio Guidance -->
        <div class="audio-guidance-bar">
          <button class="btn-audio-guide" id="btn-listen-hisab">
            <span class="icon-speaker">🔊</span>
            <span class="guide-text">${t('listenHisabSummary', 'Listen to Ledger Summary')}</span>
          </button>
          <span class="tag-cluster">${t('dailyBusinessLedger', 'Daily Business Ledger')}</span>
        </div>

        <!-- Metric KPI Cards -->
        <div class="hisab-metrics-grid">
          <div class="kpi-card kpi-income">
            <span class="kpi-icon">💰</span>
            <div class="kpi-info">
              <span class="kpi-label">${t('incomeLabel', "Today's Sales")}</span>
              <h3 class="kpi-value" id="kpi-income">₹${totalIncome.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div class="kpi-card kpi-expense">
            <span class="kpi-icon">📉</span>
            <div class="kpi-info">
              <span class="kpi-label">${t('expenseLabel', "Today's Expenses")}</span>
              <h3 class="kpi-value" id="kpi-expense">₹${totalExpense.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div class="kpi-card kpi-profit">
            <span class="kpi-icon">🎉</span>
            <div class="kpi-info">
              <span class="kpi-label">${t('netProfitLabel', 'Net Profit')}</span>
              <h3 class="kpi-value ${netProfit >= 0 ? 'text-profit' : 'text-loss'}" id="kpi-profit">
                ₹${netProfit.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>
        </div>

        <!-- Voice Quick-Entry Card -->
        <div class="card card-voice-entry">
          <h2 class="card-title">🎙️ ${t('addVoiceLedgerTitle', 'Add Voice Ledger Entry')}</h2>
          <p class="helper-text">
            ${t('hisabPrompt', 'Say: "Spent 500 on dyes and sold 2 dupattas for 3000 today"')}
          </p>

          <div class="mic-container my-3">
            <button class="btn-mic" id="btn-hisab-mic" aria-label="Hold to speak daily expense and income">
              <span class="mic-icon">🎙️</span>
            </button>
            <span class="mic-status-label" id="hisab-mic-status">
              ${t('holdSpeakEntry', 'Hold & Speak Entry')}
            </span>
          </div>

          <p class="transcript-preview text-muted" id="hisab-transcript">
            ${t('transcriptPlaceholder', 'Your spoken words will appear here...')}
          </p>

          <!-- Document / Handwritten Bill Reader (Gemini Multimodal OCR) -->
          <div class="ocr-bill-box p-3 my-3 text-center" style="background: rgba(234, 88, 12, 0.05); border: 1px dashed var(--primary); border-radius: var(--radius-md);">
            <p class="text-sm font-semibold mb-2">📄 ${t('scanBillTitle', 'Scan Handwritten Bill / Khata Slip')}</p>
            <input type="file" id="hisab-doc-input" accept="image/*" capture="environment" style="display:none;" />
            <button type="button" class="btn btn-secondary btn-sm" id="btn-scan-bill-trigger">
              📸 ${t('uploadSlipBtn', 'Upload or Snap Bill Photo')}
              <span class="badge badge-accent ml-1">✨ Gemini Vision</span>
            </button>
            <div id="ocr-bill-status" class="text-xs text-muted mt-2 hidden">
              ⏳ ${t('readingBillOcr', 'Gemini Vision reading handwritten slip...')}
            </div>
          </div>

          <!-- Quick Manual Entry Modal / Inline Form -->
          <div class="form-row mt-3">
            <div class="form-group half">
              <label class="form-label">${t('incomeSalesLabel', 'Income / Sales (₹)')}</label>
              <input type="number" id="input-income" class="form-control" placeholder="0" />
            </div>
            <div class="form-group half">
              <label class="form-label">${t('expenseCostLabel', 'Expense / Purchases (₹)')}</label>
              <input type="number" id="input-expense" class="form-control" placeholder="0" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${t('entryDescLabel', 'Description / Notes')}</label>
            <input type="text" id="input-desc" class="form-control" placeholder="e.g. Natural indigo dye & 2 dupatta sales" />
          </div>

          <button class="btn btn-primary btn-block mt-2" id="btn-save-hisab">
            ✓ ${t('saveLedgerEntryBtn', 'Save Ledger Entry')}
          </button>
        </div>

        <!-- Recent Ledger History -->
        <div class="card card-history">
          <h3 class="card-title">📜 ${t('recentEntriesTitle', 'Recent Transaction Log')}</h3>
          <div class="history-list" id="history-list">
            ${entries.length === 0 ? `
              <p class="empty-state-text">${t('noEntriesYet', 'No entries recorded yet. Speak above to record your first sale!')}</p>
            ` : entries.map(e => `
              <div class="history-item animate-fade-in">
                <div class="history-meta">
                  <strong>${e.desc || t('todaysSales', 'Daily Sales')}</strong>
                  <small>${new Date(e.createdAt).toLocaleDateString()} ${new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div class="history-amounts">
                  ${e.income > 0 ? `<span class="badge-income">+₹${e.income}</span>` : ''}
                  ${e.expense > 0 ? `<span class="badge-expense">-₹${e.expense}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const t = (k, fb) => appState.t(k, fb);

    // 1. Audio Readout in active regional language
    document.getElementById('btn-listen-hisab')?.addEventListener('click', () => {
      const inc = document.getElementById('kpi-income').textContent;
      const exp = document.getElementById('kpi-expense').textContent;
      const prof = document.getElementById('kpi-profit').textContent;
      const text = `${t('incomeLabel', 'Sales')}: ${inc}. ${t('expenseLabel', 'Expenses')}: ${exp}. ${t('netProfitLabel', 'Net profit')}: ${prof}.`;
      voiceService.speak(text);
    });

    // 2. Voice Input for Hisab-Kitab
    const btnMic = document.getElementById('btn-hisab-mic');
    const statusLabel = document.getElementById('hisab-mic-status');
    const transcriptText = document.getElementById('hisab-transcript');

    btnMic?.addEventListener('click', () => {
      if (voiceService.isRecording) {
        voiceService.stopRecording();
        btnMic.classList.remove('recording');
        statusLabel.textContent = t('holdSpeakEntry', 'Hold & Speak Entry');
        return;
      }

      btnMic.classList.add('recording');
      statusLabel.textContent = t('listeningText', 'Listening... speak in your language');

      voiceService.startRecording({
        onInterim: (text) => {
          transcriptText.textContent = text;
        },
        onFinal: (text) => {
          transcriptText.textContent = text;
          btnMic.classList.remove('recording');
          statusLabel.textContent = t('holdSpeakEntry', 'Hold & Speak Entry');
          this.parseHisabVoice(text);
        },
        onError: () => {
          btnMic.classList.remove('recording');
          statusLabel.textContent = t('holdSpeakEntry', 'Hold & Speak Entry');
        }
      });
    });

    // 3. Save Entry
    document.getElementById('btn-save-hisab')?.addEventListener('click', async () => {
      const income = parseInt(document.getElementById('input-income').value || '0', 10);
      const expense = parseInt(document.getElementById('input-expense').value || '0', 10);
      const desc = document.getElementById('input-desc').value.trim();

      if (income === 0 && expense === 0) {
        appState.showToast(t('incomeSalesLabel', 'Please enter income or expense'), 'warning');
        return;
      }

      await offlineStorage.saveHisabEntry({ income, expense, desc });
      appState.showToast(t('ledgerEntrySavedToast', 'Ledger updated!'), 'success');
      this.render(); // Refresh KPI values
    });

    // 4. Handwritten Bill & Slip OCR Scanner (Gemini Vision)
    const btnScanTrigger = document.getElementById('btn-scan-bill-trigger');
    const docInput = document.getElementById('hisab-doc-input');
    const ocrStatus = document.getElementById('ocr-bill-status');

    btnScanTrigger?.addEventListener('click', () => {
      docInput?.click();
    });

    docInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      ocrStatus?.classList.remove('hidden');
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const res = await aiService.extractBillDocument(ev.target.result, file.type || 'image/jpeg');
          ocrStatus?.classList.add('hidden');

          if (res.transactionType === 'income') {
            document.getElementById('input-income').value = res.totalAmount || 0;
            document.getElementById('input-expense').value = 0;
          } else {
            document.getElementById('input-expense').value = res.totalAmount || 0;
            document.getElementById('input-income').value = 0;
          }

          const desc = `${res.vendorOrCustomer}: ${(res.items || []).join(', ')}`;
          document.getElementById('input-desc').value = desc;

          const isHindi = appState.get('language') === 'hi';
          const msg = isHindi
            ? `पर्ची से ₹${res.totalAmount} पहचाने गए (${res.vendorOrCustomer})!`
            : `Bill parsed: ₹${res.totalAmount} recognized from ${res.vendorOrCustomer}!`;
          appState.showToast(msg, 'success');
          voiceService.speak(isHindi ? `पर्ची से ₹${res.totalAmount} का खर्च पहचान लिया गया है।` : `Identified ₹${res.totalAmount} from slip.`);
        } catch (err) {
          ocrStatus?.classList.add('hidden');
          appState.showToast('Could not analyze bill', 'warning');
        }
      };
      reader.readAsDataURL(file);
    });
  },

  parseHisabVoice(text) {
    const t = (k, fb) => appState.t(k, fb);
    const numbers = text.match(/\d+/g);

    let income = 0;
    let expense = 0;

    if (numbers && numbers.length >= 2) {
      expense = parseInt(numbers[0], 10);
      income = parseInt(numbers[1], 10);
    } else if (numbers && numbers.length === 1) {
      if (text.includes('खर्च') || text.includes('খরচ') || text.includes('spent') || text.includes('bought')) {
        expense = parseInt(numbers[0], 10);
      } else {
        income = parseInt(numbers[0], 10);
      }
    }

    document.getElementById('input-income').value = income;
    document.getElementById('input-expense').value = expense;
    document.getElementById('input-desc').value = text;
    appState.showToast(t('generateDraft', 'Values parsed from speech'), 'info');
  }
};
