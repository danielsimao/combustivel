const BASE_URL = 'https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb';

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://precoscombustiveis.dgeg.gov.pt/',
  'Accept': 'application/json',
};

async function fetchDGEG(endpoint: string, options?: RequestInit) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`DGEG API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getDistritos() {
  return fetchDGEG('/GetDistritos');
}

export async function getMunicipios(distritoId: number) {
  return fetchDGEG(`/GetMunicipios?idDistrito=${distritoId}`);
}

export async function getMarcas() {
  return fetchDGEG('/GetMarcas');
}

export async function getTiposCombustivel() {
  return fetchDGEG('/GetTiposCombustivel');
}

export async function pesquisarPostos(params: {
  idsTiposComb?: string;
  idMarca?: string;
  idTipoPosto?: string;
  idDistrito?: string;
  idMunicipio?: string;
  qtdPorPagina?: number;
  pagina?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.idsTiposComb) searchParams.set('idsTiposComb', params.idsTiposComb);
  if (params.idMarca) searchParams.set('idMarca', params.idMarca);
  if (params.idTipoPosto) searchParams.set('idTipoPosto', params.idTipoPosto);
  if (params.idDistrito) searchParams.set('idDistrito', params.idDistrito);
  if (params.idMunicipio) searchParams.set('idMunicipio', params.idMunicipio);
  searchParams.set('qtdPorPagina', String(params.qtdPorPagina || 50));
  searchParams.set('pagina', String(params.pagina || 1));

  return fetchDGEG(`/PesquisarPostos?${searchParams.toString()}`);
}

export async function getDadosPosto(id: number) {
  return fetchDGEG(`/GetDadosPostoMapa?id=${id}&f=json`);
}

export async function getPrecoMedioDiario() {
  return fetchDGEG('/PMD');
}
