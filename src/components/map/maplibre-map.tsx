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
  onStationClick: (station: Station) => void;
}

export function MaplibreMap({
  stations,
  userLocation,
  selectedFuel,
  onStationClick,
}: MaplibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

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
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      duration: 1000,
    });
  }, [userLocation]);

  // Render markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];

    // Close any open popup
    popupRef.current?.remove();

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
      const bg = isLowest ? '#16a34a' : '#2563eb';
      const border = isLowest ? '#15803d' : '#1d4ed8';
      const safePrice = escapeHtml(formatPrice(price));

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="
          background: ${bg};
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid ${border};
          text-align: center;
          transform: translate(-50%, -100%);
        ">${safePrice}</div>
      `;

      // Build popup content
      const fuelRows = (station.Combustiveis || [])
        .map((fuel) => {
          const name = escapeHtml(getFuelShortName(fuel.TipoCombustivel));
          const fuelPrice = escapeHtml(fuel.Preco || '—');
          return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0">
            <span style="color:#6b7280">${name}</span>
            <span style="font-weight:600">${fuelPrice}</span>
          </div>`;
        })
        .join('');

      const popupHtml = `
        <div style="min-width:200px;font-family:inherit">
          <p style="font-weight:700;color:#18181b;margin:0">${escapeHtml(station.Nome)}</p>
          <p style="font-size:12px;color:#a1a1aa;margin:2px 0 0">${escapeHtml(station.Marca)}</p>
          <p style="font-size:12px;color:#52525b;margin:4px 0">${escapeHtml(station.Morada || '')}</p>
          <div style="margin-top:8px">${fuelRows}</div>
          <a href="/posto/${station.Id}" style="display:block;text-align:center;font-size:12px;font-weight:500;color:#2563eb;margin-top:8px;text-decoration:none">
            Ver detalhes →
          </a>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: [0, -10],
        closeButton: true,
        maxWidth: '280px',
      }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([station.Longitude, station.Latitude])
        .setPopup(popup)
        .addTo(map.current);

      el.addEventListener('click', () => {
        popupRef.current?.remove();
        popup.addTo(map.current!);
        popupRef.current = popup;
      });

      markersRef.current.push(marker);
    }

    // Fit bounds to show all markers
    if (stationsWithPrice.length > 0 && !userLocation) {
      const bounds = new maplibregl.LngLatBounds();
      for (const { station } of stationsWithPrice) {
        bounds.extend([station.Longitude, station.Latitude]);
      }
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [stationsWithPrice, lowestPrice, userLocation]);

  return (
    <div
      ref={mapContainer}
      className="h-[500px] w-full rounded-xl"
      style={{ position: 'relative' }}
    />
  );
}
