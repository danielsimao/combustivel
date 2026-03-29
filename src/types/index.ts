export interface District {
  Id: number;
  Nome: string;
}

export interface Municipality {
  Id: number;
  IdDistrito: number;
  Nome: string;
}

export interface FuelType {
  Id: number;
  Descritivo: string;
  UnidadeMedida: string;
}

export interface Brand {
  Id: number;
  Nome: string;
}

export interface StationFuel {
  TipoCombustivel: string;
  Preco: string;
  DataAtualizacao: string;
}

export interface Station {
  Id: number;
  Nome: string;
  Marca: string;
  Morada: string;
  Localidade: string;
  CodPostal: string;
  Latitude: number;
  Longitude: number;
  TipoPosto: string;
  Distrito: string;
  Municipio: string;
  Combustiveis: StationFuel[];
}

export interface SearchResult {
  resultado: Station[];
  paginaAtual: number;
  totalPaginas: number;
  totalResultados: number;
}

export interface DailyAverage {
  date: string;
  fuel_type: string;
  avg_price: number;
}

export interface PricePrediction {
  week_start: string;
  week_end: string;
  fuel_type: string;
  predicted_change: number;
  predicted_price: number;
  current_price: number;
  direction: 'up' | 'down' | 'stable';
  confidence: string;
  source: string;
  recommendation: string;
}

export interface StationDistance extends Station {
  distance: number;
}

export type FuelTypeKey =
  | 'Gasóleo simples'
  | 'Gasóleo especial'
  | 'Gasóleo colorido'
  | 'Gasolina simples 95'
  | 'Gasolina especial 95'
  | 'Gasolina especial 98'
  | 'GPL Auto'
  | string;
