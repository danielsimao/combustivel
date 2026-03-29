import { NextResponse } from 'next/server';
import { scrapePredictions } from '@/lib/scrape-predictions';

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  try {
    const data = await scrapePredictions();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error in prediction API:', error);
    return NextResponse.json(
      { error: 'Erro ao obter previsões', predictions: [], scrapedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
