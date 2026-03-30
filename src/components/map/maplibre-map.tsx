'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station } from '@/types';
import { formatPrice, parsePrice, getFuelShortName } from '@/lib/utils';

const TILE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface MaplibreMapProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  selectedFuel: string;
  selectedStationId: number | null;
  onStationClick: (station: Station) => void;
}

export function MaplibreMap({
  stations,
  userLocation,
  selectedFuel,
  selectedStationId,
  onStationClick,
}: MaplibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const center: [number, number] = userLocation
    ? [userLocation.lng, userLocation.lat]
    : [-8.0, 39.5];
  const zoom = userLocation ? 12 : 6;

  const stationsWithPrice = useMemo(() => {
    return stations
      .map((s) => {
        const fuel = s.Combustiveis?.find((c) => c.TipoCombustivel === selectedFuel);
        return { station: s, price: fuel ? parsePrice(fuel.Preco) : 0 };
      })
      .filter((s) => s.price > 0);
  }, [stations, selectedFuel]);

  const lowestPrice = useMemo(() => {
    if (stationsWithPrice.length === 0) return 0;
    return Math.min(...stationsWithPrice.map((s) => s.price));
  }, [stationsWithPrice]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: TILE_STYLE,
      center,
      zoom,
      attributionControl: {},
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when user location changes
  useEffect(() => {
    if (!map.current || !userLocation) return;
    const fly = () => {
      map.current?.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        duration: 1000,
      });
    };
    if (map.current.isStyleLoaded()) {
      fly();
    } else {
      map.current.once('load', fly);
    }
  }, [userLocation]);

  // Pan to selected station
  useEffect(() => {
    if (!map.current || !selectedStationId) return;
    const selected = stationsWithPrice.find((s) => s.station.Id === selectedStationId);
    if (!selected) return;
    const { Longitude, Latitude } = selected.station;
    if (!Longitude || !Latitude) return;
    map.current.easeTo({
      center: [Longitude, Latitude],
      duration: 500,
    });
  }, [selectedStationId, stationsWithPrice]);

  // Render markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];

    // Add user location marker
    if (userLocation) {
      const userEl = document.createElement('div');
      userEl.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3), 0 2px 8px rgba(59,130,246,0.5);
        "></div>
      `;
      const userMarker = new maplibregl.Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
      markersRef.current.push(userMarker);
    }

    // Add station markers
    for (const { station, price } of stationsWithPrice) {
      const isLowest = Math.abs(price - lowestPrice) < 0.001;
      const isSelected = station.Id === selectedStationId;
      const bg = isSelected ? '#f59e0b' : isLowest ? '#16a34a' : '#2563eb';
      const border = isSelected ? '#d97706' : isLowest ? '#15803d' : '#1d4ed8';
      const scale = isSelected ? 'scale(1.25)' : 'scale(1)';
      const shadow = isSelected
        ? '0 0 0 3px rgba(245,158,11,0.4), 0 4px 12px rgba(0,0,0,0.4)'
        : '0 2px 8px rgba(0,0,0,0.3)';
      const safePrice = escapeHtml(formatPrice(price));

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.style.zIndex = isSelected ? '10' : '1';
      el.innerHTML = `
        <div style="
          background: ${bg};
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: ${shadow};
          border: 2px solid ${border};
          text-align: center;
          transform: translate(-50%, -100%) ${scale};
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        ">${safePrice}</div>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([station.Longitude, station.Latitude])
        .addTo(map.current);

      el.addEventListener('click', () => {
        onStationClick(station);
      });

      markersRef.current.push(marker);
    }

    // Fit bounds to show all markers (wait for style to load)
    if (stationsWithPrice.length > 0 && !userLocation) {
      const fitBounds = () => {
        if (!map.current) return;
        const bounds = new maplibregl.LngLatBounds();
        for (const { station } of stationsWithPrice) {
          bounds.extend([station.Longitude, station.Latitude]);
        }
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      };

      if (map.current.isStyleLoaded()) {
        fitBounds();
      } else {
        map.current.once('load', fitBounds);
      }
    }
  }, [stationsWithPrice, lowestPrice, userLocation, onStationClick, selectedStationId]);

  return (
    <div
      ref={mapContainer}
      className="h-[500px] w-full rounded-xl"
      style={{ position: 'relative' }}
    />
  );
}
