'use server'

import { syncRates, saveManualRate } from '@/lib/exchangeRate';
import { revalidatePath } from 'next/cache';

/**
 * Ejecuta manualmente la sincronización de tasas oficiales (BCV -> Fallback DolarApi).
 */
export async function syncRatesNow() {
  try {
    const res = await syncRates();

    if (!res.success) {
      return { error: res.error || 'Error al sincronizar tasas oficiales.' };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/admin/rates');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/ledger');
    revalidatePath('/portal/dashboard/pagos');

    return { 
      success: true, 
      result: res.result 
    };
  } catch (error: any) {
    return { error: error?.message || 'Error inesperado durante la sincronización.' };
  }
}

/**
 * Guarda manualmente una tasa oficial como fallback administrativo.
 */
export async function saveManualRateAction(formData: FormData) {
  const dateRate = formData.get('date_rate') as string;
  const usdRate = Number(formData.get('usd_rate'));
  const eurRate = Number(formData.get('eur_rate'));

  if (!dateRate) {
    return { error: 'Debes seleccionar la fecha correspondiente a la tasa.' };
  }

  if (isNaN(usdRate) || usdRate <= 0) {
    return { error: 'La tasa de USD debe ser un número válido mayor a 0.' };
  }

  if (isNaN(eurRate) || eurRate <= 0) {
    return { error: 'La tasa de EUR debe ser un número válido mayor a 0.' };
  }

  try {
    const res = await saveManualRate(dateRate, usdRate, eurRate);

    if (res?.error) {
      return { error: res.error };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/admin/rates');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/ledger');
    revalidatePath('/portal/dashboard/pagos');

    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Error guardando la tasa manual.' };
  }
}

