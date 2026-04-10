/**
 * Stock Service — Supabase client version
 */

import { getDatabase } from '../config/database';
import { CurrentStock, StockLedger, APIError, PaginationParams } from '../types';

export async function getCurrentStock(organizationId: string): Promise<any[]> {
  const db = getDatabase();

  const { data, error } = await db
    .from('current_stock')
    .select(`
      id, organization_id, item_id, quantity, updated_at,
      items (sku, name, unit, item_type, item_condition)
    `)
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false });

  if (error) throw new APIError(500, 'DB_ERROR', error.message);
  return data || [];
}

export async function getStockHistory(organizationId: string, params: PaginationParams): Promise<{ items: any[], total: number }> {
  const db = getDatabase();

  const { count } = await db
    .from('stock_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  const { data, error } = await db
    .from('stock_ledger')
    .select(`
      id, organization_id, item_id, transaction_type,
      quantity, reference_id, reference_type, recorded_by, notes, created_at,
      items (name, sku, unit),
      users (full_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.per_page - 1);

  if (error) throw new APIError(500, 'DB_ERROR', error.message);
  return { items: data || [], total: count || 0 };
}

export async function getItemStockHistory(itemId: string, organizationId: string): Promise<any[]> {
  const db = getDatabase();

  const { data, error } = await db
    .from('stock_ledger')
    .select(`
      id, organization_id, item_id, transaction_type,
      quantity, reference_id, reference_type, recorded_by, notes, created_at,
      users (full_name)
    `)
    .eq('item_id', itemId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new APIError(500, 'DB_ERROR', error.message);
  return data || [];
}

export async function recordStockMovement(
  organizationId: string,
  itemId: string,
  transactionType: string,
  quantity: number,
  recordedBy: string,
  referenceId?: string,
  notes?: string
): Promise<void> {
  const db = getDatabase();

  // Insert ledger entry
  await db.from('stock_ledger').insert({
    organization_id: organizationId,
    item_id: itemId,
    transaction_type: transactionType,
    quantity,
    reference_id: referenceId || null,
    recorded_by: recordedBy,
    notes: notes || null
  });

  // Upsert current_stock
  const { data: existing } = await db
    .from('current_stock')
    .select('id, quantity')
    .eq('organization_id', organizationId)
    .eq('item_id', itemId)
    .single();

  if (existing) {
    await db
      .from('current_stock')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
  } else {
    await db.from('current_stock').insert({
      organization_id: organizationId,
      item_id: itemId,
      quantity
    });
  }
}

export async function getStockLevel(organizationId: string, itemId: string): Promise<number> {
  const db = getDatabase();
  const { data } = await db
    .from('current_stock')
    .select('quantity')
    .eq('organization_id', organizationId)
    .eq('item_id', itemId)
    .single();
  return data?.quantity || 0;
}
