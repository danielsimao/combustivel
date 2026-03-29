'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Station } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getFuelShortName, getFuelColor, formatDateTime } from '@/lib/utils';
import {
  MapPin,
  Clock,
  Navigation,
  Phone,
  Fuel,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function StationDetailPage() {
  const params = useParams();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/dgeg/posto?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.resultado) {
          setStation(data.resultado);
        } else if (data.Id) {
          setStation(data);
        } else {
          setError('Posto não encontrado.');
        }
      })
      .catch(() => setError('Erro ao carregar dados do posto.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const copyAddress = () => {
    if (station?.Morada) {
      navigator.clipboard.writeText(`${station.Morada}, ${station.Localidade}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openDirections = () => {
    if (station) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${station.Latitude},${station.Longitude}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-6 h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <Fuel className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
        <h2 className="text-lg font-semibold text-zinc-700">{error || 'Posto não encontrado'}</h2>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Voltar à pesquisa
        </Link>
      </div>
    );
  }

  const sortedFuels = [...(station.Combustiveis || [])].sort(
    (a, b) => parseFloat(a.Preco?.replace(',', '.') || '0') - parseFloat(b.Preco?.replace(',', '.') || '0')
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à pesquisa
      </Link>

      {/* Station header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {station.Nome}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{station.Marca}</Badge>
              {station.TipoPosto && (
                <Badge variant="outline">{station.TipoPosto}</Badge>
              )}
              {station.Distrito && (
                <Badge variant="outline">{station.Distrito}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
            {station.Morada}, {station.Localidade}
            {station.CodPostal && ` - ${station.CodPostal}`}
          </p>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado!' : 'Copiar morada'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={openDirections} variant="primary" size="sm">
            <Navigation className="mr-2 h-4 w-4" />
            Direções
          </Button>
          <Button
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${station.Latitude},${station.Longitude}`,
                '_blank'
              )
            }
            variant="outline"
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver no Google Maps
          </Button>
        </div>
      </div>

      {/* Fuel prices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-blue-600" />
            Preços dos Combustíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedFuels.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sortedFuels.map((fuel) => (
                <div
                  key={fuel.TipoCombustivel}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getFuelColor(fuel.TipoCombustivel) }}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {fuel.TipoCombustivel}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {getFuelShortName(fuel.TipoCombustivel)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                      {fuel.Preco}
                    </p>
                    {fuel.DataAtualizacao && (
                      <p className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(fuel.DataAtualizacao)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Sem informação de preços disponível.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Map preview */}
      {station.Latitude && station.Longitude && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg">
              <iframe
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${station.Longitude - 0.01},${station.Latitude - 0.005},${station.Longitude + 0.01},${station.Latitude + 0.005}&layer=mapnik&marker=${station.Latitude},${station.Longitude}`}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Coordenadas: {station.Latitude.toFixed(6)}, {station.Longitude.toFixed(6)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
