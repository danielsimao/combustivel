'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFuelColor, getFuelShortName } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface ChartData {
  date: string;
  [key: string]: string | number | undefined;
}

interface PredictionPoint {
  fuelType: string;
  estimatedPrice: number;
}

interface PriceChartProps {
  data: ChartData[];
  fuelTypes: string[];
  title: string;
  height?: number;
  predictions?: PredictionPoint[];
  todayDate?: string;
}

export function PriceChart({ data, fuelTypes, title, height = 350, predictions, todayDate }: PriceChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!predictions || predictions.length === 0) return data;

    // Find next Monday for the predicted point
    const now = todayDate ? new Date(todayDate + 'T12:00:00Z') : new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(now.getTime() + daysUntilMonday * 86400000);
    const nextMondayStr = nextMonday.toISOString().split('T')[0];

    // Copy data and add _predicted keys to the last real point (bridge)
    const extendedData = data.map((point, i) => {
      if (i !== data.length - 1) return point;
      const bridged = { ...point };
      for (const pred of predictions) {
        const lastValue = point[pred.fuelType];
        if (lastValue !== undefined) {
          bridged[`${pred.fuelType}_predicted`] = lastValue;
        }
      }
      return bridged;
    });

    // Add the future predicted point
    const futurePoint: ChartData = { date: nextMondayStr };
    for (const pred of predictions) {
      futurePoint[`${pred.fuelType}_predicted`] = pred.estimatedPrice;
    }

    return [...extendedData, futurePoint];
  }, [data, predictions, todayDate]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-zinc-500">
            {t('forecast.chart.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPredictions = predictions && predictions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#18181b' }}
              tickLine={false}
              axisLine={{ stroke: '#e4e4e7' }}
              angle={-45}
              textAnchor="end"
              height={50}
              tickFormatter={(v) => {
                const [, m, d] = String(v).split('-');
                return `${parseInt(d)}/${parseInt(m)}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#71717a' }}
              tickLine={false}
              axisLine={{ stroke: '#e4e4e7' }}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${v.toFixed(3)}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#18181b', fontWeight: 600, marginBottom: 4 }}
              labelFormatter={(v) => {
                const [, m, d] = String(v).split('-');
                return `${parseInt(d)}/${parseInt(m)}`;
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const nameStr = String(name);
                const isPredicted = nameStr.endsWith('_predicted');
                const fuelName = isPredicted ? nameStr.replace('_predicted', '') : nameStr;
                const label = getFuelShortName(fuelName);
                return [
                  `${Number(value).toFixed(3)} €/L`,
                  isPredicted ? `${label} (${t('nav.forecast').toLowerCase()})` : label,
                ];
              }}
            />
            <Legend
              formatter={(value) => {
                if (String(value).endsWith('_predicted')) return null;
                return <span style={{ fontSize: '12px' }}>{getFuelShortName(value)}</span>;
              }}
            />

            {/* "Now" reference line — placed at last real data point */}
            {hasPredictions && data.length > 0 && (
              <ReferenceLine
                x={data[data.length - 1].date}
                stroke="#a1a1aa"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: '▸', position: 'top', fill: '#a1a1aa', fontSize: 10 }}
              />
            )}

            {/* Solid historical lines */}
            {fuelTypes.map((fuel) => (
              <Line
                key={fuel}
                type="monotone"
                dataKey={fuel}
                stroke={getFuelColor(fuel)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}

            {/* Dashed predicted lines */}
            {hasPredictions && fuelTypes.map((fuel) => (
              <Line
                key={`${fuel}_predicted`}
                type="monotone"
                dataKey={`${fuel}_predicted`}
                stroke={getFuelColor(fuel)}
                strokeWidth={2.5}
                strokeDasharray="8 5"
                strokeOpacity={0.5}
                dot={(props: Record<string, unknown>) => {
                  const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                  // Only show dot on the last (predicted) point, not the bridge
                  if (index === 0) return <circle key="hidden" r={0} />;
                  return (
                    <circle
                      key="predicted"
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={getFuelColor(fuel)}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 6 }}
                legendType="none"
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
