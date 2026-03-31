'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PriceChart } from '@/components/predictions/price-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Database, ExternalLink } from 'lucide-react';
import { getDailyAverages } from '@/lib/supabase';
import { getFuelShortName, getFuelColor } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface DailyAvg {
  date: string;
  fuel_type: string;
  avg_price: number;
}

const FUEL_OPTIONS = [
  'Gasóleo simples',
  'Gasolina simples 95',
  'Gasolina especial 98',
  'GPL Auto',
];

async function fetchFuelData(selectedFuels: string[], timeRange: number): Promise<DailyAvg[]> {
  const results = await Promise.all(
    selectedFuels.map((fuel) => getDailyAverages(fuel, timeRange))
  );
  return results.flat().filter(Boolean) as DailyAvg[];
}

export default function EstatisticasPage() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState(90);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([
    'Gasóleo simples',
    'Gasolina simples 95',
  ]);

  const {
    data = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['fuelHistory', selectedFuels, timeRange],
    queryFn: () => fetchFuelData(selectedFuels, timeRange),
  });

  const hasData = data.length > 0;

  const chartData = (() => {
    const dateMap = new Map<string, { date: string; [key: string]: string | number | undefined }>();
    for (const item of data) {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }
      dateMap.get(item.date)![item.fuel_type] = item.avg_price;
    }
    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  })();

  const toggleFuel = (fuel: string) => {
    setSelectedFuels((prev) =>
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel]
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {t('stats.title')}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {t('stats.subtitle')}
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {t('stats.period')}
              </label>
              <Select
                value={String(timeRange)}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value="30">{t('stats.last30')}</option>
                <option value="90">{t('stats.last90')}</option>
                <option value="180">{t('stats.last180')}</option>
                <option value="365">{t('stats.last365')}</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {t('stats.fuels')}
              </label>
              <div className="flex flex-wrap gap-2">
                {FUEL_OPTIONS.map((fuel) => (
                  <button
                    key={fuel}
                    onClick={() => toggleFuel(fuel)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFuels.includes(fuel)
                        ? 'text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                    style={
                      selectedFuels.includes(fuel)
                        ? { backgroundColor: getFuelColor(fuel) }
                        : undefined
                    }
                  >
                    {getFuelShortName(fuel)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-[400px] w-full rounded-xl" />
      ) : hasData ? (
        <>
          <PriceChart
            data={chartData}
            fuelTypes={selectedFuels}
            title={t('stats.chartTitle', { days: timeRange })}
            height={400}
          />

          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {selectedFuels.map((fuel) => {
              const fuelData = data.filter((d) => d.fuel_type === fuel);
              if (fuelData.length === 0) return null;

              const latest = fuelData[fuelData.length - 1];
              const oldest = fuelData[0];
              const change = latest.avg_price - oldest.avg_price;
              const changePercent = (change / oldest.avg_price) * 100;
              const min = Math.min(...fuelData.map((d) => d.avg_price));
              const max = Math.max(...fuelData.map((d) => d.avg_price));

              return (
                <Card key={fuel}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: getFuelColor(fuel) }}
                      />
                      <p className="text-xs font-medium text-zinc-500">
                        {getFuelShortName(fuel)}
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                      {latest.avg_price.toFixed(3).replace('.', ',')} €
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : change < 0 ? (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-zinc-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          change > 0
                            ? 'text-red-600'
                            : change < 0
                            ? 'text-green-600'
                            : 'text-zinc-500'
                        }`}
                      >
                        {change > 0 ? '+' : ''}
                        {changePercent.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        ({timeRange}d)
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
                      <span>Min: {min.toFixed(3).replace('.', ',')} €</span>
                      <span>Max: {max.toFixed(3).replace('.', ',')} €</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="py-16">
          <CardContent className="text-center">
            <Database className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              {t('stats.emptyTitle')}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              {t('stats.emptyText')}
            </p>
            <div className="mx-auto mt-6 max-w-lg rounded-lg bg-zinc-50 p-4 text-left dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t('stats.setupTitle')}
              </p>
              <ol className="mt-2 space-y-1 text-xs text-zinc-500">
                <li>{t('stats.setup1')}</li>
                <li>{t('stats.setup2')}</li>
                <li>{t('stats.setup3')}</li>
                <li>{t('stats.setup4')}</li>
              </ol>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-zinc-500">
                {t('stats.checkSources')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href="https://precoscombustiveis.dgeg.gov.pt/estatistica/preco-medio-diario/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {t('stats.dgegLink')}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://www.ense-epe.pt/precos-de-referencia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {t('stats.enseLink')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
