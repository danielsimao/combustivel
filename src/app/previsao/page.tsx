'use client';

import { useQuery } from '@tanstack/react-query';
import { PriceForecast } from '@/components/predictions/price-forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  Globe,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { FuelPrediction } from '@/lib/scrape-predictions';

interface PredictionData {
  predictions: FuelPrediction[];
  scrapedAt: string;
  source: string;
  error?: string;
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
      'Tensões geopolíticas mantêm pressão no crude',
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

export default function PrevisaoPage() {
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
      weekRange: sp.week || 'Próxima semana',
      recommendation: getRecommendation(sp.trend, sp.fuelLabel),
      source: 'precocombustiveis.pt',
      factors: getFactors(sp.trend),
    };
  });

  const hasPredictions = predictions.length > 0;

  const lastUpdated = scrapedAt
    ? new Date(scrapedAt).toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Collect all unique factors
  const allFactors = [...new Set(predictions.flatMap((p) => p.factors))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Previsão Semanal
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
              Atualizado: {lastUpdated}
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
          <PriceForecast predictions={predictions} lastUpdated={lastUpdated ?? ''} />

          {/* Market Context */}
          {allFactors.length > 0 && (
            <Card className="mt-6 overflow-hidden border-l-[6px] border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <Globe className="h-4 w-4 text-amber-500" />
                  Contexto de Mercado
                </div>
                <ul className="mt-3 space-y-2">
                  {allFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* How the prediction works */}
          <Card className="mt-6 overflow-hidden border-l-[6px] border-l-zinc-300 dark:border-l-zinc-600">
            <CardContent className="flex items-start gap-3 p-5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Como funciona a previsão?
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Em Portugal, os preços dos combustíveis atualizam às segundas-feiras.
                  A previsão baseia-se nas cotações internacionais Platts, no câmbio EUR/USD,
                  no preço do Brent, e nos impostos (ISP + IVA a 23%). A ENSE publica
                  diariamente preços de referência. Cada posto define livremente o seu preço final.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Fallback */
        <div className="space-y-6">
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Previsão temporariamente indisponível
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {scrapeError
                    ? `Motivo: ${scrapeError}`
                    : 'Não foi possível obter os dados de previsão.'}
                  {' '}Consulte as fontes abaixo.
                </p>
              </div>
            </CardContent>
          </Card>

          {Object.keys(avgPrices).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preços Médios Atuais (DGEG)</CardTitle>
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

      {/* Price breakdown */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
          Como é formado o preço?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="overflow-hidden border-l-[6px] border-l-blue-400">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Componentes do Preço
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Cotação internacional (Platts)', pct: 35, color: 'bg-blue-500' },
                  { label: 'ISP + Taxa de Carbono', pct: 30, color: 'bg-red-500' },
                  { label: 'IVA (23%)', pct: 19, color: 'bg-amber-500' },
                  { label: 'Biocombustíveis (13%)', pct: 6, color: 'bg-emerald-500' },
                  { label: 'Margem + logística', pct: 10, color: 'bg-zinc-400' },
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
                ~55% do preço final são impostos (ISP + IVA)
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-[6px] border-l-emerald-400">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Dicas para Poupar
              </div>
              <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
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
                    desc: '(Intermarché, Leclerc, Auchan) costumam ser mais baratos.',
                  },
                  {
                    title: 'Use cartões de desconto',
                    desc: '(frota, fidelização) para descontos adicionais.',
                  },
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
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
              desc: 'Fonte automática da previsão',
            },
            {
              name: 'ENSE',
              url: 'https://www.ense-epe.pt/precos-de-referencia/',
              desc: 'Preços de referência diários',
            },
            {
              name: 'DGEG',
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
    </div>
  );
}
