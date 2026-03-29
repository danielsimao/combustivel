import { NextRequest, NextResponse } from 'next/server';
import { getPrecoMedioDiario } from '@/lib/dgeg';
import { saveDailyAverage } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getPrecoMedioDiario();
    const today = new Date().toISOString().split('T')[0];

    if (data && Array.isArray(data)) {
      for (const item of data) {
        if (item.TipoCombustivel && item.PrecoMedio) {
          await saveDailyAverage(
            today,
            item.TipoCombustivel,
            parseFloat(String(item.PrecoMedio).replace(',', '.'))
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      records: data?.length || 0,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Erro no cron job' },
      { status: 500 }
    );
  }
}
