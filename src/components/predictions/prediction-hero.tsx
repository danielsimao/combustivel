'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ChevronRight, AlertTriangle } from 'lucide-react';
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
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
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

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      {heroPredictions.map((pred) => {
        const direction =
          pred.trend === 'sobe' ? 'up' : pred.trend === 'desce' ? 'down' : 'stable';
        const borderColor =
          direction === 'down'
            ? 'border-t-green-500'
            : direction === 'up'
            ? 'border-t-red-500'
            : 'border-t-zinc-300';
        const changeColor =
          direction === 'down'
            ? 'text-green-600'
            : direction === 'up'
            ? 'text-red-600'
            : 'text-zinc-500';
        const price = avgPrices[pred.fuelType];

        return (
          <Link key={pred.fuelType} href="/previsao">
            <Card
              className={`border-t-2 ${borderColor} transition-all hover:shadow-md cursor-pointer`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {pred.fuelLabel}
                  </p>
                  <Badge
                    variant={
                      direction === 'down'
                        ? 'success'
                        : direction === 'up'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {direction === 'down' && <TrendingDown className="mr-1 h-3 w-3" />}
                    {direction === 'up' && <TrendingUp className="mr-1 h-3 w-3" />}
                    {direction === 'stable' && <Minus className="mr-1 h-3 w-3" />}
                    {direction === 'down' ? 'Desce' : direction === 'up' ? 'Sobe' : 'Estável'}
                  </Badge>
                </div>

                <div className="mt-3 flex items-baseline gap-3">
                  {price ? (
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {price.toFixed(3).replace('.', ',')} €
                    </span>
                  ) : null}
                  <span className={`text-sm font-bold ${changeColor}`}>
                    {pred.variationEuro > 0 ? '+' : ''}
                    {pred.variationEuro.toFixed(3).replace('.', ',')} €/L
                  </span>
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  {getShortRecommendation(pred.trend)}
                </p>

                <div className="mt-2 flex items-center text-[10px] text-blue-600">
                  Ver detalhes <ChevronRight className="ml-0.5 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
