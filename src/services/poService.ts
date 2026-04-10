/**
 * Purchase Order Service — Supabase client version
 */

import { getDatabase } from '../config/database';
import { PurchaseOrder, POStatus, CreatePORequest, POItem, APIError } from '../types';

export async function createPurchaseOrder(req: CreatePORequest, createdBy: string): Promise<PurchaseOrder> {
  if (!req.po_number || !req.supplier_id || !req.items || req.items.length === 0) {
    throw new APIError(400, 'INVALID_INPUT', 'Missing required fields: po_number, supplier_id, items');
  }

  const db = getDatabase();

  // Check PO number uniqueness
  const { data: existing } = await db.from('purchase_orders').select('id').eq('po_number', req.po_number).limit(1);
  if (existing && existing.length > 0) {
    throw new APIError(409, 'PO_NUMBER_EXISTS', `PO number ${req.po_number} already exists`);
  }

  const totalAmount = req.items.reduce((sum, item) => sum + item.quantity * (item.unit_price || 0), 0);

  const { data: po, error } = await db
    .from('purchase_orders')
    .insert({
      po_number: req.po_number,
      supplier_id: req.supplier_id,
      status: POStatus.DRAFT,
      total_amount: req.total_amount || totalAmount,
      created_by: createdBy
    })
    .select()
    .single();

  if (error || !po) {
    throw new APIError(500, 'CREATE_PO_ERROR', error?.message || 'Failed to create PO');
  }

  // Insert PO items
  if (req.items.length > 0) {
    const items = req.items.map(item => ({
      po_id: po.id,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_price: item.unit_price || null,
      subtotal: item.quantity * (item.unit_price || 0) || null
    }));
    const { error: itemsError } = await db.from('po_items').insert(items);
    if (itemsError) console.error('Failed to insert PO items:', itemsError.message);
  }

  return po as PurchaseOrder;
}

export async function listPurchaseOrders(organizationId: string, status?: string): Promise<PurchaseOrder[]> {
  const db = getDatabase();

  // Get user IDs in this organization
  const { data: users } = await db.from('users').select('id').eq('organization_id', organizationId);
  const userIds = (users || []).map((u: any) => u.id);

  if (userIds.length === 0) return [];

  let query = db
    .from('purchase_orders')
    .select('id, po_number, supplier_id, status, total_amount, created_by, confirmed_at, completed_at, created_at, updated_at')
    .in('created_by', userIds)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new APIError(500, 'DB_ERROR', error.message);
  return (data || []) as PurchaseOrder[];
}

export async function getPurchaseOrderById(poId: string): Promise<any> {
  const db = getDatabase();

  const { data: po, error } = await db
    .from('purchase_orders')
    .select(`
      id, po_number, supplier_id, status, total_amount,
      created_by, confirmed_at, completed_at, created_at, updated_at,
      po_items (id, item_id, quantity, unit_price, subtotal, received_qty, created_at)
    `)
    .eq('id', poId)
    .single();

  if (error || !po) return null;
  return po;
}

export async function confirmPurchaseOrder(poId: string): Promise<PurchaseOrder> {
  const db = getDatabase();

  const { data: existing } = await db.from('purchase_orders').select('id, status').eq('id', poId).single();
  if (!existing) throw new APIError(404, 'PO_NOT_FOUND', 'Purchase order not found');
  if (existing.status === POStatus.CONFIRMED || existing.status === POStatus.COMPLETED) {
    throw new APIError(400, 'INVALID_STATE', `PO is already ${existing.status}`);
  }

  const { data: updated, error } = await db
    .from('purchase_orders')
    .update({ status: POStatus.CONFIRMED, confirmed_at: new Date().toISOString() })
    .eq('id', poId)
    .select()
    .single();

  if (error || !updated) throw new APIError(500, 'DB_ERROR', error?.message || 'Failed to confirm PO');
  return updated as PurchaseOrder;
}

export async function getPOItems(poId: string): Promise<POItem[]> {
  const db = getDatabase();
  const { data } = await db.from('po_items').select('*').eq('po_id', poId).order('created_at');
  return (data || []) as POItem[];
}
