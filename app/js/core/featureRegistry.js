/**
 * KalaSetu AI — Extensible Feature Registry (Plugin Architecture)
 * Enables adding new AI tools & modules without rewriting core views or navigation.
 */

class FeatureRegistry {
  constructor() {
    this.features = new Map();
    this.activeFeatureId = null;
  }

  /**
   * Register a new feature/module
   * @param {Object} config - { id, titleKey, iconSvg, badge, component, priority }
   */
  register(config) {
    if (!config.id || !config.mount) {
      console.error('Feature must have an id and mount function', config);
      return;
    }
    this.features.set(config.id, {
      priority: 10,
      ...config
    });
    console.log(`[FeatureRegistry] Registered AI module: ${config.id}`);
  }

  getAll() {
    return Array.from(this.features.values()).sort((a, b) => a.priority - b.priority);
  }

  get(id) {
    return this.features.get(id);
  }

  mountActive(id, container) {
    if (this.activeFeatureId && this.features.has(this.activeFeatureId)) {
      const current = this.features.get(this.activeFeatureId);
      if (typeof current.unmount === 'function') {
        current.unmount();
      }
    }

    container.innerHTML = '';
    const next = this.features.get(id);
    if (next && typeof next.mount === 'function') {
      this.activeFeatureId = id;
      next.mount(container);
    }
  }
}

export const featureRegistry = new FeatureRegistry();
