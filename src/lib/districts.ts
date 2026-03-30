// Approximate center coordinates for each Portuguese district
// Used to find the nearest district from user GPS coordinates
const DISTRICTS: { id: number; name: string; lat: number; lng: number }[] = [
  { id: 1, name: 'Aveiro', lat: 40.6405, lng: -8.6538 },
  { id: 2, name: 'Beja', lat: 38.0154, lng: -7.8631 },
  { id: 3, name: 'Braga', lat: 41.5518, lng: -8.4229 },
  { id: 4, name: 'Bragança', lat: 41.8061, lng: -6.7589 },
  { id: 5, name: 'Castelo Branco', lat: 39.8223, lng: -7.4931 },
  { id: 6, name: 'Coimbra', lat: 40.2033, lng: -8.4103 },
  { id: 7, name: 'Évora', lat: 38.5711, lng: -7.9093 },
  { id: 8, name: 'Faro', lat: 37.0194, lng: -7.9304 },
  { id: 9, name: 'Guarda', lat: 40.5373, lng: -7.2676 },
  { id: 10, name: 'Leiria', lat: 39.7437, lng: -8.8071 },
  { id: 11, name: 'Lisboa', lat: 38.7223, lng: -9.1393 },
  { id: 12, name: 'Portalegre', lat: 39.2967, lng: -7.4283 },
  { id: 13, name: 'Porto', lat: 41.1579, lng: -8.6291 },
  { id: 14, name: 'Santarém', lat: 39.2369, lng: -8.685 },
  { id: 15, name: 'Setúbal', lat: 38.5244, lng: -8.8882 },
  { id: 16, name: 'Viana do Castelo', lat: 41.6933, lng: -8.8328 },
  { id: 17, name: 'Vila Real', lat: 41.2959, lng: -7.7461 },
  { id: 18, name: 'Viseu', lat: 40.6566, lng: -7.9125 },
];

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestDistrictId(lat: number, lng: number): string {
  let nearest = DISTRICTS[0];
  let minDist = Infinity;

  for (const d of DISTRICTS) {
    const dist = haversineDistance(lat, lng, d.lat, d.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = d;
    }
  }

  return String(nearest.id);
}
