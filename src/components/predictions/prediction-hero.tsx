'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { FuelPrediction } from '@/lib/scrape-predictions';

interface PredictionData {
  predictions: FuelPrediction[];
  scrapedAt: string;
  source: string;
  error?: string;
}

async function fetchPredictions(): Promise<PredictionData> {
  const r = await fetch('/api/previsao');
  return r.json();
}

async function fetchAvgPrices(): Promise<Record<string, number>> {
  const r = await fetch('/api/dgeg/preco-medio');
  const data = await r.json();
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
}

function getShortRecommendation(trend: string): string {
  if (trend === 'sobe') return 'Abasteça antes de segunda-feira!';
  if (trend === 'desce') return 'Pode esperar — preço vai descer.';
  return 'Preço estável — abasteça quando quiser.';
}

const HERO_FUELS = ['Gasóleo simples', 'Gasolina simples 95'];

export function PredictionHero() {
  const { data: predData, isLoading: predLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: fetchPredictions,
  });

  const { data: avgPrices = {}, isLoading: pricesLoading } = useQuery({
    queryKey: ['avgPrices'],
    queryFn: fetchAvgPrices,
  });

  const loading = predLoading || pricesLoading;

  if (loading) {
    return (
      <div className="mb-6">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    );
  }

  const predictions = predData?.predictions ?? [];
  const heroPredictions = HERO_FUELS.map((fuelType) =>
    predictions.find((p) => p.fuelType === fuelType)
  ).filter(Boolean) as FuelPrediction[];

  if (heroPredictions.length === 0) {
    return (
      <Link href="/previsao">
        <Card className="mb-6 border-amber-200 bg-amber-50 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/40">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Previsão temporariamente indisponível
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Consulte as fontes de previsão →
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-400" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  const weekRange = heroPredictions[0]?.week || 'Próxima semana';

  return (
    <div className="mb-6">
      {/* Section header */}
      <Link
        href="/previsao"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        Previsão Semanal — {weekRange}
        <ChevronRight className="h-3 w-3" />
      </Link>

      {/* Hero cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {heroPredictions.map((pred) => {
          const isUp = pred.trend === 'sobe';
          const isDown = pred.trend === 'desce';

          const bg = isDown
            ? 'bg-emerald-600 dark:bg-emerald-700'
            : isUp
            ? 'bg-red-600 dark:bg-red-700'
            : 'bg-zinc-600 dark:bg-zinc-700';

          const hoverBg = isDown
            ? 'hover:bg-emerald-650 hover:shadow-emerald-900/20'
            : isUp
            ? 'hover:bg-red-650 hover:shadow-red-900/20'
            : 'hover:bg-zinc-650 hover:shadow-zinc-900/20';

          const DirectionIcon = isDown
            ? TrendingDown
            : isUp
            ? TrendingUp
            : Minus;

          const directionWord = isDown ? 'Desce' : isUp ? 'Sobe' : 'Estável';
          const price = avgPrices[pred.fuelType];

          return (
            <Link key={pred.fuelType} href="/previsao">
              <div
                className={`relative overflow-hidden rounded-xl ${bg} ${hoverBg} p-5 text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}
              >
                {/* Watermark icon */}
                <DirectionIcon className="absolute right-4 top-4 h-16 w-16 text-white/10" />

                {/* Fuel label */}
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                  {pred.fuelLabel}
                </p>

                {/* Direction word */}
                <p className="mt-1 text-lg font-black">{directionWord}</p>

                {/* Hero variation number */}
                <p className="mt-2 text-3xl font-black tracking-tight">
                  {pred.variationEuro > 0 ? '+' : ''}
                  {pred.variationEuro.toFixed(3).replace('.', ',')}
                  <span className="ml-1 text-base font-bold text-white/70">€/L</span>
                </p>

                {/* Current price */}
                {price ? (
                  <p className="mt-2 text-xs text-white/60">
                    Preço atual: {price.toFixed(3).replace('.', ',')} €/L
                  </p>
                ) : null}

                {/* Recommendation */}
                <p className="mt-3 text-xs font-medium text-white/80">
                  {getShortRecommendation(pred.trend)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
