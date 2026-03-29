'use client';

import { useState, useEffect } from 'react';
import { PriceForecast } from '@/components/predictions/price-forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ExternalLink,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FuelPrediction } from '@/lib/scrape-predictions';

interface PredictionInfo {
  fuelType: string;
  fuelLabel: string;
  currentPrice: string;
  predictedChange: number;
  direction: 'up' | 'down' | 'stable';
  weekRange: string;
  recommendation: string;
  source: string;
  factors: string[];
}

function getRecommendation(trend: string, fuelLabel: string): string {
  if (trend === 'sobe') {
    return `Abasteça antes de segunda-feira! O ${fuelLabel.toLowerCase()} deverá subir.`;
  }
  if (trend === 'desce') {
    return `Pode esperar para abastecer. O ${fuelLabel.toLowerCase()} deverá descer.`;
  }
  return `Sem alteração significativa prevista para o ${fuelLabel.toLowerCase()}.`;
}

function getFactors(trend: string): string[] {
  if (trend === 'sobe') {
    return [
      'Cotações internacionais em alta',
      'Possível pressão do câmbio EUR/USD',
      'Verifique se o ISP será ajustado pelo governo',
    ];
  }
  if (trend === 'desce') {
    return [
      'Cotações internacionais em queda',
      'Possível alívio nas cotações Platts',
      'Tendência de correção nos mercados',
    ];
  }
  return ['Mercado estável', 'Sem variação significativa nas cotações internacionais'];
}

export default function PrevisaoPage() {
  const [loading, setLoading] = useState(true);
  const [avgPrices, setAvgPrices] = useState<Record<string, number>>({});
  const [scrapedPredictions, setScrapedPredictions] = useState<FuelPrediction[]>([]);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapedAt, setScrapedAt] = useState('');
  const [scrapeSource, setScrapeSource] = useState('');

  useEffect(() => {
    // Fetch both in parallel
    Promise.all([
      fetch('/api/dgeg/preco-medio')
        .then((r) => r.json())
        .catch(() => []),
      fetch('/api/previsao')
        .then((r) => r.json())
        .catch(() => ({ predictions: [], error: 'Erro de rede' })),
    ])
      .then(([priceData, predData]) => {
        // Process average prices
        if (Array.isArray(priceData)) {
          const prices: Record<string, number> = {};
          for (const item of priceData) {
            if (item.TipoCombustivel && item.PrecoMedio) {
              prices[item.TipoCombustivel] = parseFloat(
                String(item.PrecoMedio).replace(',', '.')
              );
            }
          }
          setAvgPrices(prices);
        }

        // Process scraped predictions
        if (predData.predictions && predData.predictions.length > 0) {
          setScrapedPredictions(predData.predictions);
          setScrapedAt(predData.scrapedAt || '');
          setScrapeSource(predData.source || '');
        }
        if (predData.error) {
          setScrapeError(predData.error);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Build predictions from scraped data
  const predictions: PredictionInfo[] = scrapedPredictions.map((sp) => ({
    fuelType: sp.fuelType,
    fuelLabel: sp.fuelLabel,
    currentPrice: avgPrices[sp.fuelType]
      ? `${avgPrices[sp.fuelType].toFixed(3).replace('.', ',')} €/L`
      : '—',
    predictedChange: sp.variationEuro,
    direction: sp.trend === 'sobe' ? 'up' : sp.trend === 'desce' ? 'down' : 'stable',
    weekRange: sp.week || 'Próxima semana',
    recommendation: getRecommendation(sp.trend, sp.fuelLabel),
    source: `precocombustiveis.pt — ${sp.text.substring(0, 120)}${sp.text.length > 120 ? '...' : ''}`,
    factors: getFactors(sp.trend),
  }));

  // If scraping returned no data, show fallback with DGEG prices only
  const hasPredictions = predictions.length > 0;

  const lastUpdated = scrapedAt
    ? new Date(scrapedAt).toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {hasPredictions ? (
            <PriceForecast predictions={predictions} lastUpdated={lastUpdated} />
          ) : (
            /* Fallback when scraping fails */
            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Previsão Semanal</h2>
                    <p className="mt-1 text-sm text-blue-100">
                      Os preços em Portugal atualizam às segundas-feiras
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Previsão automática temporariamente indisponível
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {scrapeError
                        ? `Motivo: ${scrapeError}`
                        : 'Não foi possível obter os dados de previsão automaticamente.'}
                      {' '}Consulte as fontes abaixo para a previsão mais recente.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Show current average prices from DGEG */}
              {Object.keys(avgPrices).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preços Médios Atuais (DGEG)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(avgPrices)
                        .filter(([key]) =>
                          ['Gasóleo simples', 'Gasolina simples 95', 'Gasolina especial 98', 'GPL Auto'].includes(key)
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

          {/* Price breakdown explanation */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
              Como é formado o preço?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Componentes do Preço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Cotação internacional (Platts)', pct: 35, color: 'bg-blue-500' },
                      { label: 'ISP + Taxa de Carbono', pct: 30, color: 'bg-red-500' },
                      { label: 'IVA (23%)', pct: 19, color: 'bg-amber-500' },
                      { label: 'Biocombustíveis (13%)', pct: 6, color: 'bg-green-500' },
                      { label: 'Margem comercial + logística', pct: 10, color: 'bg-zinc-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-zinc-600">{item.label}</span>
                          <span className="font-medium">~{item.pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-zinc-400">
                    Cerca de 55% do preço final são impostos (ISP + IVA)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Dicas para Poupar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-zinc-600">
                    {[
                      {
                        title: 'Abasteça à segunda-feira',
                        desc: 'de manhã, antes da atualização de preços.',
                      },
                      {
                        title: 'Compare postos',
                        desc: 'na mesma zona. A diferença pode chegar a 10 cêntimos/litro.',
                      },
                      {
                        title: 'Postos de hipermercado',
                        desc: '(Intermarché, Leclerc, Jumbo) costumam ser mais baratos.',
                      },
                      {
                        title: 'Use cartões de desconto',
                        desc: '(frota, fidelização) para descontos adicionais.',
                      },
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                          {i + 1}
                        </span>
                        <span>
                          <strong className="text-zinc-900 dark:text-white">{tip.title}</strong>{' '}
                          {tip.desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* External sources */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
              Fontes de Previsão
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: 'Contas Poupança',
                  url: 'https://contaspoupanca.pt/carro/combustiveis/',
                  desc: 'Previsões semanais detalhadas',
                },
                {
                  name: 'precoCombustiveis.pt',
                  url: 'https://precocombustiveis.pt/proxima-semana/',
                  desc: 'Previsão para a próxima semana (fonte automática)',
                },
                {
                  name: 'ENSE - Preços de Referência',
                  url: 'https://www.ense-epe.pt/precos-de-referencia/',
                  desc: 'Preços de referência diários',
                },
                {
                  name: 'DGEG - Preço Médio',
                  url: 'https://precoscombustiveis.dgeg.gov.pt/estatistica/preco-medio-diario/',
                  desc: 'Preço médio diário oficial',
                },
                {
                  name: 'Mais Gasolina',
                  url: 'https://www.maisgasolina.com/',
                  desc: 'Comparação de preços por posto',
                },
                {
                  name: 'ACP',
                  url: 'https://www.acp.pt/',
                  desc: 'Automóvel Club de Portugal',
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
        </>
      )}
    </div>
  );
}
