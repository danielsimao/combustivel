import { getMarcas } from '@/lib/dgeg';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getMarcas();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching marcas:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar marcas' },
      { status: 500 }
    );
  }
}
