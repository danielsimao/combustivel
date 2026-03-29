'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Lightbulb, Calendar, DollarSign } from 'lucide-react';

interface PredictionData {
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

interface PriceForecastProps {
  predictions: PredictionData[];
  lastUpdated: string;
}

export function PriceForecast({ predictions, lastUpdated }: PriceForecastProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Previsão Semanal</h2>
            <p className="mt-1 text-sm text-blue-100">
              Estimativa para a próxima semana baseada nas cotações internacionais
            </p>
          </div>
          <Calendar className="h-8 w-8 text-blue-200" />
        </div>
        <p className="mt-3 text-xs text-blue-200">
          Os preços em Portugal atualizam às segundas-feiras. Última atualização: {lastUpdated}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {predictions.map((pred) => (
          <Card key={pred.fuelType} className="overflow-hidden">
            <div
              className={`h-1 ${
                pred.direction === 'down'
                  ? 'bg-green-500'
                  : pred.direction === 'up'
                  ? 'bg-red-500'
                  : 'bg-zinc-300'
              }`}
            />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{pred.fuelLabel}</CardTitle>
                <Badge
                  variant={
                    pred.direction === 'down'
                      ? 'success'
                      : pred.direction === 'up'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {pred.direction === 'down' && <TrendingDown className="mr-1 h-3 w-3" />}
                  {pred.direction === 'up' && <TrendingUp className="mr-1 h-3 w-3" />}
                  {pred.direction === 'stable' && <Minus className="mr-1 h-3 w-3" />}
                  {pred.direction === 'down' ? 'Desce' : pred.direction === 'up' ? 'Sobe' : 'Estável'}
                </Badge>
              </div>
              <CardDescription>{pred.weekRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-xs text-zinc-500">Preço atual</p>
                  <p className="text-lg font-bold">{pred.currentPrice}</p>
                </div>
                <div className="text-center">
                  <span className="text-zinc-400">→</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Variação prevista</p>
                  <p
                    className={`text-lg font-bold ${
                      pred.predictedChange < 0
                        ? 'text-green-600'
                        : pred.predictedChange > 0
                        ? 'text-red-600'
                        : 'text-zinc-600'
                    }`}
                  >
                    {pred.predictedChange > 0 ? '+' : ''}
                    {pred.predictedChange.toFixed(3).replace('.', ',')} €/L
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {pred.recommendation}
                  </p>
                </div>
              </div>

              {pred.factors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    Fatores
                  </p>
                  {pred.factors.map((factor, i) => (
                    <p key={i} className="text-xs text-zinc-500">
                      • {factor}
                    </p>
                  ))}
                </div>
              )}

              <p className="mt-3 text-[10px] text-zinc-400">
                Fonte: {pred.source}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Como funciona a previsão?
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Em Portugal, os preços dos combustíveis são atualizados semanalmente (segunda-feira).
              A previsão baseia-se nas cotações internacionais Platts, na taxa de câmbio EUR/USD,
              no preço do barril de Brent, e nos impostos (ISP + IVA a 23%). A ENSE publica
              diariamente preços de referência que servem de base ao cálculo.
              Cada posto define livremente o seu preço final.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
