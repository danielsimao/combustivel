'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Fuel,
  Database,
  Code,
  ExternalLink,
  Shield,
  Clock,
  Map,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export default function SobrePage() {
  const sqlSchema = `-- Criar tabelas no Supabase
CREATE TABLE IF NOT EXISTS daily_averages (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  fuel_type TEXT NOT NULL,
  avg_price DECIMAL(8,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, fuel_type)
);

CREATE TABLE IF NOT EXISTS price_predictions (
  id BIGSERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  fuel_type TEXT NOT NULL,
  predicted_change DECIMAL(8,4),
  predicted_price DECIMAL(8,4),
  current_price DECIMAL(8,4),
  direction TEXT CHECK (direction IN ('up', 'down', 'stable')),
  confidence TEXT,
  source TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, fuel_type)
);

-- Índices para consultas rápidas
CREATE INDEX idx_daily_averages_date ON daily_averages(date);
CREATE INDEX idx_daily_averages_fuel ON daily_averages(fuel_type);
CREATE INDEX idx_predictions_week ON price_predictions(week_start);

-- RLS (Row Level Security)
ALTER TABLE daily_averages ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_predictions ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública
CREATE POLICY "Allow public read" ON daily_averages
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON price_predictions
  FOR SELECT USING (true);

-- Permitir escrita apenas via service role (API routes)
CREATE POLICY "Allow service insert" ON daily_averages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service insert" ON price_predictions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update" ON daily_averages
  FOR UPDATE USING (true);

CREATE POLICY "Allow service update" ON price_predictions
  FOR UPDATE USING (true);`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Sobre o Combustível
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Informação sobre a aplicação, fontes de dados e como configurar.
        </p>
      </div>

      {/* Features */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Map,
            title: 'Mapa Interativo',
            desc: 'Encontre postos próximos com preços no mapa',
            color: 'bg-blue-100 text-blue-600',
          },
          {
            icon: TrendingUp,
            title: 'Previsões',
            desc: 'Saiba se o preço vai subir ou descer',
            color: 'bg-green-100 text-green-600',
          },
          {
            icon: BarChart3,
            title: 'Histórico',
            desc: 'Evolução dos preços ao longo do tempo',
            color: 'bg-purple-100 text-purple-600',
          },
          {
            icon: Fuel,
            title: 'Comparação',
            desc: 'Compare postos na mesma zona',
            color: 'bg-amber-100 text-amber-600',
          },
        ].map((feature) => (
          <Card key={feature.title}>
            <CardContent className="p-4 text-center">
              <div
                className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {feature.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sources */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Fontes de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    DGEG - Direção-Geral de Energia e Geologia
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Fonte oficial dos preços dos combustíveis em Portugal. Dados desde 2004.
                    Os preços são comunicados pelos titulares de licença dos postos.
                  </p>
                </div>
                <a
                  href="https://precoscombustiveis.dgeg.gov.pt/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 text-zinc-400" />
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    ENSE - Entidade Nacional para o Setor Energético
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Preços de referência calculados com base nas cotações internacionais
                    (Platts/Argus), câmbio EUR/USD, biocombustíveis e custos operacionais.
                  </p>
                </div>
                <a
                  href="https://www.ense-epe.pt/precos-de-referencia/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 text-zinc-400" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Aviso Legal
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Os dados são fornecidos pela DGEG e ENSE para uso informativo não comercial.
              Os preços apresentados podem não refletir o preço exato no momento do abastecimento.
              As previsões são estimativas e não constituem garantia de preço.
              A política de preços dos combustíveis é livre em Portugal — cada posto define
              o seu preço.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Setup guide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-600" />
            Configuração (Supabase)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-zinc-600">
            Para ativar o histórico de preços e previsões avançadas, configure uma base de dados Supabase:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                1. Variáveis de Ambiente (Vercel)
              </h4>
              <div className="rounded-lg bg-zinc-900 p-4 text-sm text-green-400">
                <code className="whitespace-pre">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
CRON_SECRET=your-secret-token`}
                </code>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                2. SQL Schema
              </h4>
              <div className="max-h-96 overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-green-400">
                <pre>{sqlSchema}</pre>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                3. Cron Job
              </h4>
              <p className="text-xs text-zinc-500">
                O Vercel executa automaticamente o cron job configurado em{' '}
                <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                  vercel.json
                </code>{' '}
                todos os dias às 20:00 UTC para recolher o preço médio diário da DGEG.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Stack Tecnológico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              'Next.js 15',
              'React 19',
              'TypeScript',
              'Tailwind CSS',
              'shadcn/ui',
              'Supabase',
              'MapLibre GL',
              'Recharts',
              'Vercel',
              'DGEG API',
            ].map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
