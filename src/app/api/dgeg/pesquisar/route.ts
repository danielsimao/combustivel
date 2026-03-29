import { pesquisarPostos } from '@/lib/dgeg';
import { NextRequest, NextResponse } from 'next/server';

function safeParseInt(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function isNumericId(value: string | null): boolean {
  if (!value) return true; // optional fields are ok
  return /^\d{1,10}$/.test(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const idsTiposComb = searchParams.get('idsTiposComb');
  const idMarca = searchParams.get('idMarca');
  const idTipoPosto = searchParams.get('idTipoPosto');
  const idDistrito = searchParams.get('idDistrito');
  const idMunicipio = searchParams.get('idMunicipio');

  // Validate numeric IDs
  if (!isNumericId(idsTiposComb) || !isNumericId(idMarca) || !isNumericId(idTipoPosto) ||
      !isNumericId(idDistrito) || !isNumericId(idMunicipio)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  try {
    const data = await pesquisarPostos({
      idsTiposComb: idsTiposComb || undefined,
      idMarca: idMarca || undefined,
      idTipoPosto: idTipoPosto || undefined,
      idDistrito: idDistrito || undefined,
      idMunicipio: idMunicipio || undefined,
      qtdPorPagina: safeParseInt(searchParams.get('qtdPorPagina'), 50, 1, 200),
      pagina: safeParseInt(searchParams.get('pagina'), 1, 1, 1000),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching postos:', error);
    return NextResponse.json(
      { error: 'Erro ao pesquisar postos' },
      { status: 500 }
    );
  }
}
