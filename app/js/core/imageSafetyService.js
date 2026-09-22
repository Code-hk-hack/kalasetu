/**
 * KalaSetu AI — Feature 2: Truthful Image Studio / Safe Image Policy Engine
 * Preserves authentic handmade details, enforces safe image operations,
 * and performs client-side photo quality analysis with zero generative hallucinations.
 */

export class ImageSafetyService {
  /**
   * Policy notice to display on UI
   */
  static POLICY_NOTICE = "Enhancement only improves background, crop, brightness and clarity. Product colour, design and handmade details should not be changed.";
  static POLICY_NOTICE_HI = "सुधार केवल बैकग्राउंड, क्रॉप, रोशनी और स्पष्टता को बेहतर बनाता है। उत्पाद का रंग, डिज़ाइन और हाथ की बारीकियां नहीं बदली जाती हैं।";

  /**
   * Permitted operations enum
   */
  static PERMITTED_OPERATIONS = [
    'background_cleanup',
    'crop',
    'brightness_adjustment',
    'contrast_adjustment',
    'compression',
    'blur_detection',
    'glare_detection',
    'orientation_correction',
    'basic_sharpening'
  ];

  /**
   * Analyze image quality on canvas
   * Checks for: blur, too dark, glare/reflection, framing
   * @param {string} dataUrl - Base64 image data url
   * @returns {Promise<Object>} { isQualityGood, warnings: [], metrics: {} }
   */
  static async analyzePhotoQuality(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl || typeof document === 'undefined') {
        return resolve({
          isQualityGood: true,
          warnings: [],
          metrics: { brightness: 128, blurScore: 100, glareRatio: 0 }
        });
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 320; // Fast downscaled analysis for low-spec laptops
          const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          const numPixels = data.length / 4;

          let totalLuminance = 0;
          let glarePixelCount = 0;
          let darkPixelCount = 0;

          // Compute luminance & glare
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Perceived luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;

            if (lum > 245) glarePixelCount++;
            if (lum < 35) darkPixelCount++;
          }

          const avgLuminance = totalLuminance / numPixels;
          const glareRatio = glarePixelCount / numPixels;
          const darkRatio = darkPixelCount / numPixels;

          // Simple edge / blur detection via adjacent pixel Laplacian gradient
          let edgeSum = 0;
          const w = canvas.width;
          const h = canvas.height;
          for (let y = 1; y < h - 1; y += 2) {
            for (let x = 1; x < w - 1; x += 2) {
              const idx = (y * w + x) * 4;
              const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
              const down = 0.299 * data[idx + w * 4] + 0.587 * data[idx + w * 4 + 1] + 0.114 * data[idx + w * 4 + 2];
              edgeSum += Math.abs(center - right) + Math.abs(center - down);
            }
          }
          const blurScore = edgeSum / (numPixels / 4);

          const warnings = [];

          // 1. Blur warning (low edge energy)
          if (blurScore < 4.5) {
            warnings.push({
              code: 'BLURRY_IMAGE',
              title: 'Photo thodi blur hai (Photo is blurry)',
              message: 'Photo thodi blur hai. Product ko stable surface par rakhkar dobara photo lein.',
              icon: '🔍'
            });
          }

          // 2. Too dark warning
          if (avgLuminance < 65 || darkRatio > 0.55) {
            warnings.push({
              code: 'TOO_DARK',
              title: 'Roshni kam hai (Lighting is low)',
              message: 'Light saamne se rakhein, flash reflection se bachein.',
              icon: '💡'
            });
          }

          // 3. Glare warning
          if (glareRatio > 0.15) {
            warnings.push({
              code: 'GLARE_DETECTED',
              title: 'Chamak / Reflection zyada hai',
              message: 'Light saamne se rakhein, seedha flash reflection se bachein.',
              icon: '☀️'
            });
          }

          resolve({
            isQualityGood: warnings.length === 0,
            warnings,
            metrics: {
              avgLuminance: Math.round(avgLuminance),
              glareRatio: Math.round(glareRatio * 100) / 100,
              blurScore: Math.round(blurScore * 10) / 10,
              width: img.width,
              height: img.height
            }
          });
        } catch (e) {
          console.warn('[ImageSafetyService] Quality check error:', e);
          resolve({
            isQualityGood: true,
            warnings: [],
            metrics: {}
          });
        }
      };

      img.onerror = () => {
        resolve({ isQualityGood: true, warnings: [], metrics: {} });
      };

      img.src = dataUrl;
    });
  }

  /**
   * Safely enhance an image without modifying craft motifs, colors, shapes or texture
   * Permitted: Clean background tone, gentle brightness normalization, slight clarity
   * @param {string} originalDataUrl 
   * @param {Object} options - { mode: 'studio_light' | 'clean_backdrop' }
   * @returns {Promise<string>} enhancedDataUrl
   */
  static async safelyEnhance(originalDataUrl, options = { mode: 'studio_light' }) {
    return new Promise((resolve) => {
      if (!originalDataUrl || typeof document === 'undefined') {
        return resolve(originalDataUrl);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (options.mode === 'clean_backdrop') {
            // Draw pure neutral studio background then render image with gentle shadow
            ctx.fillStyle = '#FAF9F6'; // Warm soft heritage ivory
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Apply non-destructive CSS-style filters on context
          if (options.mode === 'studio_light') {
            ctx.filter = 'brightness(1.06) contrast(1.04) saturate(1.02)';
          } else if (options.mode === 'clean_backdrop') {
            ctx.filter = 'brightness(1.04) contrast(1.03)';
          }

          ctx.drawImage(img, 0, 0);
          ctx.filter = 'none';

          const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(enhancedDataUrl);
        } catch (e) {
          console.warn('[ImageSafetyService] Enhancement fallback:', e);
          resolve(originalDataUrl);
        }
      };

      img.onerror = () => resolve(originalDataUrl);
      img.src = originalDataUrl;
    });
  }
}
