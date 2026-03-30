import { Store } from '@tanstack/store';
import { Station } from '@/types';

interface SearchState {
  selectedDistrict: string;
  selectedFuel: string;
  selectedBrand: string;
  hasSearched: boolean;
  userLocation: { lat: number; lng: number } | null;
  selectedStation: Station | null;
}

export const searchStore = new Store<SearchState>({
  selectedDistrict: '',
  selectedFuel: '2101',
  selectedBrand: '',
  hasSearched: false,
  userLocation: null,
  selectedStation: null,
});
