'use client';

import { useQuery } from '@tanstack/react-query';
import { Station } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getFuelShortName, getFuelColor, formatDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { MapPin, Navigation, Clock, CreditCard, Fuel } from 'lucide-react';

interface StationDetailData {
  Nome: string;
  Marca: string;
  TipoPosto: string;
  Combustiveis: { TipoCombustivel: string; Preco: string }[];
  HorarioPosto?: {
    DiasUteis: string;
    Sabado: string;
    Domingo: string;
    Feriado: string;
  };
  Morada: string | { Morada: string; Localidade: string; CodPostal: string };
  MeiosPagamento?: { Descritivo: string }[];
  DataAtualizacao?: string;
}

async function fetchStationDetail(id: number): Promise<StationDetailData | null> {
  const r = await fetch(`/api/dgeg/posto?id=${id}`);
  const data = await r.json();
  const raw = data.resultado ?? null;
  if (!raw) return null;

  // Flatten nested Morada
  if (raw.Morada && typeof raw.Morada === 'object') {
    const addr = raw.Morada;
    raw.Morada = addr.Morada || '';
    raw.Localidade = addr.Localidade || '';
    raw.CodPostal = addr.CodPostal || '';
  }

  return raw;
}

interface StationDetailProps {
  station: Station;
}

export function StationDetail({ station }: StationDetailProps) {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useQuery({
    queryKey: ['station-detail', station.Id],
    queryFn: () => fetchStationDetail(station.Id),
    staleTime: 10 * 60 * 1000,
  });

  const fuels = (detail?.Combustiveis ?? station.Combustiveis ?? []).filter(
    (f) => {
      const price = parseFloat(f.Preco?.replace(',', '.').replace(' €/litro', '').replace(' €', '') || '0');
      return price > 0;
    }
  );

  const hasCoords =
    station.Latitude != null &&
    station.Longitude != null &&
    station.Latitude !== 0 &&
    station.Longitude !== 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          {station.Nome}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge>{station.Marca}</Badge>
          {station.TipoPosto && <Badge variant="outline">{station.TipoPosto}</Badge>}
          {station.Distrito && <Badge variant="outline">{station.Distrito}</Badge>}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
          <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
          {station.Morada}
          {station.Localidade && `, ${station.Localidade}`}
        </p>
      </div>

      {/* Directions */}
      {hasCoords && (
        <Button
          onClick={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${station.Latitude},${station.Longitude}`,
              '_blank'
            )
          }
          variant="primary"
          size="sm"
          className="w-full"
        >
          <Navigation className="mr-2 h-4 w-4" />
          {t('station.directions')}
        </Button>
      )}

      {/* Fuel prices */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <Fuel className="h-4 w-4 text-blue-600" />
          {t('station.prices')}
        </h3>
        {fuels.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {fuels.map((fuel) => (
              <div
                key={fuel.TipoCombustivel}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getFuelColor(fuel.TipoCombustivel) }}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {getFuelShortName(fuel.TipoCombustivel)}
                  </span>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  {fuel.Preco}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{t('station.noPrices')}</p>
        )}
      </div>

      {/* Opening hours */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-lg" />
      ) : detail?.HorarioPosto ? (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <Clock className="h-4 w-4 text-blue-600" />
            {t('station.hours')}
          </h3>
          <div className="space-y-1 text-sm">
            {[
              { label: t('station.weekdays'), value: detail.HorarioPosto.DiasUteis },
              { label: t('station.saturday'), value: detail.HorarioPosto.Sabado },
              { label: t('station.sunday'), value: detail.HorarioPosto.Domingo },
              { label: t('station.holiday'), value: detail.HorarioPosto.Feriado },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-zinc-500">{row.label}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {row.value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Payment methods */}
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-lg" />
      ) : detail?.MeiosPagamento && detail.MeiosPagamento.length > 0 ? (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <CreditCard className="h-4 w-4 text-blue-600" />
            {t('station.payment')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {detail.MeiosPagamento.map((m) => (
              <Badge key={m.Descritivo} variant="outline" className="text-xs">
                {m.Descritivo}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Last updated */}
      {detail?.DataAtualizacao && (
        <p className="text-xs text-zinc-400">
          {t('station.updated', { date: detail.DataAtualizacao })}
        </p>
      )}
    </div>
  );
}
