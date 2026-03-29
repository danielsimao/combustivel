import { getDadosPosto } from '@/lib/dgeg';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !/^\d{1,10}$/.test(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  try {
    const data = await getDadosPosto(parseInt(id, 10));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching posto:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar posto' },
      { status: 500 }
    );
  }
}
