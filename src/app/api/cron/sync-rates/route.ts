import { syncRates } from '@/lib/exchangeRate';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await syncRates();

    if (!res.success) {
      console.error('Error al sincronizar tasas vía cron:', res.error);
      return NextResponse.json({ error: res.error }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Tasas oficiales sincronizadas con éxito.',
      data: res.result
    });
  } catch (error: any) {
    console.error('Excepción en cron sync-rates:', error);
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

