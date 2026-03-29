import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  return parseFloat(priceStr.replace('€', '').replace(',', '.').trim());
}

export function formatPrice(price: number): string {
  return price.toFixed(3).replace('.', ',') + ' €';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getFuelColor(fuelType: string): string {
  const colors: Record<string, string> = {
    'Gasóleo simples': '#2563eb',
    'Gasóleo especial': '#1d4ed8',
    'Gasóleo colorido': '#7c3aed',
    'Gasolina simples 95': '#16a34a',
    'Gasolina especial 95': '#15803d',
    'Gasolina especial 98': '#dc2626',
    'GPL Auto': '#ea580c',
  };
  return colors[fuelType] || '#6b7280';
}

export function getFuelShortName(fuelType: string): string {
  const names: Record<string, string> = {
    'Gasóleo simples': 'Gasóleo',
    'Gasóleo especial': 'Gasóleo+',
    'Gasóleo colorido': 'Gasóleo C.',
    'Gasolina simples 95': 'SP 95',
    'Gasolina especial 95': 'SP 95+',
    'Gasolina especial 98': 'SP 98',
    'GPL Auto': 'GPL',
  };
  return names[fuelType] || fuelType;
}

export const DISTRICTS: Record<number, string> = {
  1: 'Aveiro',
  2: 'Beja',
  3: 'Braga',
  4: 'Bragança',
  5: 'Castelo Branco',
  6: 'Coimbra',
  7: 'Évora',
  8: 'Faro',
  9: 'Guarda',
  10: 'Leiria',
  11: 'Lisboa',
  12: 'Portalegre',
  13: 'Porto',
  14: 'Santarém',
  15: 'Setúbal',
  16: 'Viana do Castelo',
  17: 'Vila Real',
  18: 'Viseu',
};

export const FUEL_TYPES: Record<number, string> = {
  3201: 'Gasóleo simples',
  3001: 'Gasóleo especial',
  3301: 'Gasóleo colorido',
  2101: 'Gasolina simples 95',
  2001: 'Gasolina especial 95',
  2201: 'Gasolina especial 98',
  5001: 'GPL Auto',
};

export const MAIN_FUEL_TYPES = [3201, 2101, 2201, 5001];
