'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Fuel,
  ArrowRight,
} from 'lucide-react';

interface PredictionData {
  fuelType: string;
  fuelLabel: string;
  currentPrice: string;
  currentPriceNum: number;
  predictedChange: number;
  direction: 'up' | 'down' | 'stable';
  weekRange: string;
  recommendation: string;
  source: string;
}

interface PriceForecastProps {
  predictions: PredictionData[];
  lastUpdated: string;
}

const TANK_SIZES = [40, 50, 60];

function formatEuro(value: number): string {
  const abs = Math.abs(value);
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${abs.toFixed(2).replace('.', ',')} €`;
}

export function PriceForecast({ predictions, lastUpdated }: PriceForecastProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Prediction Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {predictions.map((pred) => {
          const isUp = pred.direction === 'up';
          const isDown = pred.direction === 'down';

          const borderColor = isDown
            ? 'border-l-emerald-500'
            : isUp
            ? 'border-l-red-500'
            : 'border-l-zinc-300';
          const bgColor = isDown
            ? 'bg-emerald-50/50 dark:bg-emerald-950/10'
            : isUp
            ? 'bg-red-50/50 dark:bg-red-950/10'
            : 'bg-zinc-50/50 dark:bg-zinc-900/20';
          const changeColor = isDown
            ? 'text-emerald-600 dark:text-emerald-400'
            : isUp
            ? 'text-red-600 dark:text-red-400'
            : 'text-zinc-500';
          const DirectionIcon = isDown
            ? TrendingDown
            : isUp
            ? TrendingUp
            : Minus;
          const directionWord = isDown ? t('forecast.drops') : isUp ? t('forecast.rises') : t('forecast.stable');

          const estimatedPrice = pred.currentPriceNum > 0
            ? (pred.currentPriceNum + pred.predictedChange).toFixed(3).replace('.', ',')
            : null;

          return (
            <Card
              key={pred.fuelType}
              className={`overflow-hidden border-l-[6px] ${borderColor} ${bgColor}`}
            >
              <CardContent className="p-5">
                {/* Header: fuel name + direction */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DirectionIcon className={`h-5 w-5 ${changeColor}`} />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {pred.fuelLabel}
                      </p>
                      <p className={`text-xs font-semibold ${changeColor}`}>
                        {directionWord}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isDown ? 'success' : isUp ? 'danger' : 'default'}
                    className="text-[10px]"
                  >
                    {pred.weekRange}
                  </Badge>
                </div>

                {/* Hero: € variation */}
                <div className="mt-4">
                  <p className={`text-3xl font-black tracking-tight ${changeColor}`}>
                    {pred.predictedChange > 0 ? '+' : ''}
                    {pred.predictedChange.toFixed(3).replace('.', ',')}
                    <span className="ml-1 text-lg font-bold">€/L</span>
                  </p>
                </div>

                {/* Current → Estimated */}
                {estimatedPrice && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">{pred.currentPrice}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                    <span className={`font-bold ${changeColor}`}>
                      {estimatedPrice} €/L
                    </span>
                  </div>
                )}

                {/* Recommendation */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/60 p-3 dark:bg-zinc-900/40">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    {pred.recommendation}
                  </p>
                </div>

                {/* Tank Impact */}
                <div className="mt-4 border-t border-zinc-200/60 pt-3 dark:border-zinc-700/30">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    <Fuel className="h-3 w-3" />
                    {t('forecast.tankImpact')}
                  </div>
                  <div className="mt-2 flex gap-3">
                    {TANK_SIZES.map((size) => {
                      const impact = pred.predictedChange * size;
                      return (
                        <div key={size} className="text-center">
                          <p className="text-[10px] text-zinc-400">{size}L</p>
                          <p className={`text-sm font-bold ${changeColor}`}>
                            {formatEuro(impact)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Source */}
                <p className="mt-3 text-[10px] text-zinc-400">
                  {t('forecast.source', { source: pred.source })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
