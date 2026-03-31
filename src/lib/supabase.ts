import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = getClient();

export async function getDailyAverages(fuelType: string, days: number = 90) {
  if (!supabase) return [];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data, error } = await supabase
    .from('daily_averages')
    .select('*')
    .eq('fuel_type', fuelType)
    .gte('date', fromDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily averages:', error);
    return [];
  }
  return data || [];
}

export async function getLatestPredictions() {
  if (!supabase) return [];

  // Get the most recent week_start, then fetch only those rows
  const { data: latest, error: latestErr } = await supabase
    .from('price_predictions')
    .select('week_start')
    .order('week_start', { ascending: false })
    .limit(1);

  if (latestErr || !latest || latest.length === 0) {
    if (latestErr) console.error('Error fetching predictions:', latestErr);
    return [];
  }

  const { data, error } = await supabase
    .from('price_predictions')
    .select('*')
    .eq('week_start', latest[0].week_start)
    .order('fuel_type', { ascending: true });

  if (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
  return data || [];
}

export async function saveDailyAverage(
  date: string,
  fuelType: string,
  avgPrice: number
) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping save');
    return;
  }

  const { error } = await supabase
    .from('daily_averages')
    .upsert(
      { date, fuel_type: fuelType, avg_price: avgPrice },
      { onConflict: 'date,fuel_type' }
    );

  if (error) {
    console.error('Error saving daily average:', error);
  }
}

export async function savePrediction(prediction: {
  week_start: string;
  week_end: string;
  fuel_type: string;
  predicted_change: number;
  predicted_price: number;
  current_price: number;
  direction: string;
  confidence: string;
  source: string;
  recommendation: string;
}) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping save');
    return;
  }

  const { error } = await supabase
    .from('price_predictions')
    .upsert(prediction, { onConflict: 'week_start,fuel_type' });

  if (error) {
    console.error('Error saving prediction:', error);
  }
}
