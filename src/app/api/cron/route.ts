import { NextRequest, NextResponse } from 'next/server';
import { getPrecoMedioDiario } from '@/lib/dgeg';
import { saveDailyAverage, savePrediction } from '@/lib/supabase';
import { scrapePredictions } from '@/lib/scrape-predictions';
import { timingSafeEqual } from 'crypto';

function isAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(authHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getPrecoMedioDiario();
    const today = new Date().toISOString().split('T')[0];
    let saved = 0;

    if (data && Array.isArray(data)) {
      for (const item of data) {
        if (item.TipoCombustivel && item.PrecoMedio) {
          const price = parseFloat(String(item.PrecoMedio).replace(',', '.'));
          if (!isNaN(price) && price > 0) {
            await saveDailyAverage(today, item.TipoCombustivel, price);
            saved++;
          }
        }
      }
    }

    // Also scrape and save predictions
    let predictionsSaved = 0;
    try {
      const predData = await scrapePredictions();
      const weekStart = today;
      const weekEnd = new Date(new Date(today).getTime() + 6 * 86400000)
        .toISOString()
        .split('T')[0];

      for (const pred of predData.predictions) {
        await savePrediction({
          week_start: weekStart,
          week_end: weekEnd,
          fuel_type: pred.fuelType,
          predicted_change: pred.variationEuro,
          predicted_price: 0,
          current_price: 0,
          direction: pred.trend === 'sobe' ? 'up' : pred.trend === 'desce' ? 'down' : 'stable',
          confidence: 'média',
          source: pred.source,
          recommendation: pred.text,
        });
        predictionsSaved++;
      }
    } catch (predError) {
      console.error('Prediction scrape failed (non-fatal):', predError);
    }

    return NextResponse.json({
      success: true,
      date: today,
      records: saved,
      predictions: predictionsSaved,
    });
  } catch (error) {
    console.error('Cron job failed');
    return NextResponse.json(
      { error: 'Erro no cron job' },
      { status: 500 }
    );
  }
}
