import { NextResponse } from 'next/server';
import { scrapePredictions } from '@/lib/scrape-predictions';
import { getLatestPredictions } from '@/lib/supabase';

export const revalidate = 3600;

export async function GET() {
  // Try live scrape first
  try {
    const data = await scrapePredictions();
    if (data.predictions.length > 0) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }
  } catch {
    // Scrape failed — fall through to Supabase
  }

  // Fall back to Supabase stored predictions
  try {
    const stored = await getLatestPredictions();
    if (stored.length > 0) {
      const predictions = stored.map((p: Record<string, unknown>) => ({
        fuelType: p.fuel_type,
        fuelLabel: p.fuel_type === 'Gasóleo simples' ? 'Gasóleo Simples'
          : p.fuel_type === 'Gasolina simples 95' ? 'Gasolina 95'
          : String(p.fuel_type),
        week: `${p.week_start} a ${p.week_end}`,
        trend: p.direction === 'up' ? 'sobe' : p.direction === 'down' ? 'desce' : 'neutro',
        variation: Math.round(Number(p.predicted_change) * 100),
        variationEuro: Number(p.predicted_change),
        text: String(p.recommendation || ''),
        source: String(p.source || 'precocombustiveis.pt'),
      }));

      return NextResponse.json({
        predictions,
        scrapedAt: String((stored[0] as Record<string, unknown>).created_at || new Date().toISOString()),
        source: 'supabase (cached)',
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }
  } catch (dbError) {
    console.error('Supabase fallback failed:', dbError);
  }

  return NextResponse.json({
    predictions: [],
    scrapedAt: new Date().toISOString(),
    source: 'https://precocombustiveis.pt/proxima-semana/',
    error: 'Previsão temporariamente indisponível',
  });
}
