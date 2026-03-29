import { getMunicipios } from '@/lib/dgeg';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idDistrito = searchParams.get('idDistrito');

  if (!idDistrito) {
    return NextResponse.json(
      { error: 'idDistrito é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const data = await getMunicipios(parseInt(idDistrito));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching municipios:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar municípios' },
      { status: 500 }
    );
  }
}
