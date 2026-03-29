import { pesquisarPostos } from '@/lib/dgeg';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const data = await pesquisarPostos({
      idsTiposComb: searchParams.get('idsTiposComb') || undefined,
      idMarca: searchParams.get('idMarca') || undefined,
      idTipoPosto: searchParams.get('idTipoPosto') || undefined,
      idDistrito: searchParams.get('idDistrito') || undefined,
      idMunicipio: searchParams.get('idMunicipio') || undefined,
      qtdPorPagina: parseInt(searchParams.get('qtdPorPagina') || '50'),
      pagina: parseInt(searchParams.get('pagina') || '1'),
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
