'use client';

import { Station } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { getFuelShortName, getFuelColor, calculateDistance } from '@/lib/utils';
import { searchStore } from '@/lib/search-store';
import { MapPin, Navigation } from 'lucide-react';

interface StationCardProps {
  station: Station;
  userLocation?: { lat: number; lng: number } | null;
  selectedFuel?: string;
}

export function StationCard({ station, userLocation, selectedFuel }: StationCardProps) {
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
      <Card className="cursor-pointer transition-all hover:border-blue-200 hover:shadow-md active:scale-[0.98]">
        <CardContent className="p-3">
          {/* Top row: price + distance */}
          <div className="flex items-center justify-between gap-2">
            {selectedFuelData && (
              <span className="text-base font-black text-zinc-900 dark:text-white">
                {selectedFuelData.Preco}
              </span>
            )}
            {distance !== null && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Navigation className="h-3 w-3" />
                {distance < 1
                  ? `${Math.round(distance * 1000)}m`
                  : `${distance.toFixed(1)}km`}
              </span>
            )}
          </div>

          {/* Station name */}
          <p className="mt-1.5 truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {station.Nome}
          </p>

          {/* Brand + address */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="shrink-0 font-medium text-zinc-500">{station.Marca}</span>
            <span>·</span>
            <span className="truncate">
              <MapPin className="mr-0.5 inline h-3 w-3" />
              {station.Localidade || station.Morada}
            </span>
          </div>

          {/* Fuel type indicator */}
          {selectedFuelData && (
            <div className="mt-2 flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: getFuelColor(selectedFuelData.TipoCombustivel) }}
              />
              <span className="text-[10px] text-zinc-400">
                {getFuelShortName(selectedFuelData.TipoCombustivel)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
