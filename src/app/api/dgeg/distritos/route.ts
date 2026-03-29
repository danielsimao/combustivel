import { getDistritos } from '@/lib/dgeg';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getDistritos();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching distritos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar distritos' },
      { status: 500 }
    );
  }
}
