'use server'

import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import { revalidatePath } from 'next/cache';
import { findParentProduct, getEffectiveOptInProductId } from '@/lib/productHierarchy';
import { sendAthletePush } from '@/lib/pushNotifications';

export async function toggleExemption(athleteId: string, productId: string, isExempt: boolean) {
  const { permissions } = await checkAdminPermission();
  if (!permissions.includes('manage_catalog') && !permissions.includes('view_finances')) {
    return { error: 'No autorizado para modificar exoneraciones' };
  }

  const supabase = getServiceSupabase();
  
  if (isExempt) {
    const { error } = await supabase
      .from('athlete_exemptions')
      .insert({ athlete_id: athleteId, product_id: productId });
      
    if (error && error.code !== '23505') {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('athlete_exemptions')
      .delete()
      .match({ athlete_id: athleteId, product_id: productId });
      
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath(`/admin/athletes/${athleteId}`);
  revalidatePath('/admin/ledger');
  return { success: true };
}

export async function toggleAthleteAlliance(athleteId: string, hasAlliance: boolean) {
  const { permissions } = await checkAdminPermission();
  if (!permissions.includes('manage_catalog') && !permissions.includes('view_finances')) {
    return { error: 'No autorizado para modificar alianza' };
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('athletes')
    .update({ has_alliance: hasAlliance })
    .eq('id', athleteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/athletes/${athleteId}`);
  revalidatePath('/admin/athletes');
  return { success: true };
}

/**
 * Inscribe o retira manualmente a una jugadora de un torneo / liga en athlete_product_opt_ins.
 */
export async function toggleTournamentEnrollment(
  athleteId: string, 
  productId: string, 
  isEnrolled: boolean
) {
  const { permissions } = await checkAdminPermission();
  if (!permissions.includes('manage_catalog') && !permissions.includes('view_finances')) {
    return { error: 'No autorizado para gestionar convocatorias de torneos.' };
  }

  const supabase = getServiceSupabase();

  if (isEnrolled) {
    const { error } = await supabase
      .from('athlete_product_opt_ins')
      .upsert(
        { athlete_id: athleteId, product_id: productId }, 
        { onConflict: 'athlete_id,product_id' }
      );

    if (error && error.code !== '23505') {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('athlete_product_opt_ins')
      .delete()
      .match({ athlete_id: athleteId, product_id: productId });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath(`/admin/athletes/${athleteId}`);
  revalidatePath('/admin');
  revalidatePath('/admin/ledger');
  revalidatePath('/portal/dashboard');
  revalidatePath('/portal/dashboard/pagos');
  return { success: true };
}

export interface RecordManualPaymentParams {
  athleteId: string;
  productId: string;
  amount: number;
  rateType?: 'USD' | 'EUR';
  method: string;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

/**
 * Registra un abono o pago manual cargado por el administrador.
 * CRÍTICO: Si el producto requiere opt-in (o deriva de un torneo padre),
 * marca AUTOMÁTICAMENTE a la jugadora en TRUE en athlete_product_opt_ins.
 */
export async function recordManualPayment(params: RecordManualPaymentParams) {
  const { permissions } = await checkAdminPermission();
  if (!permissions.includes('manage_catalog') && !permissions.includes('view_finances')) {
    return { error: 'No autorizado para registrar pagos o abonos.' };
  }

  const { athleteId, productId, amount, rateType = 'USD', method, paymentDate, reference, notes } = params;

  if (!athleteId) return { error: 'ID de atleta inválido.' };
  if (!productId) return { error: 'Debes seleccionar un producto válido.' };
  if (!amount || Number(amount) <= 0) return { error: 'El monto a abonar debe ser mayor a 0.' };
  if (!method || !method.trim()) return { error: 'Debes especificar el método de pago.' };

  const supabase = getServiceSupabase();

  // 1. Obtener producto seleccionado
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (prodErr || !product) {
    return { error: 'Producto no encontrado.' };
  }

  // 2. Obtener productos activos para resolución de jerarquía de torneos
  const { data: allActiveProducts } = await supabase
    .from('products')
    .select('id, name, description, price, categories, requires_opt_in, parent_product_id')
    .eq('is_active', true);

  // 3. REQUISITO INDISPENSABLE: Si es torneo o producto derivado con opt-in, marcar en true
  const effOptInId = getEffectiveOptInProductId(product, allActiveProducts || []);
  const targetOptInId = effOptInId || (product.requires_opt_in ? product.id : null);

  if (targetOptInId) {
    // Upsert para asegurar que la atleta quede confirmada e inscrita
    const { error: optInError } = await supabase
      .from('athlete_product_opt_ins')
      .upsert(
        { athlete_id: athleteId, product_id: targetOptInId },
        { onConflict: 'athlete_id,product_id' }
      );

    if (optInError && optInError.code !== '23505') {
      console.error('Error auto-confirmando opt-in de torneo:', optInError);
    }

    // Si el producto seleccionado también tiene flag directa y es distinto al target, registrarlo también
    if (product.requires_opt_in && product.id !== targetOptInId) {
      await supabase
        .from('athlete_product_opt_ins')
        .upsert(
          { athlete_id: athleteId, product_id: product.id },
          { onConflict: 'athlete_id,product_id' }
        );
    }
  }

  // 4. Registrar el pago en la tabla payments
  const nowIso = paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString();
  const concept = notes ? `${product.name} - ${notes.trim()}` : product.name;

  const { data: newPayment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      athlete_id: athleteId,
      product_id: productId,
      amount: Number(amount),
      currency: 'USD',
      rate_type: rateType || 'USD',
      method: method.trim(),
      concept: concept,
      status: 'Completado', // Pagos manuales del admin se asumen verificados
      reference_number: reference ? reference.trim() : null,
      created_at: nowIso
    })
    .select()
    .single();

  if (paymentError || !newPayment) {
    return { error: paymentError?.message || 'Error al registrar el pago en el sistema.' };
  }

  // 5. Si es mensualidad, actualizar estatus del atleta y paid_until
  if (product.name.toLowerCase().includes('mensualidad')) {
    const { data: athlete } = await supabase.from('athletes').select('paid_until').eq('id', athleteId).single();
    
    let nextDate: Date;
    if (product.end_date) {
      const productEndDate = new Date(product.end_date);
      if (!athlete?.paid_until || productEndDate > new Date(athlete.paid_until)) {
        nextDate = productEndDate;
      } else {
        nextDate = new Date(athlete.paid_until);
      }
    } else {
      let monthsPaid = 1;
      if (Number(product.price) > 0) {
        monthsPaid = Math.floor(Number(amount) / Number(product.price));
        if (monthsPaid < 1) monthsPaid = 1;
      }

      if (athlete?.paid_until) {
        nextDate = new Date(athlete.paid_until);
        nextDate.setMonth(nextDate.getMonth() + monthsPaid);
      } else {
        nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + monthsPaid);
        nextDate.setDate(0);
      }
    }

    const today = new Date();
    const isSolventeNow = nextDate.getFullYear() > today.getFullYear() || 
                         (nextDate.getFullYear() === today.getFullYear() && nextDate.getMonth() >= today.getMonth());

    await supabase
      .from('athletes')
      .update({ 
        status: isSolventeNow ? 'Solvente' : 'Moroso',
        paid_until: nextDate.toISOString().split('T')[0]
      })
      .eq('id', athleteId);
  }

  // 6. Notificación push si la atleta está vinculada
  sendAthletePush(athleteId, {
    title: '¡Abono Registrado! 💳',
    body: `Se ha registrado un abono de $${Number(amount).toFixed(2)} para "${product.name}".`,
    url: '/portal/dashboard/pagos',
  }).catch((err) => console.error('Push error:', err));

  // 7. Revalidar todas las pantallas relevantes
  revalidatePath(`/admin/athletes/${athleteId}`);
  revalidatePath('/admin');
  revalidatePath('/admin/ledger');
  revalidatePath('/admin/payments');
  revalidatePath('/portal/dashboard');
  revalidatePath('/portal/dashboard/pagos');

  return { success: true, paymentId: newPayment.id };
}


