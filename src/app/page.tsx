'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { Station, Brand } from '@/types';
import { searchStore } from '@/lib/search-store';
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
  TrendingDown,
  MapPin,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

async function fetchBrands(): Promise<Brand[]> {
  const r = await fetch('/api/dgeg/marcas');
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

async function fetchStations(params: {
  selectedFuel: string;
  selectedDistrict: string;
  selectedBrand: string;
}): Promise<Station[]> {
  const searchParams = new URLSearchParams();
  if (params.selectedFuel) searchParams.set('idsTiposComb', params.selectedFuel);
  if (params.selectedDistrict) searchParams.set('idDistrito', params.selectedDistrict);
  if (params.selectedBrand) searchParams.set('idMarca', params.selectedBrand);
  searchParams.set('qtdPorPagina', '100');
  searchParams.set('pagina', '1');

  const res = await fetch(`/api/dgeg/pesquisar?${searchParams.toString()}`);
  const data = await res.json();

  if (data.erro) {
    throw new Error(data.erro);
  }

  const results = data.resultado || data || [];

  // DGEG search returns flat objects with Preco/Combustivel fields.
  // Normalize into Station shape with Combustiveis array for the map.
  return results.map((s: Record<string, unknown>) => ({
    ...s,
    Combustiveis: s.Combustivel && s.Preco
      ? [{ TipoCombustivel: s.Combustivel as string, Preco: s.Preco as string, DataAtualizacao: (s.DataAtualizacao as string) || '' }]
      : s.Combustiveis || [],
  }));
}

export default function HomePage() {
  // Read state from TanStack Store — persists across navigations
  const selectedDistrict = useStore(searchStore, (s) => s.selectedDistrict);
  const selectedFuel = useStore(searchStore, (s) => s.selectedFuel);
  const selectedBrand = useStore(searchStore, (s) => s.selectedBrand);
  const hasSearched = useStore(searchStore, (s) => s.hasSearched);
  const userLocation = useStore(searchStore, (s) => s.userLocation);
  const selectedStation = useStore(searchStore, (s) => s.selectedStation);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

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
        searchStore.setState((s) => ({
          ...s,
          selectedDistrict: '',
          userLocation: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          hasSearched: true,
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

  const sortedByPrice = useMemo(() => {
    return [...stations]
      .map((s) => {
        const fuel = s.Combustiveis?.find(
          (c) => c.TipoCombustivel === FUEL_TYPES[Number(selectedFuel)]
        );
        return { ...s, _price: fuel ? parsePrice(fuel.Preco) : Infinity };
      })
      .filter((s) => s._price < Infinity)
      .sort((a, b) => a._price - b._price);
  }, [stations, selectedFuel]);

  const handleStationClick = useCallback((station: Station) => {
    searchStore.setState((s) => ({ ...s, selectedStation: station }));
  }, []);

  const handleCloseStation = useCallback(() => {
    searchStore.setState((s) => ({ ...s, selectedStation: null }));
  }, []);

  const fuelTypeName = FUEL_TYPES[Number(selectedFuel)] || 'Gasóleo simples';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          Encontre o combustível mais barato
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Pesquise por distrito ou ative a localização para ver os postos mais
          próximos com os melhores preços.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/previsao">
          <Card className="group cursor-pointer transition-all hover:border-blue-200 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Previsão Semanal
                </p>
                <p className="text-xs text-zinc-500">
                  O preço vai descer na próxima semana?
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/estatisticas">
          <Card className="group cursor-pointer transition-all hover:border-green-200 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white">
                <Fuel className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Estatísticas
                </p>
                <p className="text-xs text-zinc-500">
                  Evolução histórica dos preços
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>
        <Card
          className="group cursor-pointer transition-all hover:border-amber-200 hover:shadow-md"
          onClick={locateMe}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Perto de Mim
              </p>
              <p className="text-xs text-zinc-500">
                Postos mais baratos na sua zona
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>
      </div>

      {/* Search Filters */}
      <Card className="mb-6">
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

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-[500px] w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && stations.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {stations.length} postos encontrados
              </h2>
              <Badge variant="outline">{getFuelShortName(fuelTypeName)}</Badge>
            </div>
            {userLocation && (
              <Badge variant="success">
                <MapPin className="mr-1 h-3 w-3" />
                Ordenado por distância
              </Badge>
            )}
          </div>

          {/* Map */}
          <div className="mb-6">
            <StationMap
              stations={stations}
              userLocation={userLocation}
              selectedFuel={fuelTypeName}
              selectedStationId={selectedStation?.Id ?? null}
              onStationClick={handleStationClick}
            />
          </div>

          {/* Top 3 cheapest */}
          {sortedByPrice.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Mais baratos ({getFuelShortName(fuelTypeName)})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedByPrice.slice(0, 3).map((station, i) => (
                  <StationCard
                    key={station.Id}
                    station={station}
                    userLocation={userLocation}
                    selectedFuel={fuelTypeName}
                    rank={i + 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All stations */}
          <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Todos os postos
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(userLocation ? stations : sortedByPrice).map((station) => (
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

      {/* Empty State */}
      {!loading && hasSearched && stations.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Fuel className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            Nenhum posto encontrado
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Tente alterar os filtros ou selecione outro distrito.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950">
            <Fuel className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            Pesquise postos de combustível
          </h3>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Selecione um distrito e tipo de combustível, ou ative a
            localização para encontrar os postos mais baratos perto de si.
          </p>
          <Button onClick={locateMe} className="mt-6" size="lg">
            <MapPin className="mr-2 h-4 w-4" />
            Usar a minha localização
          </Button>
        </div>
      )}
      <StationDrawer station={selectedStation} onClose={handleCloseStation} />
    </div>
  );
}
