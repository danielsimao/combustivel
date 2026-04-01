'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PriceForecast } from '@/components/predictions/price-forecast';
import { PriceChart } from '@/components/predictions/price-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Fuel,
  ChevronDown,
} from 'lucide-react';
import { FuelPrediction } from '@/lib/scrape-predictions';
import { getDailyAverages } from '@/lib/supabase';
import { getFuelColor } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface PredictionData {
  predictions: FuelPrediction[];
  scrapedAt: string;
  source: string;
  error?: string;
}

interface DailyAvg {
  date: string;
  fuel_type: string;
  avg_price: number;
}

const CHART_FUELS = ['Gasóleo simples', 'Gasolina simples 95'];

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

async function fetchPredictions(): Promise<PredictionData> {
  const r = await fetch('/api/previsao');
  return r.json();
}

async function fetchChartData(): Promise<DailyAvg[]> {
  const results = await Promise.all(
    CHART_FUELS.map((fuel) => getDailyAverages(fuel, 30))
  );
  return results.flat().filter(Boolean) as DailyAvg[];
}

export default function PrevisaoPage() {
  const [tankSize, setTankSize] = useState(50);
  const { t, locale } = useTranslation();

  const {
    data: avgPrices = {},
    isLoading: pricesLoading,
  } = useQuery({
    queryKey: ['avgPrices'],
    queryFn: fetchAvgPrices,
  });

  const {
    data: predData,
    isLoading: predLoading,
  } = useQuery({
    queryKey: ['predictions'],
    queryFn: fetchPredictions,
  });

  const {
    data: chartRaw = [],
    isLoading: chartLoading,
  } = useQuery({
    queryKey: ['priceChart30d'],
    queryFn: fetchChartData,
  });

  const loading = pricesLoading || predLoading;
  const scrapedPredictions = predData?.predictions ?? [];
  const scrapeError = predData?.error ?? '';
  const scrapedAt = predData?.scrapedAt ?? '';

  const predictions = scrapedPredictions.map((sp) => {
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
      weekRange: sp.week || t('forecast.nextWeek'),
      recommendation: sp.text,
      source: 'precocombustiveis.pt',
    };
  });

  const hasPredictions = predictions.length > 0;

  const lastUpdated = scrapedAt
    ? new Date(scrapedAt).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Build chart data
  const chartData = (() => {
    const dateMap = new Map<string, { date: string; [key: string]: string | number | undefined }>();
    for (const item of chartRaw) {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }
      dateMap.get(item.date)![item.fuel_type] = item.avg_price;
    }
    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  })();

  const hasChartData = chartData.length > 0;

  const chartPredictions = hasPredictions
    ? predictions
        .filter((p) => CHART_FUELS.includes(p.fuelType) && p.currentPriceNum > 0)
        .map((p) => ({
          fuelType: p.fuelType,
          estimatedPrice: p.currentPriceNum + p.predictedChange,
        }))
    : undefined;

  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
          {t('forecast.title')}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          {predictions[0]?.weekRange && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {predictions[0].weekRange}
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs text-zinc-400">
              {t('forecast.updated', { time: lastUpdated })}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      ) : hasPredictions ? (
        <>
          {/* Prediction Cards */}
          <PriceForecast predictions={predictions} lastUpdated={lastUpdated ?? ''} />

          {/* 30-Day Price Chart */}
          {chartLoading ? (
            <Skeleton className="mt-6 h-64 rounded-xl" />
          ) : hasChartData ? (
            <div className="mt-6">
              <PriceChart
                data={chartData}
                fuelTypes={CHART_FUELS}
                title={t('forecast.chart.last30')}
                height={280}
                predictions={chartPredictions}
                todayDate={todayDate}
              />
            </div>
          ) : (
            <Card className="mt-6">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-zinc-400">
                  {t('forecast.chart.collecting')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tank Cost Calculator */}
          {predictions.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <Fuel className="h-4 w-4 text-blue-500" />
                  {t('forecast.calculator.title')}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{t('forecast.calculator.tankSize')}</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{tankSize}L</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={tankSize}
                    onChange={(e) => setTankSize(Number(e.target.value))}
                    className="mt-2 w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>10L</span>
                    <span>80L</span>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {predictions.map((pred) => {
                    const impact = pred.predictedChange * tankSize;
                    const isUp = pred.direction === 'up';
                    const isDown = pred.direction === 'down';
                    const color = isDown
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isUp
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-zinc-500';

                    return (
                      <div key={pred.fuelType} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: getFuelColor(pred.fuelType) }}
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {pred.fuelLabel}
                          </span>
                        </div>
                        <span className={`text-lg font-black ${color}`}>
                          {impact > 0 ? '+' : impact < 0 ? '−' : ''}
                          {Math.abs(impact).toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Fallback */
        <div className="space-y-6">
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t('forecast.unavailable')}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {scrapeError
                    ? t('forecast.unavailableReason', { error: scrapeError })
                    : t('forecast.unavailableGeneric')}
                  {' '}{t('forecast.checkSources')}
                </p>
              </div>
            </CardContent>
          </Card>

          {Object.keys(avgPrices).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('forecast.currentPrices')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(avgPrices)
                    .filter(([key]) =>
                      ['Gasóleo simples', 'Gasolina simples 95'].includes(key)
                    )
                    .map(([fuel, price]) => (
                      <div
                        key={fuel}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{fuel}</span>
                        <span className="text-lg font-bold text-zinc-900 dark:text-white">
                          {price.toFixed(3).replace('.', ',')} €/L
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Accordion: Educational content */}
      <div className="mt-8 space-y-2">
        <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
          <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              {t('forecast.priceBreakdown.title')}
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <div className="space-y-3">
              {[
                { label: t('forecast.priceBreakdown.platts'), pct: 35, color: 'bg-blue-500' },
                { label: t('forecast.priceBreakdown.isp'), pct: 30, color: 'bg-red-500' },
                { label: t('forecast.priceBreakdown.vat'), pct: 19, color: 'bg-amber-500' },
                { label: t('forecast.priceBreakdown.biofuels'), pct: 6, color: 'bg-emerald-500' },
                { label: t('forecast.priceBreakdown.margin'), pct: 10, color: 'bg-zinc-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                    <span className="font-medium text-zinc-900 dark:text-white">~{item.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-zinc-400">
              {t('forecast.priceBreakdown.taxNote')}
            </p>
          </div>
        </details>

        <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
          <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-zinc-400" />
              {t('forecast.methodology.title')}
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">
              {t('forecast.methodology.text')}
            </p>
          </div>
        </details>
      </div>

      {/* External sources */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-bold text-zinc-700 dark:text-zinc-300">
          {t('forecast.sources.title')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              name: 'Contas Poupança',
              url: 'https://contaspoupanca.pt/carro/combustiveis/',
              desc: t('forecast.sources.contasPoupanca'),
            },
            {
              name: 'precoCombustiveis.pt',
              url: 'https://precocombustiveis.pt/proxima-semana/',
              desc: t('forecast.sources.precoCombustiveis'),
            },
            {
              name: 'ENSE',
              url: 'https://www.ense-epe.pt/precos-de-referencia/',
              desc: t('forecast.sources.ense'),
            },
            {
              name: 'DGEG',
              url: 'https://precoscombustiveis.dgeg.gov.pt/estatistica/preco-medio-diario/',
              desc: t('forecast.sources.dgeg'),
            },
          ].map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {source.name}
                </p>
                <p className="text-xs text-zinc-500">{source.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
