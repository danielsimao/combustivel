'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/types';
import { formatPrice, parsePrice, getFuelShortName } from '@/lib/utils';
import { useEffect } from 'react';
import Link from 'next/link';

// Fix leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createPriceIcon(price: string, isLowest: boolean) {
  const bg = isLowest ? '#16a34a' : '#2563eb';
  const border = isLowest ? '#15803d' : '#1d4ed8';
  const safePrice = escapeHtml(price);
  return L.divIcon({
    className: 'custom-price-marker',
    html: `<div style="background:${bg};color:white;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid ${border};text-align:center">${safePrice}</div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 30],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
      width: 16px;
      height: 16px;
      background: #3b82f6;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(59,130,246,0.5);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LeafletMapProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  selectedFuel: string;
  onStationClick: (station: Station) => void;
}

export function LeafletMap({
  stations,
  userLocation,
  selectedFuel,
  onStationClick,
}: LeafletMapProps) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [39.5, -8.0];
  const zoom = userLocation ? 13 : 7;

  const stationsWithPrice = stations
    .map((s) => {
      const fuel = s.Combustiveis?.find((c) => c.TipoCombustivel === selectedFuel);
      return { station: s, price: fuel ? parsePrice(fuel.Preco) : 0 };
    })
    .filter((s) => s.price > 0);

  const lowestPrice = Math.min(...stationsWithPrice.map((s) => s.price));

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-[500px] w-full rounded-xl"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <>
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon()}
          >
            <Popup>A sua localização</Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={5000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.05,
              weight: 1,
            }}
          />
        </>
      )}

      {stationsWithPrice.map(({ station, price }) => (
        <Marker
          key={station.Id}
          position={[station.Latitude, station.Longitude]}
          icon={createPriceIcon(
            formatPrice(price),
            Math.abs(price - lowestPrice) < 0.001
          )}
          eventHandlers={{
            click: () => onStationClick(station),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <p className="font-bold text-zinc-900">{station.Nome}</p>
              <p className="text-xs text-zinc-500">{station.Marca}</p>
              <p className="mt-1 text-xs text-zinc-600">{station.Morada}</p>
              <div className="mt-2 space-y-1">
                {station.Combustiveis?.map((fuel) => (
                  <div key={fuel.TipoCombustivel} className="flex justify-between text-xs">
                    <span className="text-zinc-600">
                      {getFuelShortName(fuel.TipoCombustivel)}
                    </span>
                    <span className="font-semibold">{fuel.Preco}</span>
                  </div>
                ))}
              </div>
              <Link
                href={`/posto/${station.Id}`}
                className="mt-2 block text-center text-xs font-medium text-blue-600 hover:underline"
              >
                Ver detalhes
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapUpdater center={center} />
    </MapContainer>
  );
}
