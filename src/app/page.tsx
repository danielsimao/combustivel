import { ForecastPage } from '@/components/predictions/forecast-page';
import { scrapePredictions } from '@/lib/scrape-predictions';
import { getLatestPredictions, getDailyAverages } from '@/lib/supabase';
import { getPrecoMedioDiario } from '@/lib/dgeg';

export const revalidate = 3600; // ISR: revalidate every hour

const CHART_FUELS = ['Gasóleo simples', 'Gasolina simples 95'];

async function fetchPredictionData() {
  // Try live scrape first, fall back to Supabase
  try {
    const data = await scrapePredictions();
    if (data.predictions.length > 0) {
      return data;
    }
  } catch {
    // Scrape failed — fall through
  }

  // Supabase fallback
  try {
    const stored = await getLatestPredictions();
    if (stored.length > 0) {
      return {
        predictions: stored.map((p: Record<string, unknown>) => ({
          fuelType: p.fuel_type as string,
          fuelLabel: p.fuel_type === 'Gasóleo simples' ? 'Gasóleo Simples'
            : p.fuel_type === 'Gasolina simples 95' ? 'Gasolina 95'
            : String(p.fuel_type),
          week: `${p.week_start} a ${p.week_end}`,
          trend: (p.direction === 'up' ? 'sobe' : p.direction === 'down' ? 'desce' : 'neutro') as 'sobe' | 'desce' | 'neutro',
          variation: Math.round(Number(p.predicted_change) * 100),
          variationEuro: Number(p.predicted_change),
          text: String(p.recommendation || ''),
          source: String(p.source || 'precocombustiveis.pt'),
        })),
        scrapedAt: String((stored[0] as Record<string, unknown>).created_at || new Date().toISOString()),
        source: 'supabase',
      };
    }
  } catch {
    // Supabase failed too
  }

  return { predictions: [], scrapedAt: '', source: '', error: 'Previsão temporariamente indisponível' };
}

async function fetchAvgPrices(): Promise<Record<string, number>> {
  try {
    const data = await getPrecoMedioDiario();
    const prices: Record<string, number> = {};
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.TipoCombustivel && item.PrecoMedio) {
          prices[item.TipoCombustivel] = parseFloat(
            String(item.PrecoMedio).replace(',', '.')
          );
        }
      }
    }
    return prices;
  } catch {
    return {};
  }
}

async function fetchChartData() {
  try {
    const results = await Promise.all(
      CHART_FUELS.map((fuel) => getDailyAverages(fuel, 30))
    );
    const raw = results.flat().filter(Boolean) as { date: string; fuel_type: string; avg_price: number }[];

    const dateMap = new Map<string, { date: string; [key: string]: string | number | undefined }>();
    for (const item of raw) {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }
      dateMap.get(item.date)![item.fuel_type] = item.avg_price;
    }
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [predData, avgPrices, chartData] = await Promise.all([
    fetchPredictionData(),
    fetchAvgPrices(),
    fetchChartData(),
  ]);

  const predictions = predData.predictions.map((sp) => {
    const priceNum = avgPrices[sp.fuelType] ?? 0;
    return {
      fuelType: sp.fuelType,
      fuelLabel: sp.fuelLabel,
      currentPrice: priceNum > 0
        ? `${priceNum.toFixed(3).replace('.', ',')} €/L`
        : '—',
      currentPriceNum: priceNum,
      predictedChange: sp.variationEuro,
      direction: (sp.trend === 'sobe' ? 'up' : sp.trend === 'desce' ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      weekRange: sp.week || 'Próxima semana',
      recommendation: sp.text,
      source: 'precocombustiveis.pt',
    };
  });

  return (
    <ForecastPage
      predictions={predictions}
      chartData={chartData}
      avgPrices={avgPrices}
      scrapedAt={predData.scrapedAt || null}
      scrapeError={predData.error || ''}
    />
  );
}
