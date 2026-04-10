/**
 * Delivery Order Service — Supabase client version
 */

import { getDatabase } from '../config/database';
import { CreateDeliveryRequest, APIError } from '../types';

export async function createDeliveryOrder(req: CreateDeliveryRequest, createdBy: string): Promise<any> {
  const db = getDatabase();

  const { data: delivery, error } = await db
    .from('delivery_orders')
    .insert({
      delivery_number: req.delivery_number,
      from_org_id: req.from_org_id,
      to_org_id: req.to_org_id,
      po_id: req.po_id || null,
      status: 'pending',
      created_by: createdBy
    })
    .select()
    .single();

  if (error || !delivery) {
    throw new APIError(500, 'CREATE_DELIVERY_ERROR', error?.message || 'Failed to create delivery');
  }

  if (req.items && req.items.length > 0) {
    const items = req.items.map(item => ({
      delivery_id: delivery.id,
      item_id: item.item_id,
      quantity: item.quantity
    }));
    await db.from('delivery_items').insert(items);
  }

  return delivery;
}

export async function listDeliveryOrders(organizationId: string, status?: string): Promise<any[]> {
  const db = getDatabase();

  let query = db
    .from('delivery_orders')
    .select('id, delivery_number, from_org_id, to_org_id, status, po_id, created_by, delivered_at, created_at, updated_at')
    .or(`from_org_id.eq.${organizationId},to_org_id.eq.${organizationId}`)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new APIError(500, 'DB_ERROR', error.message);
  return data || [];
}

export async function getDeliveryById(id: string): Promise<any> {
  const db = getDatabase();

  const { data, error } = await db
    .from('delivery_orders')
    .select(`
      id, delivery_number, from_org_id, to_org_id, status,
      po_id, created_by, delivered_at, created_at, updated_at,
      delivery_items (id, item_id, quantity, received_qty, created_at)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function confirmDeliveryReceipt(id: string): Promise<any> {
  const db = getDatabase();

  const { data: existing } = await db.from('delivery_orders').select('id, status').eq('id', id).single();
  if (!existing) throw new APIError(404, 'NOT_FOUND', 'Delivery order not found');

  const { data: updated, error } = await db
    .from('delivery_orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) throw new APIError(500, 'DB_ERROR', error?.message || 'Failed to confirm delivery');
  return updated;
}
