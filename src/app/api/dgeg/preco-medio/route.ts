import { getPrecoMedioDiario } from '@/lib/dgeg';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getPrecoMedioDiario();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching preço médio:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar preço médio diário' },
      { status: 500 }
    );
  }
}
