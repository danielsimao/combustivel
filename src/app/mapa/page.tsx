'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { Station, Brand } from '@/types';
import { searchStore } from '@/lib/search-store';
import { getNearestDistrictId } from '@/lib/districts';
import { StationMap } from '@/components/map/station-map';
import { StationCard } from '@/components/stations/station-card';
import { StationDrawer } from '@/components/stations/station-drawer';
import { SearchFilters } from '@/components/stations/search-filters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  calculateDistance,
  parsePrice,
  FUEL_TYPES,
  getFuelShortName,
} from '@/lib/utils';
import {
  Fuel,
  MapPin,
  AlertCircle,
  SlidersHorizontal,
  LocateFixed,
} from 'lucide-react';

async function fetchBrands(): Promise<Brand[]> {
  const r = await fetch('/api/dgeg/marcas');
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function normalizeStations(results: Record<string, unknown>[]): Station[] {
  return results.map((s) => ({
    ...s,
    Combustiveis: s.Combustivel && s.Preco
      ? [{ TipoCombustivel: s.Combustivel as string, Preco: s.Preco as string, DataAtualizacao: (s.DataAtualizacao as string) || '' }]
      : s.Combustiveis || [],
  })) as Station[];
}

async function fetchStations(params: {
  selectedFuel: string;
  selectedDistrict: string;
  selectedBrand: string;
}): Promise<Station[]> {
  const baseParams = new URLSearchParams();
  if (params.selectedFuel) baseParams.set('idsTiposComb', params.selectedFuel);
  if (params.selectedDistrict) baseParams.set('idDistrito', params.selectedDistrict);
  if (params.selectedBrand) baseParams.set('idMarca', params.selectedBrand);
  baseParams.set('qtdPorPagina', '200');
  baseParams.set('pagina', '1');

  const res = await fetch(`/api/dgeg/pesquisar?${baseParams.toString()}`);
  const data = await res.json();

  if (data.erro) {
    throw new Error(data.erro);
  }

  let results = data.resultado || data || [];

  const total = results[0]?.Quantidade;
  if (total && total > 200) {
    const pages = Math.ceil(total / 200);
    const fetches = [];
    for (let p = 2; p <= pages; p++) {
      const pageParams = new URLSearchParams(baseParams);
      pageParams.set('pagina', String(p));
      fetches.push(
        fetch(`/api/dgeg/pesquisar?${pageParams.toString()}`)
          .then((r) => r.json())
          .then((d) => d.resultado || [])
      );
    }
    const extra = await Promise.all(fetches);
    results = results.concat(...extra);
  }

  return normalizeStations(results);
}

export default function MapaPage() {
  const selectedDistrict = useStore(searchStore, (s) => s.selectedDistrict);
  const selectedFuel = useStore(searchStore, (s) => s.selectedFuel);
  const selectedBrand = useStore(searchStore, (s) => s.selectedBrand);
  const hasSearched = useStore(searchStore, (s) => s.hasSearched);
  const userLocation = useStore(searchStore, (s) => s.userLocation);
  const selectedStation = useStore(searchStore, (s) => s.selectedStation);
  const sortMode = useStore(searchStore, (s) => s.sortMode);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const setSelectedDistrict = useCallback(
    (v: string) => searchStore.setState((s) => ({ ...s, selectedDistrict: v })),
    []
  );
  const setSelectedFuel = useCallback(
    (v: string) => searchStore.setState((s) => ({ ...s, selectedFuel: v })),
    []
  );
  const setSelectedBrand = useCallback(
    (v: string) => searchStore.setState((s) => ({ ...s, selectedBrand: v })),
    []
  );

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const {
    data: rawStations = [],
    isLoading: loading,
    error: searchError,
  } = useQuery({
    queryKey: ['stations', selectedFuel, selectedDistrict, selectedBrand],
    queryFn: () => fetchStations({ selectedFuel, selectedDistrict, selectedBrand }),
    enabled: hasSearched,
  });

  const stations = useMemo(() => {
    if (!userLocation || rawStations.length === 0) return rawStations;
    return [...rawStations]
      .map((s) => ({
        ...s,
        _distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          s.Latitude,
          s.Longitude
        ),
      }))
      .sort(
        (a: Station & { _distance: number }, b: Station & { _distance: number }) =>
          a._distance - b._distance
      )
      .slice(0, 50);
  }, [rawStations, userLocation]);

  const error = searchError?.message || locationError;

  const searchStations = useCallback(() => {
    setLocationError('');
    searchStore.setState((s) => ({ ...s, hasSearched: true }));
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocationError('');
        const nearestDistrict = getNearestDistrictId(
          pos.coords.latitude,
          pos.coords.longitude
        );
        searchStore.setState((s) => ({
          ...s,
          selectedDistrict: nearestDistrict,
          userLocation: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          hasSearched: true,
          sortMode: 'distance',
        }));
      },
      () => {
        setLocationError(
          'Não foi possível obter a sua localização. Verifique as permissões.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const sortedStations = useMemo(() => {
    if (sortMode === 'distance' && userLocation) {
      return stations;
    }
    return [...stations]
      .map((s) => {
        const fuel = s.Combustiveis?.find(
          (c) => c.TipoCombustivel === FUEL_TYPES[Number(selectedFuel)]
        );
        return { ...s, _price: fuel ? parsePrice(fuel.Preco) : Infinity };
      })
      .filter((s) => s._price < Infinity)
      .sort((a, b) => a._price - b._price);
  }, [stations, selectedFuel, sortMode, userLocation]);

  const handleStationClick = useCallback((station: Station) => {
    searchStore.setState((s) => ({ ...s, selectedStation: station }));
  }, []);

  const handleCloseStation = useCallback(() => {
    searchStore.setState((s) => ({ ...s, selectedStation: null }));
  }, []);

  const fuelTypeName = FUEL_TYPES[Number(selectedFuel)] || 'Gasóleo simples';

  return (
    <div className="mx-auto max-w-7xl overflow-hidden px-4 py-6 sm:px-6">
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            size="sm"
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Filtros
          </Button>
          <Button
            onClick={locateMe}
            variant={hasSearched ? 'outline' : 'primary'}
            size="sm"
            disabled={isLocating}
          >
            <LocateFixed className={`mr-1.5 h-3.5 w-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
            {isLocating ? 'A localizar...' : 'Perto de mim'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <SearchFilters
              selectedDistrict={selectedDistrict}
              selectedFuel={selectedFuel}
              selectedBrand={selectedBrand}
              onDistrictChange={setSelectedDistrict}
              onFuelChange={setSelectedFuel}
              onBrandChange={setSelectedBrand}
              onSearch={searchStations}
              onLocateMe={locateMe}
              isLocating={isLocating}
              brands={brands}
            />
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-[500px] w-full rounded-xl" />
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {!loading && hasSearched && stations.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {stations.length} postos
            </h2>
            <Badge variant="outline">{getFuelShortName(fuelTypeName)}</Badge>
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => searchStore.setState((s) => ({ ...s, sortMode: 'price' }))}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sortMode === 'price'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                Preço
              </button>
              {userLocation && (
                <button
                  onClick={() => searchStore.setState((s) => ({ ...s, sortMode: 'distance' }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    sortMode === 'distance'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  Distância
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <StationMap
              stations={stations}
              userLocation={userLocation}
              selectedFuel={fuelTypeName}
              selectedStationId={selectedStation?.Id ?? null}
              onStationClick={handleStationClick}
            />
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedStations.map((station) => (
              <StationCard
                key={station.Id}
                station={station}
                userLocation={userLocation}
                selectedFuel={fuelTypeName}
              />
            ))}
          </div>
        </>
      )}

      {!loading && hasSearched && stations.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Fuel className="mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            Nenhum posto encontrado. Tente alterar os filtros.
          </p>
        </div>
      )}

      {!loading && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            Toque em <strong>Perto de mim</strong> para ver os postos mais baratos na sua zona.
          </p>
        </div>
      )}

      <StationDrawer station={selectedStation} onClose={handleCloseStation} />
    </div>
  );
}
