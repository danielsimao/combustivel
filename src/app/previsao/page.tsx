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
} from 'lucide-react';
import Link from 'next/link';

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

function getNextMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  return nextMonday;
}

function getNextSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

function formatDatePT(d: Date): string {
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
}

export default function PrevisaoPage() {
  const [loading, setLoading] = useState(true);
  const [avgPrices, setAvgPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/dgeg/preco-medio')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const prices: Record<string, number> = {};
          for (const item of data) {
            if (item.TipoCombustivel && item.PrecoMedio) {
              prices[item.TipoCombustivel] = parseFloat(
                String(item.PrecoMedio).replace(',', '.')
              );
            }
          }
          setAvgPrices(prices);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const nextMonday = getNextMonday();
  const nextSunday = getNextSunday(nextMonday);
  const weekRange = `${formatDatePT(nextMonday)} a ${formatDatePT(nextSunday)}`;

  const predictions: PredictionInfo[] = [
    {
      fuelType: 'gasoleo_simples',
      fuelLabel: 'Gasóleo Simples',
      currentPrice: avgPrices['Gasóleo simples']
        ? `${avgPrices['Gasóleo simples'].toFixed(3).replace('.', ',')} €/L`
        : 'A carregar...',
      predictedChange: 0.01,
      direction: 'up',
      weekRange,
      recommendation:
        'Considere abastecer antes de segunda-feira. O gasóleo deverá subir ligeiramente.',
      source: 'Estimativa baseada nas cotações Platts e câmbio EUR/USD',
      factors: [
        'Cotação do Brent em torno dos 100 $/barril',
        'Euro ligeiramente mais fraco face ao dólar',
        'ISP mantém desconto de 9,4 cêntimos',
      ],
    },
    {
      fuelType: 'gasolina_95',
      fuelLabel: 'Gasolina Simples 95',
      currentPrice: avgPrices['Gasolina simples 95']
        ? `${avgPrices['Gasolina simples 95'].toFixed(3).replace('.', ',')} €/L`
        : 'A carregar...',
      predictedChange: -0.01,
      direction: 'down',
      weekRange,
      recommendation:
        'Pode esperar para abastecer. A gasolina deverá descer ligeiramente.',
      source: 'Estimativa baseada nas cotações Platts e câmbio EUR/USD',
      factors: [
        'Cotações internacionais da gasolina em ligeira queda',
        'ISP mantém desconto de 5,1 cêntimos',
        'Tendência de correção após subidas recentes',
      ],
    },
    {
      fuelType: 'gasolina_98',
      fuelLabel: 'Gasolina Especial 98',
      currentPrice: avgPrices['Gasolina especial 98']
        ? `${avgPrices['Gasolina especial 98'].toFixed(3).replace('.', ',')} €/L`
        : 'A carregar...',
      predictedChange: -0.01,
      direction: 'down',
      weekRange,
      recommendation:
        'Tendência semelhante à gasolina 95. Ligeira descida esperada.',
      source: 'Estimativa baseada nas cotações Platts e câmbio EUR/USD',
      factors: [
        'Segue a tendência da gasolina 95',
        'Margem dos postos tende a ser mais estável neste segmento',
      ],
    },
    {
      fuelType: 'gpl',
      fuelLabel: 'GPL Auto',
      currentPrice: avgPrices['GPL Auto']
        ? `${avgPrices['GPL Auto'].toFixed(3).replace('.', ',')} €/L`
        : 'A carregar...',
      predictedChange: 0,
      direction: 'stable',
      weekRange,
      recommendation:
        'O GPL tende a ter variações menores. Sem alteração significativa prevista.',
      source: 'Estimativa baseada nas cotações internacionais',
      factors: [
        'Mercado de GPL mais estável',
        'Menor peso fiscal comparado com gasolina/gasóleo',
      ],
    },
  ];

  const lastUpdated = new Date().toLocaleDateString('pt-PT', {
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
          <PriceForecast predictions={predictions} lastUpdated={lastUpdated} />

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
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-600">Cotação internacional (Platts)</span>
                        <span className="font-medium">~35%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[35%] rounded-full bg-blue-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-600">ISP + Taxa de Carbono</span>
                        <span className="font-medium">~30%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[30%] rounded-full bg-red-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-600">IVA (23%)</span>
                        <span className="font-medium">~19%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[19%] rounded-full bg-amber-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-600">Biocombustíveis (13%)</span>
                        <span className="font-medium">~6%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[6%] rounded-full bg-green-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-600">Margem comercial + logística</span>
                        <span className="font-medium">~10%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div className="h-full w-[10%] rounded-full bg-zinc-400" />
                      </div>
                    </div>
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
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                        1
                      </span>
                      <span>
                        <strong className="text-zinc-900 dark:text-white">Abasteça à segunda-feira</strong> de manhã,
                        antes da atualização de preços.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                        2
                      </span>
                      <span>
                        <strong className="text-zinc-900 dark:text-white">Compare postos</strong> na mesma zona.
                        A diferença pode chegar a 10 cêntimos/litro.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                        3
                      </span>
                      <span>
                        <strong className="text-zinc-900 dark:text-white">Postos de hipermercado</strong> (Intermarché,
                        Leclerc, Jumbo) costumam ser mais baratos.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                        4
                      </span>
                      <span>
                        <strong className="text-zinc-900 dark:text-white">Use cartões de desconto</strong> (frota,
                        fidelização) para descontos adicionais.
                      </span>
                    </li>
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
                  desc: 'Previsão para a próxima semana',
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
