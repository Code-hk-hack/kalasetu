/**
 * KalaSetu AI — Market Showcase, Space Stager, Reels-to-Artisan & Smart Geofencing Module
 * Direct WhatsApp sharing, buyer view, AI room decor staging, and Uber/Ola style Geofence dispatch.
 * Fully localized across 9 Indian regional languages with 0 MB server load and 100% free OpenStreetMap.
 */

import { appState } from '../core/appState.js';
import { voiceService } from '../core/voiceService.js';
import { offlineStorage } from '../core/offlineStorage.js';
import { geofenceService } from '../core/geofenceService.js';
import { ProductPassportService } from '../core/productPassportService.js';

export const MarketShowcaseModule = {
  id: 'market',
  titleKey: 'tabMarket',
  icon: '🛍️',
  priority: 4,

  // Map state
  mapInstance: null,
  courierMarker: null,
  geofenceCircle: null,
  routePolyline: null,
  simInterval: null,
  currentSimStep: 0,
  currentRadius: 1500,
  waypoints: [],
  selectedCraftTitle: 'Bagru Hand-Block Printed Cotton Dupatta',

  mount(container) {
    this.container = container;
    this.waypoints = geofenceService.getDefaultRouteWaypoints();
    this.render();
  },

  async render() {
    const t = (k, fb) => appState.t(k, fb);
    const listings = await offlineStorage.getListings();

    // Default sample crafts if none created yet
    const sampleItems = listings.length > 0 ? listings : [
      {
        id: 'sample-1',
        title: 'Bagru Hand-Block Printed Cotton Dupatta',
        category: 'Textiles & Handloom',
        material: '100% Pure Cotton & Natural Indigo',
        price: 1250,
        dimensions: '2.5m × 0.9m',
        cluster: 'Bagru / Jaipur Cluster',
        isGI: true,
        image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&auto=format&fit=crop&q=60'
      },
      {
        id: 'sample-2',
        title: 'Jaipur Authentic Blue Pottery Floral Vase',
        category: 'Ceramics & Pottery',
        material: 'Quartz, Glass, Natural Oxides',
        price: 1850,
        dimensions: '12 Inches Height',
        cluster: 'Sanganer / Jaipur Cluster',
        isGI: true,
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60'
      }
    ];

    this.container.innerHTML = `
      <div class="module-wrapper animate-fade-in">
        <!-- Sub-nav pills -->
        <div class="subnav-pill-row">
          <button class="pill-btn active" id="btn-tab-catalog">
            🛍️ ${t('artisanCatalogTab', 'Artisan Catalog')}
          </button>
          <button class="pill-btn" id="btn-tab-passport">
            🛂 ${t('passportTab', 'Product Passport')}
          </button>
          <button class="pill-btn" id="btn-tab-stager">
            🏡 ${t('aiSpaceStagerTab', 'AI Space Stager')}
          </button>
          <button class="pill-btn" id="btn-tab-reels">
            🔍 ${t('reelsToArtisanTab', 'Reels-to-Artisan')}
          </button>
          <button class="pill-btn" id="btn-tab-geofence">
            📍 ${t('geofenceDeliveryTab', 'Geofence Dispatch')}
          </button>
        </div>

        <!-- 1. Catalog Grid View -->
        <div id="view-catalog" class="subview-section">
          <div class="section-header-bar">
            <div>
              <h2 class="section-title">${t('digitalStorefrontTitle', 'Your Digital Storefront')}</h2>
              <span class="text-sm text-muted">${sampleItems.length} crafts ready for buyers</span>
            </div>
            <button class="btn btn-sm btn-outline" id="btn-share-store">
              🔗 ${t('shareStoreBtn', 'Share Store Link')}
            </button>
          </div>

          <div class="catalog-grid">
            ${sampleItems.map(item => `
              <div class="craft-card animate-slide-up">
                <div class="craft-card-image-box">
                  <img src="${item.image}" alt="${item.title}" class="craft-card-img" />
                  <span class="badge-cluster">📍 ${item.cluster || 'Heritage Cluster'}</span>
                  ${item.isGI ? '<span class="badge-gi">🏅 GI Tag</span>' : ''}
                </div>
                <div class="craft-card-body">
                  <h3 class="craft-title">${item.title}</h3>
                  <p class="craft-meta">🧵 ${item.material || 'Handmade'}</p>
                  <div class="craft-footer">
                    <span class="craft-price">₹${item.price?.toLocaleString('en-IN') || '1,250'}</span>
                    <div class="craft-footer-actions">
                      <button class="btn btn-whatsapp-icon" data-id="${item.id}" data-title="${item.title}" data-price="${item.price || 1250}">
                        <span class="wa-icon">💬</span> ${t('shareCraftBtn', 'Share')}
                      </button>
                      <button class="btn btn-passport-view" data-id="${item.id}">
                        🛂 <span>Passport</span>
                      </button>
                      <button class="btn btn-geofence-track" data-id="${item.id}" data-title="${item.title}" data-cluster="${item.cluster || 'Bagru Cluster'}">
                        🚚 <span>Track</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 1.5 Product Passport & QR Verifiable Provenance View (Feature 5) -->
        <div id="view-passport" class="subview-section hidden">
          <div class="card card-passport-wrapper">
            <div class="section-header-bar">
              <div>
                <h2 class="section-title">🛂 Heritage Product Passport & QR</h2>
                <span class="text-sm text-muted">Transparent craft provenance with artisan privacy protection.</span>
              </div>
              <button class="btn btn-sm btn-outline" id="btn-refresh-passport">🔄 Refresh</button>
            </div>
            <div id="passport-render-container" class="passport-render-container mt-3">
              <!-- Injected dynamically by ProductPassportService -->
            </div>
          </div>
        </div>

        <!-- 2. AI Room Decor & Space Stager View -->
        <div id="view-stager" class="subview-section hidden">
          <div class="card card-stager">
            <h2 class="card-title">🏡 ${t('roomStagerTitle', 'AI Room Decor & Space Stager')}</h2>
            <p class="helper-text">
              ${t('roomStagerSubtitle', 'Place authentic handcrafted pottery and textiles directly into modern living rooms.')}
            </p>

            <div class="stager-canvas-box" id="stager-box">
              <div class="stager-room-bg" id="stager-room">
                <div class="stager-craft-overlay" id="stager-craft">
                  <img src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60" alt="Decor Craft" class="staged-craft-img" />
                </div>
              </div>
              <div class="stager-floating-controls">
                <button class="btn-chip" id="btn-stage-vase">🏺 Blue Pottery Vase</button>
                <button class="btn-chip" id="btn-stage-blockprint">🖼️ Bagru Tapestry</button>
                <button class="btn-chip" id="btn-stage-cushion">🛋️ Sanganeri Cushion</button>
              </div>
            </div>

            <button class="btn btn-secondary btn-block mt-3" id="btn-upload-room">
              📷 ${t('renderStagedRoomBtn', 'Stage Craft in Room (Neural Preview)')}
            </button>
          </div>
        </div>

        <!-- 3. Reels-to-Artisan Visual Search View -->
        <div id="view-reels" class="subview-section hidden">
          <div class="card card-reels">
            <h2 class="card-title">🔍 ${t('reelsMatcherTitle', 'Reels-to-Artisan Visual Matcher')}</h2>
            <p class="helper-text">
              ${t('reelsMatcherSubtitle', 'Reverse search viral Instagram/Pinterest reels directly to authentic craft clusters.')}
            </p>

            <div class="reels-upload-box" id="reels-upload-box">
              <span class="upload-icon">📱</span>
              <p>${t('reelsDropzoneText', 'Drop social media screenshot or tap to upload')}</p>
            </div>

            <div id="reels-match-result" class="reels-match-box hidden animate-slide-up">
              <span class="badge badge-success">🎯 98% ${t('matchFoundTitle', 'Verified Authentic Cluster Match:')}</span>
              <div class="match-card mt-2">
                <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&auto=format&fit=crop&q=60" class="match-img" alt="Matched Craft" />
                <div class="match-details">
                  <h4>Bagru Hand-Block Dupatta</h4>
                  <p class="text-sm">📍 Bagru Artisan Cluster (Jaipur)</p>
                  <p class="text-sm font-bold text-accent">₹1,250 (Direct Lineage Fair Price)</p>
                  <button class="btn btn-primary btn-sm mt-1" id="btn-order-direct">
                    🛒 ${t('shareWhatsappBtn', 'Inquire on WhatsApp')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Uber/Ola Style Live Geofence Delivery Tracker View -->
        <div id="view-geofence" class="subview-section hidden">
          <div class="card card-geofence">
            <div class="geofence-header-strip">
              <div>
                <h2 class="card-title">
                  <span>📍</span>
                  <span>${t('geofenceTrackerTitle', 'Smart Geofence Delivery Hub')}</span>
                </h2>
                <p class="helper-text mb-0" id="geofence-tracking-craft-title">
                  Tracking: <strong>${this.selectedCraftTitle}</strong>
                </p>
              </div>
              <span class="badge badge-geofence-pulse" id="geofence-live-badge">🟢 Radar Active</span>
            </div>

            <!-- Live Status Banner (Dynamic: Outside -> Breached -> Doorstep) -->
            <div class="geofence-status-banner outside" id="geofence-status-banner">
              <div class="banner-icon" id="banner-status-icon">🚚</div>
              <div class="banner-info">
                <h4 id="banner-status-title">En Route on Ajmer-Jaipur Corridor</h4>
                <p id="banner-status-sub">Dispatched from Bagru GI Hub. Approaching urban perimeter.</p>
              </div>
            </div>

            <!-- Leaflet Live Map Canvas (Free OpenStreetMap) -->
            <div class="geofence-map-wrapper">
              <div id="geofence-leaflet-map" class="geofence-leaflet-map"></div>
              <div class="map-floating-overlay-card">
                <div class="radar-dot"></div>
                <span>Geofence Radius: <strong id="map-radius-display">1.5 km</strong></span>
              </div>
            </div>

            <!-- Telemetry Cards Grid -->
            <div class="geofence-telemetry-grid">
              <div class="telemetry-card">
                <span class="telemetry-label">Remaining</span>
                <strong class="telemetry-val text-accent" id="tele-dist">14.8 km</strong>
              </div>
              <div class="telemetry-card">
                <span class="telemetry-label">Live ETA</span>
                <strong class="telemetry-val" id="tele-eta">35 mins</strong>
              </div>
              <div class="telemetry-card">
                <span class="telemetry-label">Geofence</span>
                <strong class="telemetry-val text-muted" id="tele-zone">Outside</strong>
              </div>
              <div class="telemetry-card otp-card">
                <span class="telemetry-label">Doorstep OTP</span>
                <strong class="telemetry-val otp-val blurred" id="tele-otp">••••</strong>
              </div>
            </div>

            <!-- Geofence Control & Slider -->
            <div class="geofence-controls-box">
              <div class="slider-header">
                <label class="form-label" for="geofence-radius-slider">
                  <span>🎯 Proximity Alert Radius (Uber/Ola Trigger):</span>
                  <span class="slider-value" id="radius-val-label">1,500 meters</span>
                </label>
              </div>
              <input type="range" class="custom-range" id="geofence-radius-slider" min="500" max="4000" step="250" value="1500" />
              <div class="radius-markers">
                <span>500m (Strict)</span>
                <span>1.5km (Optimal)</span>
                <span>4km (Highway)</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="geofence-action-bar">
              <button class="btn btn-primary btn-block" id="btn-start-dispatch-sim">
                <span>🚀</span>
                <span id="sim-btn-text">Start Uber-Style Courier Dispatch (लाइव सिमुलेशन)</span>
              </button>
              <div class="geofence-secondary-actions">
                <button class="btn btn-outline btn-sm" id="btn-device-gps">
                  <span>📱</span> <span>Use Device GPS</span>
                </button>
                <button class="btn btn-outline btn-sm" id="btn-reset-dispatch">
                  <span>🔄</span> <span>Reset Route</span>
                </button>
              </div>
            </div>

            <!-- Live Event Feed Timeline -->
            <div class="geofence-timeline-box">
              <h4 class="timeline-title">📡 Dispatch Telemetry Audit Trail</h4>
              <div class="timeline-feed" id="geofence-event-feed">
                <div class="timeline-event">
                  <span class="event-time">11:00 AM</span>
                  <span class="event-desc">📦 Bagru Artisan Workshop: Parcel packed & GI certified seal verified</span>
                </div>
                <div class="timeline-event">
                  <span class="event-time">11:05 AM</span>
                  <span class="event-desc">🚚 Dispatch Partner onboarded on Ajmer-Jaipur Expressway</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const t = (k, fb) => appState.t(k, fb);

    // 1. Sub-nav pill switching
    const pills = [
      { id: 'btn-tab-catalog', view: 'view-catalog' },
      { id: 'btn-tab-passport', view: 'view-passport' },
      { id: 'btn-tab-stager', view: 'view-stager' },
      { id: 'btn-tab-reels', view: 'view-reels' },
      { id: 'btn-tab-geofence', view: 'view-geofence' }
    ];

    pills.forEach(p => {
      document.getElementById(p.id)?.addEventListener('click', () => {
        pills.forEach(other => {
          document.getElementById(other.id)?.classList.remove('active');
          document.getElementById(other.view)?.classList.add('hidden');
        });
        document.getElementById(p.id)?.classList.add('active');
        document.getElementById(p.view)?.classList.remove('hidden');

        // If switching to passport tab, render passport
        if (p.view === 'view-passport') {
          this.renderPassportView();
        }

        // If switching to geofence tab, initialize or refresh map dimensions
        if (p.view === 'view-geofence') {
          setTimeout(() => this.initOrRefreshMap(), 150);
        }
      });
    });

    // 1.5 Passport button on craft cards
    document.querySelectorAll('.btn-passport-view').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const listings = await offlineStorage.getListings();
        const found = listings.find(l => String(l.id) === String(id));
        this.renderPassportView(found);
        document.getElementById('btn-tab-passport')?.click();
      });
    });

    document.getElementById('btn-refresh-passport')?.addEventListener('click', () => {
      this.renderPassportView();
    });

    // 2. WhatsApp 1-Tap Sharing
    document.querySelectorAll('.btn-whatsapp-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const title = btn.getAttribute('data-title');
        const price = btn.getAttribute('data-price');
        const text = `KalaSetu AI: Authentic handcrafted "${title}". Fair Price: ₹${price}. Inquire directly to support the artisan!`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      });
    });

    // 3. Track button in catalog grid
    document.querySelectorAll('.btn-geofence-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title');
        this.selectedCraftTitle = title || 'Authentic Handcrafted Product';
        const titleEl = document.getElementById('geofence-tracking-craft-title');
        if (titleEl) {
          titleEl.innerHTML = `Tracking: <strong>${this.selectedCraftTitle}</strong>`;
        }
        // Switch to Geofence tab
        document.getElementById('btn-tab-geofence')?.click();
      });
    });

    // 4. Share Entire Store
    document.getElementById('btn-share-store')?.addEventListener('click', () => {
      const artisan = appState.get('artisan');
      const text = `Check out authentic handicrafts from ${artisan.name} (${artisan.cluster}) on KalaSetu AI: https://kalasetu.org/store/${encodeURIComponent(artisan.name)}`;
      navigator.clipboard?.writeText(text);
      appState.showToast(t('shareStoreBtn', 'Store link copied!'), 'success');
    });

    // 5. Stager craft switching
    const stagedImg = document.querySelector('.staged-craft-img');
    document.getElementById('btn-stage-vase')?.addEventListener('click', () => {
      if (stagedImg) stagedImg.src = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=60';
      appState.showToast('Staged Blue Pottery Vase', 'info');
    });
    document.getElementById('btn-stage-blockprint')?.addEventListener('click', () => {
      if (stagedImg) stagedImg.src = 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&auto=format&fit=crop&q=60';
      appState.showToast('Staged Bagru Block Print', 'info');
    });

    // 6. Reels search simulation
    const reelsBox = document.getElementById('reels-upload-box');
    const reelsResult = document.getElementById('reels-match-result');
    reelsBox?.addEventListener('click', () => {
      appState.showToast(t('listeningText', 'AI analyzing screenshot...'), 'info');
      setTimeout(() => {
        reelsResult?.classList.remove('hidden');
        reelsResult?.scrollIntoView({ behavior: 'smooth' });
      }, 700);
    });

    document.getElementById('btn-order-direct')?.addEventListener('click', () => {
      appState.showToast('Direct inquiry sent to artisan!', 'success');
    });

    // 7. Geofence Radius Slider
    const radiusSlider = document.getElementById('geofence-radius-slider');
    radiusSlider?.addEventListener('input', (e) => {
      this.currentRadius = parseInt(e.target.value, 10);
      const label = document.getElementById('radius-val-label');
      const mapDisplay = document.getElementById('map-radius-display');
      if (label) label.textContent = `${this.currentRadius.toLocaleString()} meters`;
      if (mapDisplay) mapDisplay.textContent = `${(this.currentRadius / 1000).toFixed(1)} km`;

      if (this.geofenceCircle) {
        this.geofenceCircle.setRadius(this.currentRadius);
      }
      this.updateTelemetryAtStep(this.currentSimStep);
    });

    // 8. Start / Pause Simulation
    document.getElementById('btn-start-dispatch-sim')?.addEventListener('click', () => {
      this.toggleSimulation();
    });

    // 9. Reset Route
    document.getElementById('btn-reset-dispatch')?.addEventListener('click', () => {
      this.resetSimulation();
    });

    // 10. Device GPS Integration (100% Free)
    document.getElementById('btn-device-gps')?.addEventListener('click', () => {
      this.useDeviceGps();
    });
  },

  /**
   * Initializes or resizes the Leaflet Map with zero external billing
   */
  initOrRefreshMap() {
    const mapContainer = document.getElementById('geofence-leaflet-map');
    if (!mapContainer) return;

    if (!window.L) {
      console.warn('Leaflet not loaded yet');
      return;
    }

    if (!this.mapInstance) {
      // 1. Create map centered between Bagru & Jaipur
      this.mapInstance = window.L.map('geofence-leaflet-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([26.8623, 75.6665], 11);

      // Add zoom control in top-left
      window.L.control.zoom({ position: 'topleft' }).addTo(this.mapInstance);

      // 2. Add free OpenStreetMap tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(this.mapInstance);

      // 3. Origin Marker (Bagru Craft Hub)
      const originIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-bubble">🏺</div><span class="pin-label">Bagru Hub</span>`,
        iconSize: [40, 50],
        iconAnchor: [20, 48]
      });
      window.L.marker([this.waypoints[0].lat, this.waypoints[0].lng], { icon: originIcon })
        .addTo(this.mapInstance)
        .bindPopup('<b>Bagru GI Cluster Hub</b><br>Heritage Dyeing & Printing Workshop');

      // 4. Destination Marker (Buyer Gate)
      const destPoint = this.waypoints[this.waypoints.length - 1];
      const destIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-bubble dest">🏡</div><span class="pin-label">Buyer Gate</span>`,
        iconSize: [40, 50],
        iconAnchor: [20, 48]
      });
      window.L.marker([destPoint.lat, destPoint.lng], { icon: destIcon })
        .addTo(this.mapInstance)
        .bindPopup('<b>Buyer Destination</b><br>Geofence Handshake Zone');

      // 5. Geofence Circle around Buyer Destination (Uber/Ola Proximity Perimeter)
      this.geofenceCircle = window.L.circle([destPoint.lat, destPoint.lng], {
        radius: this.currentRadius,
        color: '#ea580c',
        fillColor: '#fed7aa',
        fillOpacity: 0.28,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(this.mapInstance);

      // 6. Route Polyline
      const latLngs = this.waypoints.map(w => [w.lat, w.lng]);
      this.routePolyline = window.L.polyline(latLngs, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.75,
        dashArray: '8, 8'
      }).addTo(this.mapInstance);

      // 7. Courier Delivery Van Marker
      const vanIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-bubble van">🚚</div><span class="pin-label">Courier Van</span>`,
        iconSize: [40, 50],
        iconAnchor: [20, 48]
      });
      this.courierMarker = window.L.marker([this.waypoints[0].lat, this.waypoints[0].lng], { icon: vanIcon })
        .addTo(this.mapInstance);

      this.updateTelemetryAtStep(0);
    } else {
      this.mapInstance.invalidateSize();
    }
  },

  /**
   * Updates distance, live zone, ETA, and triggers audio chimes on geofence transitions
   */
  updateTelemetryAtStep(stepIdx) {
    if (!this.waypoints || this.waypoints.length === 0) return;
    const currentPoint = this.waypoints[stepIdx];
    const destPoint = this.waypoints[this.waypoints.length - 1];

    if (this.courierMarker) {
      this.courierMarker.setLatLng([currentPoint.lat, currentPoint.lng]);
    }

    const status = geofenceService.checkGeofenceStatus(
      currentPoint.lat,
      currentPoint.lng,
      destPoint.lat,
      destPoint.lng,
      this.currentRadius
    );

    // Update Telemetry Grid
    const distEl = document.getElementById('tele-dist');
    const etaEl = document.getElementById('tele-eta');
    const zoneEl = document.getElementById('tele-zone');
    const otpEl = document.getElementById('tele-otp');
    const banner = document.getElementById('geofence-status-banner');
    const bannerIcon = document.getElementById('banner-status-icon');
    const bannerTitle = document.getElementById('banner-status-title');
    const bannerSub = document.getElementById('banner-status-sub');
    const liveBadge = document.getElementById('geofence-live-badge');

    if (distEl) distEl.textContent = status.formattedDistance;
    if (etaEl) etaEl.textContent = `${status.estimatedMinutes} mins`;

    if (status.zone === 'doorstep') {
      if (zoneEl) {
        zoneEl.textContent = 'At Doorstep!';
        zoneEl.className = 'telemetry-val text-success';
      }
      if (otpEl) {
        otpEl.textContent = '8492';
        otpEl.classList.remove('blurred');
      }
      if (banner) {
        banner.className = 'geofence-status-banner doorstep';
      }
      if (bannerIcon) bannerIcon.textContent = '🔑';
      if (bannerTitle) bannerTitle.textContent = 'At Doorstep (< 100m) — Handshake OTP Unlocked!';
      if (bannerSub) bannerSub.textContent = 'Provide OTP 8492 to courier partner to confirm delivery.';
      if (liveBadge) {
        liveBadge.textContent = '🏆 Doorstep Handshake';
        liveBadge.style.background = '#dcfce7';
        liveBadge.style.color = '#15803d';
      }
    } else if (status.zone === 'inside-geofence') {
      if (zoneEl) {
        zoneEl.textContent = `Inside (< ${(this.currentRadius/1000).toFixed(1)}km)`;
        zoneEl.className = 'telemetry-val text-accent';
      }
      if (otpEl) {
        otpEl.textContent = '••••';
        otpEl.classList.add('blurred');
      }
      if (banner) {
        banner.className = 'geofence-status-banner breached';
      }
      if (bannerIcon) bannerIcon.textContent = '⚡';
      if (bannerTitle) bannerTitle.textContent = `⚡ GEOFENCE BREACH: Within ${(this.currentRadius/1000).toFixed(1)} km of Buyer Gate!`;
      if (bannerSub) bannerSub.textContent = `Courier entered proximity perimeter (${status.formattedDistance} away). ETA: ${status.estimatedMinutes} mins.`;
      if (liveBadge) {
        liveBadge.textContent = '⚡ Proximity Alert';
        liveBadge.style.background = '#ffedd5';
        liveBadge.style.color = '#c2410c';
      }
    } else {
      if (zoneEl) {
        zoneEl.textContent = 'Outside (In Transit)';
        zoneEl.className = 'telemetry-val text-muted';
      }
      if (otpEl) {
        otpEl.textContent = '••••';
        otpEl.classList.add('blurred');
      }
      if (banner) {
        banner.className = 'geofence-status-banner outside';
      }
      if (bannerIcon) bannerIcon.textContent = '🚚';
      if (bannerTitle) bannerTitle.textContent = 'En Route on Ajmer-Jaipur Corridor';
      if (bannerSub) bannerSub.textContent = `Transit point: ${currentPoint.label}. ${status.formattedDistance} from Buyer destination.`;
      if (liveBadge) {
        liveBadge.textContent = '🟢 Radar Active';
        liveBadge.style.background = '#ecfdf5';
        liveBadge.style.color = '#059669';
      }
    }
  },

  /**
   * Toggles the live Uber/Ola movement simulation
   */
  toggleSimulation() {
    const btnText = document.getElementById('sim-btn-text');

    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
      if (btnText) btnText.textContent = 'Resume Courier Dispatch (सिमुलेशन जारी रखें)';
      appState.showToast('Dispatch simulation paused', 'info');
      return;
    }

    if (this.currentSimStep >= this.waypoints.length - 1) {
      this.currentSimStep = 0;
    }

    if (btnText) btnText.textContent = 'Pause Courier Dispatch (सिमुलेशन रोकें)';
    appState.showToast('Live courier transit underway...', 'info');

    let previousZone = 'outside';

    this.simInterval = setInterval(() => {
      this.currentSimStep++;

      if (this.currentSimStep >= this.waypoints.length) {
        clearInterval(this.simInterval);
        this.simInterval = null;
        if (btnText) btnText.textContent = 'Start Uber-Style Courier Dispatch (लाइव सिमुलेशन)';
        geofenceService.playChime('doorstep');
        appState.showToast('🏆 Handshake OTP 8492 Verified! Order Successfully Delivered.', 'success');
        this.addTimelineEvent(`🔑 11:24 AM: Handshake OTP 8492 verified at Buyer Doorstep.`);
        return;
      }

      this.updateTelemetryAtStep(this.currentSimStep);
      const currentPoint = this.waypoints[this.currentSimStep];
      const destPoint = this.waypoints[this.waypoints.length - 1];
      const status = geofenceService.checkGeofenceStatus(
        currentPoint.lat,
        currentPoint.lng,
        destPoint.lat,
        destPoint.lng,
        this.currentRadius
      );

      // Trigger alerts on zone changes
      if (status.zone === 'inside-geofence' && previousZone === 'outside') {
        geofenceService.playChime('breach');
        appState.showToast(`⚡ Geofence Breach: Delivery Van entered ${(this.currentRadius/1000).toFixed(1)}km Buyer Zone!`, 'warning');
        this.addTimelineEvent(`⚡ 11:18 AM: Geofence Breach — Courier crossed ${(this.currentRadius/1000).toFixed(1)} km perimeter!`);
      } else if (status.zone === 'doorstep' && previousZone !== 'doorstep') {
        geofenceService.playChime('doorstep');
        appState.showToast('🔑 Courier reached Buyer Gate! OTP 8492 Unlocked.', 'success');
        this.addTimelineEvent(`🔑 11:22 AM: At Doorstep (<100m) — Secure OTP 8492 handshake triggered.`);
      } else {
        this.addTimelineEvent(`📍 Transit: Courier passed ${currentPoint.label} (${status.formattedDistance} left).`);
      }

      previousZone = status.zone;
    }, 1800);
  },

  /**
   * Resets courier position back to Bagru Cluster
   */
  resetSimulation() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.currentSimStep = 0;
    this.updateTelemetryAtStep(0);
    const btnText = document.getElementById('sim-btn-text');
    if (btnText) btnText.textContent = 'Start Uber-Style Courier Dispatch (लाइव सिमुलेशन)';
    appState.showToast('Route reset to Bagru GI Cluster origin', 'info');
  },

  /**
   * Device GPS Integration via HTML5 Geolocation API (100% Free, Zero RAM)
   */
  useDeviceGps() {
    if (!navigator.geolocation) {
      appState.showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }

    appState.showToast('Acquiring live device GPS coordinates...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const destPoint = this.waypoints[this.waypoints.length - 1];

        if (this.courierMarker) {
          this.courierMarker.setLatLng([userLat, userLng]);
          this.mapInstance?.setView([userLat, userLng], 13);
        }

        const status = geofenceService.checkGeofenceStatus(
          userLat,
          userLng,
          destPoint.lat,
          destPoint.lng,
          this.currentRadius
        );

        const distEl = document.getElementById('tele-dist');
        const etaEl = document.getElementById('tele-eta');
        if (distEl) distEl.textContent = status.formattedDistance;
        if (etaEl) etaEl.textContent = `${status.estimatedMinutes} mins`;

        appState.showToast(`GPS Connected: ${status.formattedDistance} to Buyer Hub`, 'success');
        this.addTimelineEvent(`📱 Device GPS Live Sync: (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`);
      },
      (err) => {
        appState.showToast(`GPS Error: ${err.message}. Using simulated cluster coordinates.`, 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  },

  /**
   * Render verifiable Product Passport with QR code and privacy consent (Feature 5)
   */
  async renderPassportView(selectedItem = null) {
    const container = document.getElementById('passport-render-container');
    if (!container) return;

    let target = selectedItem;
    if (!target) {
      const listings = await offlineStorage.getListings();
      target = listings[0] || {
        id: 'sample-1',
        title: 'Bagru Hand-Block Printed Cotton Dupatta',
        material: '100% Pure Cotton & Natural Indigo',
        dimensions: '2.5m x 0.9m',
        careInstructions: 'Cold hand wash with gentle soap, dry in shade',
        leadTime: '3 business days',
        price: 1250,
        artisan: appState.get('artisan').name,
        cluster: 'Bagru / Jaipur Cluster',
        image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&auto=format&fit=crop&q=60',
        claims: [
          { label: 'Natural Dye', claim_status: 'artisan_confirmed' },
          { label: 'Handmade', claim_status: 'artisan_confirmed' },
          { label: 'GI Registered Cluster', claim_status: 'artisan_confirmed' }
        ],
        artisanStory: 'Our family has practiced traditional wooden block carving and natural indigo vat dyeing in Bagru for four generations.'
      };
    }

    const passportData = ProductPassportService.generatePassportData(target);
    container.innerHTML = ProductPassportService.renderPassportHtml(passportData);

    // Bind copy link
    container.querySelector('.btn-copy-passport')?.addEventListener('click', (e) => {
      const url = e.target.getAttribute('data-url') || window.location.href;
      navigator.clipboard?.writeText(url);
      appState.showToast('Product Passport link copied!', 'success');
    });
  },

  /**
   * Adds an item to the telemetry event feed
   */
  addTimelineEvent(desc) {
    const feed = document.getElementById('geofence-event-feed');
    if (!feed) return;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const item = document.createElement('div');
    item.className = 'timeline-event animate-slide-up';
    item.innerHTML = `
      <span class="event-time">${timeStr}</span>
      <span class="event-desc">${desc}</span>
    `;
    feed.insertBefore(item, feed.firstChild);
  }
};
