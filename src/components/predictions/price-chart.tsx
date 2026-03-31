'use client';

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

interface ChartData {
  date: string;
  [key: string]: string | number | undefined;
}

interface PriceChartProps {
  data: ChartData[];
  fuelTypes: string[];
  title: string;
  height?: number;
}

export function PriceChart({ data, fuelTypes, title, height = 350 }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-zinc-500">
            Sem dados disponíveis. Os dados serão recolhidos diariamente.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
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
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(3)} €/L`,
                getFuelShortName(String(name)),
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: '12px' }}>{getFuelShortName(value)}</span>
              )}
            />
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
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
