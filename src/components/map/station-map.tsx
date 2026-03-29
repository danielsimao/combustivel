'use client';

import { useEffect, useState } from 'react';
import { Station } from '@/types';
import { formatPrice, parsePrice, getFuelShortName } from '@/lib/utils';

interface StationMapProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  selectedFuel: string;
  onStationClick: (station: Station) => void;
}

export function StationMap({
  stations,
  userLocation,
  selectedFuel,
  onStationClick,
}: StationMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<StationMapProps> | null>(null);

  useEffect(() => {
    import('./leaflet-map').then((mod) => {
      setMapComponent(() => mod.LeafletMap);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-500">A carregar mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <MapComponent
      stations={stations}
      userLocation={userLocation}
      selectedFuel={selectedFuel}
      onStationClick={onStationClick}
    />
  );
}

export function StationMapFallback() {
  return (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Mapa indisponível</p>
    </div>
  );
}
