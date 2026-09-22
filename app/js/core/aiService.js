/**
 * KalaSetu AI — Unified Multi-Model AI Service
 * Bridges KalaSetu with:
 * 1. Groq (LPU Brain for sub-second catalog parsing & negotiation reasoning)
 * 2. Google Gemini (Multimodal Document OCR & Craft Vision)
 * 3. Gnani.ai (Indian Regional Speech Engine)
 * 
 * Features automatic zero-crash fallback to offline heuristics if keys are not provided.
 */

import { getAIConfig } from './aiConfig.js';
import { appState } from './appState.js';

class AIService {
  /**
   * 1. BRAIN ENGINE (Groq / Llama 3.3 70B)
   * Converts unstructured artisan voice note into structured product catalog draft
   * @param {string} speechText - Spoken transcription
   * @param {string} langCode - Language code ('hi', 'en', 'bn', etc.)
   */
  async parseSpeechToCatalog(speechText, langCode = 'hi') {
    const config = getAIConfig().groq;

    // Check if Groq is configured
    if (config.apiKey && config.apiKey.trim() !== '') {
      try {
        console.log('[AIService] Calling Groq Cloud LPU Brain with model:', config.model);
        
        const systemPrompt = `You are the AI Catalog Brain of KalaSetu AI, an Indian rural artisan assistant.
The artisan is speaking in an Indian regional language or Hinglish about a handcrafted product.
Extract the details and return ONLY a valid JSON object matching this schema:
{
  "craftName": "Short descriptive title of product (in artisan language/Hindi)",
  "craftNameEn": "Short descriptive title in English",
  "category": "One of: Textiles & Handloom, Pottery & Terracotta, Metalcraft & Dhokra, Woodcraft & Carving, Jewelry & Beading, Leather & Mojari, Folk Painting & Madhubani",
  "materials": "Comma-separated raw materials mentioned",
  "dimensions": "Dimensions or size mentioned (or 'Standard Artisan Dimensions')",
  "timeSpentHours": number (estimate hours or days spent, e.g. 16),
  "estimatedCost": number (material cost in INR),
  "suggestedPrice": number (fair retail selling price in INR),
  "giCluster": "Probable Indian heritage cluster (e.g. Bagru Block Print, Blue Pottery Jaipur, Dhokra Bastar, Pochampally Ikat)",
  "descriptionRegional": "Warm, emotional 2-sentence story highlighting handmade heritage in ${langCode}",
  "descriptionEn": "2-sentence luxury heritage story in English for global buyers",
  "tags": ["tag1", "tag2", "tag3"]
}`;

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: config.model || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Artisan Voice Note: "${speechText}"` }
            ],
            temperature: config.temperature || 0.2,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const parsed = JSON.parse(result.choices[0].message.content);
          parsed._source = 'groq';
          return parsed;
        } else {
          console.warn('[AIService] Groq API returned error:', response.status, await response.text());
        }
      } catch (err) {
        console.warn('[AIService] Groq call failed, falling back to local extractor:', err);
      }
    }

    // Local Fallback Rule-Based Parser (Works 100% offline with zero keys)
    return this.fallbackParseSpeech(speechText, langCode);
  }

  /**
   * 2. DOCUMENT & RECEIPT OCR ENGINE (Google Gemini Multimodal Vision)
   * Scans handwritten paper bills, receipt slips, invoices, or challans
   * @param {string} imageBase64 - Base64 encoded image string (with or without data prefix)
   * @param {string} mimeType - e.g. 'image/jpeg', 'image/png', 'image/webp'
   */
  async extractBillDocument(imageBase64, mimeType = 'image/jpeg') {
    const config = getAIConfig().gemini;

    // Clean base64 string
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    if (config.apiKey && config.apiKey.trim() !== '') {
      try {
        console.log('[AIService] Calling Google Gemini Vision Document Reader with model:', config.model);
        const url = `${config.endpoint}/${config.model || 'gemini-2.0-flash'}:generateContent?key=${config.apiKey.trim()}`;

        const prompt = `You are the Document Intelligence OCR engine for KalaSetu AI (Rural Artisan Business Manager).
Analyze this uploaded document/photo which may be a handwritten paper slip, shop receipt, challan, invoice, or raw material bill.
Extract all details and return ONLY a valid JSON object with:
{
  "isBillOrSlip": true,
  "transactionType": "expense" or "income",
  "vendorOrCustomer": "Vendor, supplier, or buyer name if legible, else 'Local Mandi / Market'",
  "date": "YYYY-MM-DD or date detected",
  "items": ["list of items, raw materials, or products mentioned"],
  "totalAmount": number (total amount in Indian Rupees INR),
  "category": "One of: Raw Materials, Dyes & Colors, Clay & Soil, Tools & Equipment, Artisan Labor, Transport, Packaging, Sales & Customer Order",
  "summary": "Brief 1-sentence summary in English and Hindi of this transaction"
}`;

        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            parsed._source = 'gemini';
            return parsed;
          }
        } else {
          console.warn('[AIService] Gemini API returned error:', response.status, await response.text());
        }
      } catch (err) {
        console.warn('[AIService] Gemini call failed, falling back:', err);
      }
    }

    // Fallback simulation for demonstration
    return {
      _source: 'fallback',
      isBillOrSlip: true,
      transactionType: 'expense',
      vendorOrCustomer: 'रामलाल रंग भंडार (Local Mandi)',
      date: new Date().toISOString().split('T')[0],
      items: ['प्राकृतिक नील रंग (Indigo Dye)', 'कपास धागा (Cotton Yarn)'],
      totalAmount: 1450,
      category: 'Raw Materials',
      summary: 'प्राकृतिक नील और सूती धागे की पर्ची (Raw materials bill scanned)'
    };
  }

  /**
   * 3. CRAFT PHOTO QUALITY & MOTIF INSPECTION (Google Gemini Vision)
   * Analyzes photo of handmade craft to identify authentic artisan motifs
   */
  async analyzeCraftPhoto(imageBase64, mimeType = 'image/jpeg') {
    const config = getAIConfig().gemini;
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    if (config.apiKey && config.apiKey.trim() !== '') {
      try {
        const url = `${config.endpoint}/${config.model || 'gemini-2.0-flash'}:generateContent?key=${config.apiKey.trim()}`;
        const prompt = `Analyze this handcrafted Indian artisan product. Return JSON:
{
  "craftName": "Identified traditional craft title",
  "craftType": "Textile, Pottery, Metalwork, Woodwork, etc.",
  "heritageCluster": "Probable Indian craft cluster (e.g. Bagru, Bastar, Jaipur, Madhubani)",
  "recognizedMotifs": ["Motifs visible, e.g. Bel-Buta, Paisley, Floral, Geometric"],
  "materialsDetected": ["e.g. Indigo dye, Cotton, Brass, Terracotta clay"],
  "craftsmanshipQuality": "High / Master Artisan grade / Heritage GI standard",
  "storyHook": "Compelling 2-sentence provenance story highlighting authentic handmade lineage"
}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: cleanBase64 } }
                ]
              }
            ],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const data = JSON.parse(text);
            data._source = 'gemini';
            return data;
          }
        }
      } catch (err) {
        console.warn('[AIService] Craft photo inspection failed:', err);
      }
    }

    return null;
  }

  /**
   * 4. SMART NEGOTIATION ADVISOR (Groq Brain)
   * Formulates gentle, assertive counter-negotiation arguments for fair artisan wages
   */
  async getNegotiationAdvice({ craftName, costPrice, fairPrice, buyerOffer, language = 'hi' }) {
    const config = getAIConfig().groq;

    if (config.apiKey && config.apiKey.trim() !== '') {
      try {
        const prompt = `The artisan made "${craftName}". Cost of materials: ₹${costPrice}. Fair selling price: ₹${fairPrice}. 
A buyer or middleman is offering ₹${buyerOffer}.
Give advice to the rural artisan in language "${language}".
Return JSON:
{
  "acceptDeal": boolean (true only if buyerOffer >= fairPrice * 0.95),
  "advice": "Empowering 1-2 sentence advice explaining why they should or should not sell",
  "counterOfferPrice": number (recommended counter price in INR),
  "politeReply": "Exact words the artisan can say to the buyer to defend handmade value without being rude"
}`;

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: config.model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const result = await response.json();
          return JSON.parse(result.choices[0].message.content);
        }
      } catch (e) {
        console.warn('[AIService] Negotiation advisor failed:', e);
      }
    }

    // Default heuristic advice
    const accept = buyerOffer >= fairPrice * 0.92;
    return {
      acceptDeal: accept,
      advice: accept 
        ? 'यह उचित मूल्य है, आप इस सौदे को स्वीकार कर सकते हैं।' 
        : 'खरीदार का दाम आपकी मेहनत और सामग्री की लागत से कम है। कृपया दाम न घटाएं।',
      counterOfferPrice: Math.round(fairPrice * 0.96),
      politeReply: `यह हाथ की प्रामाणिक कारीगरी है, कम से कम ₹${Math.round(fairPrice * 0.96)} में ही दे पाएंगे जी।`
    };
  }

  /**
   * 5. SPEECH ENGINE (Gnani.ai Vachana STT)
   */
  async gnaniSTT(audioBlob, langCode = 'hi-IN') {
    const config = getAIConfig().gnani;
    if (!config.apiKey && !config.token) {
      throw new Error('Gnani.ai credentials not configured');
    }

    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.wav');
    formData.append('language_code', langCode);

    const headers = {
      'X-API-Key-ID': config.apiKey.trim()
    };

    const response = await fetch(config.sttEndpoint || 'https://api.vachana.ai/stt/v3', {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) throw new Error(`Gnani STT returned HTTP ${response.status}`);
    const data = await response.json();
    return data.transcript || data.text || data.data?.transcript || '';
  }

  /**
   * Offline Heuristic Parser (Fallback when Groq key is not yet pasted)
   */
  fallbackParseSpeech(speechText, langCode) {
    const lower = speechText.toLowerCase();
    const isHindi = langCode === 'hi';

    let craftName = isHindi ? 'हस्तनिर्मित पारंपरिक शिल्प' : 'Handcrafted Heritage Art';
    let craftCategory = 'Textiles & Handloom';
    let materials = isHindi ? 'प्राकृतिक सामग्री, रंग' : 'Natural Fibers, Eco Dye';
    let dimensions = 'Standard';
    let giCluster = 'Heritage Artisan Cluster';

    if (lower.includes('दुपट्टा') || lower.includes('dupatta') || lower.includes('chanderi') || lower.includes('block') || lower.includes('cotton') || lower.includes('bagru')) {
      craftName = isHindi ? 'बगरू हैंड-ब्लॉक प्रिंट दुपट्टा' : 'Bagru Hand-Block Print Dupatta';
      craftCategory = 'Textiles & Handloom';
      materials = isHindi ? '100% शुद्ध कॉटन, प्राकृतिक नील रंग' : '100% Pure Cotton, Natural Indigo';
      dimensions = '2.5m x 1m';
      giCluster = 'Bagru Hand-Block Print (GI Registered)';
    } else if (lower.includes('घड़ा') || lower.includes('pot') || lower.includes('mitti') || lower.includes('clay') || lower.includes('terracotta') || lower.includes('बर्तन')) {
      craftName = isHindi ? 'टेराकोटा नक्काशीदार घड़ा' : 'Hand-carved Terracotta Clay Pot';
      craftCategory = 'Pottery & Terracotta';
      materials = isHindi ? 'नदी की काली व लाल मिट्टी' : 'Riverbed Red & Black Clay';
      dimensions = '30cm x 22cm';
      giCluster = 'Gorakhpur Terracotta (GI Registered)';
    } else if (lower.includes('brass') || lower.includes('dhokra') || lower.includes('पीतल') || lower.includes('धातु')) {
      craftName = isHindi ? 'ढोकरा बेल-मेटल नंदी मूर्ति' : 'Dhokra Bell-Metal Nandi Figurine';
      craftCategory = 'Metalcraft & Dhokra';
      materials = isHindi ? 'पीतल, मोम, प्राकृतिक मिट्टी' : 'Lost-wax Brass, Beeswax, Clay Core';
      dimensions = '15cm x 18cm';
      giCluster = 'Bastar Dhokra Bell Metal (GI Registered)';
    }

    return {
      _source: 'local_heuristic',
      craftName,
      craftNameEn: 'Authentic Handcrafted Artisan Heritage Item',
      category: craftCategory,
      materials,
      dimensions,
      timeSpentHours: 16,
      estimatedCost: 350,
      suggestedPrice: 850,
      giCluster,
      descriptionRegional: `यह प्रामाणिक ${craftName} पीढ़ियों पुरानी पारंपरिक विधा से बनाया गया है।`,
      descriptionEn: `Authentic ${craftName}, handmade with time-honored artisanal heritage techniques.`,
      tags: ['Handmade', 'GI-Heritage', 'Eco-Friendly']
    };
  }
}

export const aiService = new AIService();
