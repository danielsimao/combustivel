import { getTiposCombustivel } from '@/lib/dgeg';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getTiposCombustivel();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tipos combustível:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar tipos de combustível' },
      { status: 500 }
    );
  }
}
