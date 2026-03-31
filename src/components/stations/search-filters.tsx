'use client';

import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DISTRICTS, FUEL_TYPES, MAIN_FUEL_TYPES } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Search, LocateFixed, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface SearchFiltersProps {
  selectedDistrict: string;
  selectedFuel: string;
  selectedBrand: string;
  onDistrictChange: (v: string) => void;
  onFuelChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onSearch: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  brands: { Id: number; Nome: string }[];
}

export function SearchFilters({
  selectedDistrict,
  selectedFuel,
  selectedBrand,
  onDistrictChange,
  onFuelChange,
  onBrandChange,
  onSearch,
  onLocateMe,
  isLocating,
  brands,
}: SearchFiltersProps) {
  const [showMore, setShowMore] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t('map.fuel')}
          </label>
          <Select value={selectedFuel} onChange={(e) => onFuelChange(e.target.value)}>
            {Object.entries(FUEL_TYPES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t('map.district')}
          </label>
          <Select value={selectedDistrict} onChange={(e) => onDistrictChange(e.target.value)}>
            <option value="">{t('map.allDistricts')}</option>
            {Object.entries(DISTRICTS).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <Button onClick={onLocateMe} variant="outline" size="md" disabled={isLocating}>
          <LocateFixed className={`mr-2 h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
          {isLocating ? t('map.locating') : t('map.nearMe')}
        </Button>

        <Button
          onClick={() => setShowMore(!showMore)}
          variant="ghost"
          size="md"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {t('map.filters')}
        </Button>

        <Button onClick={onSearch} variant="primary" size="md">
          <Search className="mr-2 h-4 w-4" />
          {t('map.search')}
        </Button>
      </div>

      {showMore && (
        <div className="flex flex-wrap gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {t('map.brand')}
            </label>
            <Select value={selectedBrand} onChange={(e) => onBrandChange(e.target.value)}>
              <option value="">{t('map.allBrands')}</option>
              {brands.map((b) => (
                <option key={b.Id} value={String(b.Id)}>
                  {b.Nome}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
