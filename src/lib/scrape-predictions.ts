import * as cheerio from 'cheerio';

const PREDICTION_URL = 'https://precocombustiveis.pt/proxima-semana/';

export interface FuelPrediction {
  fuelType: string;
  fuelLabel: string;
  week: string;
  trend: 'sobe' | 'desce' | 'neutro';
  variation: number; // cents per liter
  variationEuro: number; // euros per liter
  text: string;
  source: string;
}

export interface ScrapedPredictions {
  predictions: FuelPrediction[];
  scrapedAt: string;
  source: string;
  error?: string;
}

function detectTrend(text: string): 'sobe' | 'desce' | 'neutro' {
  const lower = text.toLowerCase();
  // Count occurrences of up vs down keywords to handle mixed text
  const upWords = ['sobe', 'subir', 'subida', 'aument'];
  const downWords = ['desce', 'descer', 'descida', 'baixa', 'redução', 'reduz'];
  const upCount = upWords.reduce((n, w) => n + (lower.split(w).length - 1), 0);
  const downCount = downWords.reduce((n, w) => n + (lower.split(w).length - 1), 0);
  if (upCount > downCount) return 'sobe';
  if (downCount > upCount) return 'desce';
  if (upCount > 0) return 'sobe';
  return 'neutro';
}

function safeParseFloat(str: string): number {
  const value = parseFloat(str.replace(',', '.').replace(/\s/g, ''));
  return isNaN(value) ? 0 : value;
}

function extractVariation(text: string): number {
  // Match patterns like "+0,015 €/l", "-0,01 €/l", "0,015€/l"
  const euroMatch = text.match(/([+-]?\s?\d+[.,]\d+)\s?€\/?[lL]/);
  if (euroMatch) {
    const value = safeParseFloat(euroMatch[1]);
    // value is in euros per liter, convert to cents (e.g. 0.015 -> 1.5 cents)
    return Math.round(value * 100 * 10) / 10;
  }

  // Match "X cêntimos" or "X,Y cêntimos"
  const centMatch = text.match(/([+-]?\s?\d+[.,]?\d*)\s?c[eê]ntimos?/i);
  if (centMatch) {
    return safeParseFloat(centMatch[1]);
  }

  // Match standalone decimal that looks like a price change (e.g. "0,015€")
  const decimalMatch = text.match(/(?:cerca de |aproximadamente )?([+-]?\d+[.,]\d+)\s?€/);
  if (decimalMatch) {
    const value = safeParseFloat(decimalMatch[1]);
    if (Math.abs(value) < 1) {
      return Math.round(value * 100 * 10) / 10;
    }
  }

  return 0;
}

export async function scrapePredictions(): Promise<ScrapedPredictions> {
  try {
    const res = await fetch(PREDICTION_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const predictions: FuelPrediction[] = [];

    // Extract the week range from h1 or prominent heading
    let week = '';
    $('h1, h2').each((_, el) => {
      const text = $(el).text();
      const weekMatch = text.match(/\d+\s+(?:a|de)\s+\d+\s+de\s+\w+/i);
      if (weekMatch && !week) {
        week = weekMatch[0];
      }
      // Also try "30 de março a 5 de abril" pattern
      const weekMatch2 = text.match(/\d+\s+de\s+\w+\s+a\s+\d+\s+de\s+\w+/i);
      if (weekMatch2 && !week) {
        week = weekMatch2[0];
      }
    });

    // Strategy 1: Look for h3 headings about each fuel type (like the HA integration)
    const fuelPatterns = [
      { pattern: /gas[oó]leo\s*(simples)?/i, type: 'Gasóleo simples', label: 'Gasóleo Simples' },
      { pattern: /gasolina\s*(simples\s*)?95/i, type: 'Gasolina simples 95', label: 'Gasolina 95' },
      { pattern: /gasolina\s*(especial\s*)?98/i, type: 'Gasolina especial 98', label: 'Gasolina 98' },
      { pattern: /gpl/i, type: 'GPL Auto', label: 'GPL Auto' },
    ];

    $('h2, h3, h4').each((_, el) => {
      const title = $(el).text().trim();
      for (const fp of fuelPatterns) {
        if (fp.pattern.test(title)) {
          // Get the next paragraph(s) after this heading
          let text = '';
          let sibling = $(el).next();
          for (let i = 0; i < 5 && sibling.length; i++) {
            if (sibling.is('p, div, span, li')) {
              text += ' ' + sibling.text().trim();
            }
            if (sibling.is('h1, h2, h3, h4, h5')) break;
            sibling = sibling.next();
          }

          if (text.trim()) {
            const trend = detectTrend(title + ' ' + text);
            const variation = extractVariation(text);
            const adjustedVariation = trend === 'desce' && variation > 0 ? -variation : variation;

            predictions.push({
              fuelType: fp.type,
              fuelLabel: fp.label,
              week: week || 'Próxima semana',
              trend,
              variation: adjustedVariation,
              variationEuro: adjustedVariation / 100,
              text: text.trim().replace(/\s+/g, ' ').substring(0, 500),
              source: PREDICTION_URL,
            });
          }
        }
      }
    });

    // Strategy 2: If h3-based scraping didn't work, try scanning all paragraphs
    if (predictions.length === 0) {
      const allText = $('article, .content, .entry-content, main, .post-content, body')
        .first()
        .text()
        .replace(/\s+/g, ' ');

      for (const fp of fuelPatterns) {
        // Use bounded quantifier to prevent ReDoS
        const sectionMatch = allText.match(
          new RegExp(`(${fp.pattern.source}[^.]{0,300}(?:sobe|desce|subir|descer|mant|estável)[^.]{0,200}\\.)`, 'i')
        );

        if (sectionMatch) {
          const text = sectionMatch[1];
          const trend = detectTrend(text);
          const variation = extractVariation(text);
          const adjustedVariation = trend === 'desce' && variation > 0 ? -variation : variation;

          predictions.push({
            fuelType: fp.type,
            fuelLabel: fp.label,
            week: week || 'Próxima semana',
            trend,
            variation: adjustedVariation,
            variationEuro: adjustedVariation / 100,
            text: text.trim().substring(0, 500),
            source: PREDICTION_URL,
          });
        }
      }
    }

    // Strategy 3: Broad scan for any variation mentions
    if (predictions.length === 0) {
      const bodyText = $('body').text().replace(/\s+/g, ' ');

      for (const fp of fuelPatterns) {
        // Look for fuel name near a price variation
        const regex = new RegExp(
          `${fp.pattern.source}[^.]{0,200}?([+-]?\\d+[,.]\\d+)\\s?(?:€\/?[lL]|cêntimos?)`,
          'i'
        );
        const match = bodyText.match(regex);
        if (match) {
          const fullMatch = match[0];
          const trend = detectTrend(fullMatch);
          const variation = extractVariation(fullMatch);
          const adjustedVariation = trend === 'desce' && variation > 0 ? -variation : variation;

          predictions.push({
            fuelType: fp.type,
            fuelLabel: fp.label,
            week: week || 'Próxima semana',
            trend,
            variation: adjustedVariation,
            variationEuro: adjustedVariation / 100,
            text: fullMatch.trim().substring(0, 500),
            source: PREDICTION_URL,
          });
        }
      }
    }

    return {
      predictions,
      scrapedAt: new Date().toISOString(),
      source: PREDICTION_URL,
    };
  } catch (error) {
    console.error('Error scraping predictions:', error);
    return {
      predictions: [],
      scrapedAt: new Date().toISOString(),
      source: PREDICTION_URL,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
