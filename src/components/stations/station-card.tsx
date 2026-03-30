'use client';

import { Station } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, parsePrice, getFuelShortName, calculateDistance } from '@/lib/utils';
import { searchStore } from '@/lib/search-store';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface StationCardProps {
  station: Station;
  userLocation?: { lat: number; lng: number } | null;
  selectedFuel?: string;
  rank?: number;
}

export function StationCard({ station, userLocation, selectedFuel, rank }: StationCardProps) {
  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.Latitude,
        station.Longitude
      )
    : null;

  const selectedFuelData = selectedFuel
    ? station.Combustiveis?.find((c) => c.TipoCombustivel === selectedFuel)
    : null;

  return (
    <div onClick={() => searchStore.setState((s) => ({ ...s, selectedStation: station }))}>
      <Card className="transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {rank && (
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    rank === 1 ? 'bg-green-600' : rank === 2 ? 'bg-blue-600' : 'bg-zinc-500'
                  }`}>
                    {rank}
                  </span>
                )}
                <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {station.Nome}
                </h3>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {station.Marca}
                </Badge>
                {distance !== null && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Navigation className="h-3 w-3" />
                    {distance < 1
                      ? `${Math.round(distance * 1000)}m`
                      : `${distance.toFixed(1)}km`}
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{station.Morada}, {station.Localidade}</span>
              </p>
            </div>

            {selectedFuelData && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-zinc-900 dark:text-white">
                  {selectedFuelData.Preco}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {getFuelShortName(selectedFuelData.TipoCombustivel)}
                </p>
              </div>
            )}
          </div>

          {!selectedFuel && station.Combustiveis && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 sm:grid-cols-3 lg:grid-cols-4">
              {station.Combustiveis.map((fuel) => (
                <div key={fuel.TipoCombustivel} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-500 truncate">
                    {getFuelShortName(fuel.TipoCombustivel)}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                    {fuel.Preco}
                  </span>
                </div>
              ))}
            </div>
          )}

          {selectedFuelData?.DataAtualizacao && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400">
              <Clock className="h-3 w-3" />
              Atualizado: {selectedFuelData.DataAtualizacao}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
