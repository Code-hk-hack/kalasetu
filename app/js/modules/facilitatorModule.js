/**
 * KalaSetu AI — Feature 7: Facilitator / NGO Review Mode Module
 * Allows cluster facilitators, SHG heads, and NGO volunteers to assist artisans
 * without overriding artisan authority over final price or publication.
 */

import { appState } from '../core/appState.js';
import { offlineStorage } from '../core/offlineStorage.js';
import { ClaimSafeService } from '../core/claimSafeService.js';

export const FacilitatorModule = {
  id: 'facilitator',
  titleKey: 'tabFacilitator',
  icon: '🤝',
  priority: 5,

  // Assigned artisans under this cluster facilitator
  assignedArtisans: [
    { id: 'art-1', name: 'Ramji Lal Meena', cluster: 'Bagru Hand-block Print', phone: '+91 98765 43210', activeListings: 2 },
    { id: 'art-2', name: 'Shanti Devi Kumhar', cluster: 'Jaipur Blue Pottery', phone: '+91 98111 22334', activeListings: 1 },
    { id: 'art-3', name: 'Gopal Lal Chippa', cluster: 'Sanganer Screen Print', phone: '+91 97222 33445', activeListings: 3 }
  ],

  mount(container) {
    this.container = container;
    this.render();
  },

  async render() {
    const listings = await offlineStorage.getListings();

    // Aggregate dashboard metrics
    const totalAssigned = this.assignedArtisans.length;
    const draftCount = listings.filter(l => !l.listingStatus || l.listingStatus === 'draft').length;
    const needVerificationCount = listings.filter(l => 
      l.listingStatus === 'pending_claim_verification' || 
      (l.claims && l.claims.some(c => c.claim_status === 'needs_verification'))
    ).length;
    const approvedCount = listings.filter(l => l.listingStatus === 'approved' || l.listingStatus === 'facilitator_reviewed').length;
    const publishedCount = listings.filter(l => l.listingStatus === 'published' || l.synced).length;

    this.container.innerHTML = `
      <div class="module-wrapper animate-fade-in">
        <!-- NGO Header Strip -->
        <div class="facilitator-header-card">
          <div class="facilitator-badge-row">
            <span class="badge badge-ngo">🤝 Cluster Facilitator & NGO Desk</span>
            <span class="badge badge-role">Role: ${appState.get('userRole') || 'Facilitator'}</span>
          </div>
          <h2 class="facilitator-title">Artisan Support & Listing Verification</h2>
          <p class="facilitator-subtitle">
            Assist rural kaarigars with photo clarity, craft specifications, and claim checks.
            <strong>Notice: Final price and publication always require artisan approval.</strong>
          </p>
        </div>

        <!-- 5-Metric Facilitator Dashboard Card -->
        <div class="facilitator-metrics-grid">
          <div class="metric-card">
            <span class="metric-num">${totalAssigned}</span>
            <span class="metric-lbl">Assigned Kaarigars</span>
          </div>
          <div class="metric-card">
            <span class="metric-num text-warning">${draftCount}</span>
            <span class="metric-lbl">Draft Listings</span>
          </div>
          <div class="metric-card">
            <span class="metric-num text-amber">${needVerificationCount}</span>
            <span class="metric-lbl">Needs Verification</span>
          </div>
          <div class="metric-card">
            <span class="metric-num text-info">${approvedCount}</span>
            <span class="metric-lbl">Facilitator Reviewed</span>
          </div>
          <div class="metric-card">
            <span class="metric-num text-success">${publishedCount}</span>
            <span class="metric-lbl">Published Storefront</span>
          </div>
        </div>

        <!-- Assigned Artisans Quick List -->
        <div class="card mt-3">
          <h3 class="card-title">👥 Assigned Cluster Artisans</h3>
          <div class="artisan-roster">
            ${this.assignedArtisans.map(a => `
              <div class="roster-item">
                <div class="roster-avatar">🏺</div>
                <div class="roster-details">
                  <strong>${a.name}</strong>
                  <span class="text-sm text-muted">📍 ${a.cluster} • 📞 ${a.phone}</span>
                </div>
                <span class="badge badge-sm">${a.activeListings} Crafts</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Listings Review Queue -->
        <div class="card mt-3">
          <h3 class="card-title">📋 Listings Awaiting Facilitator Review</h3>
          <p class="helper-text">Verify authenticity evidence, add review remarks, or mark as reviewed for artisan confirmation.</p>

          <div class="review-queue-list">
            ${listings.length === 0 ? `
              <p class="text-muted text-center p-3">No pending listings in queue. Create a listing in Voice Cataloger to test review mode.</p>
            ` : listings.map(item => {
              const status = item.listingStatus || 'draft';
              const claims = item.claims || [];
              const pendingClaims = claims.filter(c => c.claim_status === 'needs_verification');

              return `
                <div class="review-queue-item" data-id="${item.id}">
                  <div class="queue-item-header">
                    <div>
                      <h4 class="queue-craft-title">${item.title}</h4>
                      <span class="text-xs text-muted">By: ${item.artisan || 'Ramji Lal Meena'} • ₹${item.price || 1250}</span>
                    </div>
                    <span class="badge badge-status-${status}">${status.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>

                  ${pendingClaims.length > 0 ? `
                    <div class="queue-claims-box">
                      <span class="text-xs text-amber font-bold">⚠️ Unverified Claims:</span>
                      <div class="claim-chips-wrap">
                        ${pendingClaims.map(c => `
                          <span class="badge-claim-yellow">${c.label}</span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Facilitator Review Note Field -->
                  <div class="form-group mt-2">
                    <label class="form-label text-xs">Facilitator Review Note / Sahayata Remark:</label>
                    <input type="text" class="form-control form-control-sm input-review-note" 
                      placeholder="e.g. Verified with Bagru Vikas Samiti membership card" 
                      value="${item.facilitatorNote || ''}" />
                  </div>

                  <div class="queue-actions-row">
                    <button class="btn btn-sm btn-outline btn-mark-reviewed" data-id="${item.id}">
                      ✓ Mark Facilitator Reviewed
                    </button>
                    <button class="btn btn-sm btn-secondary btn-open-artisan-approval" data-id="${item.id}">
                      📢 Request Artisan Final Approval
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    this.container.querySelectorAll('.btn-mark-reviewed').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = Number(btn.getAttribute('data-id'));
        const parent = btn.closest('.review-queue-item');
        const noteInput = parent.querySelector('.input-review-note');
        const note = noteInput ? noteInput.value : '';

        const listings = await offlineStorage.getListings();
        const target = listings.find(l => l.id === id);
        if (target) {
          target.listingStatus = 'facilitator_reviewed';
          target.facilitatorNote = note;
          target.facilitatorReviewedAt = new Date().toISOString();
          await offlineStorage.saveListing(target);
          appState.showToast('Listing marked as Facilitator Reviewed! Awaiting artisan approval.', 'success');
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-open-artisan-approval').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id'));
        const listings = await offlineStorage.getListings();
        const target = listings.find(l => l.id === id);
        if (target) {
          target.listingStatus = 'pending_artisan_approval';
          await offlineStorage.saveListing(target);
          appState.showToast('Notification sent to artisan for final price & publishing approval!', 'info');
          this.render();
        }
      });
    });
  }
};
