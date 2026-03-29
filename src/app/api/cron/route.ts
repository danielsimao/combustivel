import { NextRequest, NextResponse } from 'next/server';
import { getPrecoMedioDiario } from '@/lib/dgeg';
import { saveDailyAverage } from '@/lib/supabase';
import { timingSafeEqual } from 'crypto';

function isAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(authHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getPrecoMedioDiario();
    const today = new Date().toISOString().split('T')[0];
    let saved = 0;

    if (data && Array.isArray(data)) {
      for (const item of data) {
        if (item.TipoCombustivel && item.PrecoMedio) {
          const price = parseFloat(String(item.PrecoMedio).replace(',', '.'));
          if (!isNaN(price) && price > 0) {
            await saveDailyAverage(today, item.TipoCombustivel, price);
            saved++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      records: saved,
    });
  } catch (error) {
    console.error('Cron job failed');
    return NextResponse.json(
      { error: 'Erro no cron job' },
      { status: 500 }
    );
  }
}
