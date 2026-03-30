'use client';

import { useEffect, useState } from 'react';
import { Station } from '@/types';

interface StationMapProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  selectedFuel: string;
  selectedStationId?: number | null;
  onStationClick: (station: Station) => void;
}

export function StationMap({
  stations,
  userLocation,
  selectedFuel,
  selectedStationId,
  onStationClick,
}: StationMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<StationMapProps & { selectedStationId: number | null }> | null>(null);

  useEffect(() => {
    import('./maplibre-map').then((mod) => {
      setMapComponent(() => mod.MaplibreMap);
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
      selectedStationId={selectedStationId ?? null}
      onStationClick={onStationClick}
    />
  );
}
