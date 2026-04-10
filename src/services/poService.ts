/**
 * Purchase Order Service
 * PO business logic with Supabase PostgreSQL
 */

import { getDatabase } from '../config/database';
import { PurchaseOrder, POStatus, CreatePORequest, POItem, APIError } from '../types';

export async function createPurchaseOrder(req: CreatePORequest, createdBy: string): Promise<PurchaseOrder> {
  if (!req.po_number || !req.supplier_id || !req.items || req.items.length === 0) {
    throw new APIError(400, 'INVALID_INPUT', 'Missing required PO fields: po_number, supplier_id, items');
  }

  const db = getDatabase();

  // Check PO number uniqueness
  const existing = await db`SELECT id FROM purchase_orders WHERE po_number = ${req.po_number} LIMIT 1`;
  if (existing.length > 0) {
    throw new APIError(409, 'PO_NUMBER_EXISTS', `PO number ${req.po_number} already exists`);
  }

  // Calculate total amount from items
  const totalAmount = req.items.reduce((sum, item) => {
    return sum + (item.quantity * (item.unit_price || 0));
  }, 0);

  // Insert PO
  const [po] = await db`
    INSERT INTO purchase_orders (po_number, supplier_id, status, total_amount, created_by)
    VALUES (${req.po_number}, ${req.supplier_id}, ${POStatus.DRAFT}, ${req.total_amount || totalAmount}, ${createdBy})
    RETURNING id, po_number, supplier_id, status, total_amount, created_by, created_at, updated_at
  `;

  // Insert PO items
  if (req.items.length > 0) {
    for (const item of req.items) {
      const subtotal = item.quantity * (item.unit_price || 0);
      await db`
        INSERT INTO po_items (po_id, item_id, quantity, unit_price, subtotal)
        VALUES (${po.id}, ${item.item_id}, ${item.quantity}, ${item.unit_price || null}, ${subtotal || null})
      `;
    }
  }

  return po as PurchaseOrder;
}

export async function listPurchaseOrders(organizationId: string, status?: string): Promise<PurchaseOrder[]> {
  const db = getDatabase();

  if (status) {
    const pos = await db`
      SELECT po.id, po.po_number, po.supplier_id, po.status, po.total_amount,
             po.created_by, po.confirmed_at, po.completed_at, po.created_at, po.updated_at
      FROM purchase_orders po
      JOIN users u ON po.created_by = u.id
      WHERE u.organization_id = ${organizationId}
        AND po.status = ${status}
      ORDER BY po.created_at DESC
    `;
    return pos as unknown as PurchaseOrder[];
  } else {
    const pos = await db`
      SELECT po.id, po.po_number, po.supplier_id, po.status, po.total_amount,
             po.created_by, po.confirmed_at, po.completed_at, po.created_at, po.updated_at
      FROM purchase_orders po
      JOIN users u ON po.created_by = u.id
      WHERE u.organization_id = ${organizationId}
      ORDER BY po.created_at DESC
    `;
    return pos as unknown as PurchaseOrder[];
  }
}

export async function getPurchaseOrderById(poId: string): Promise<PurchaseOrder | null> {
  const db = getDatabase();

  const pos = await db`
    SELECT id, po_number, supplier_id, status, total_amount,
           created_by, confirmed_at, completed_at, created_at, updated_at
    FROM purchase_orders
    WHERE id = ${poId}
    LIMIT 1
  `;

  if (pos.length === 0) return null;

  const po = pos[0] as PurchaseOrder;

  // Fetch PO items
  const items = await db`
    SELECT id, po_id, item_id, quantity, unit_price, subtotal, received_qty, created_at
    FROM po_items
    WHERE po_id = ${poId}
    ORDER BY created_at ASC
  `;

  return { ...po, items } as any;
}

export async function confirmPurchaseOrder(poId: string): Promise<PurchaseOrder> {
  const db = getDatabase();

  const pos = await db`SELECT id, status FROM purchase_orders WHERE id = ${poId} LIMIT 1`;
  if (pos.length === 0) {
    throw new APIError(404, 'PO_NOT_FOUND', 'Purchase order not found');
  }

  if (pos[0].status === POStatus.CONFIRMED || pos[0].status === POStatus.COMPLETED) {
    throw new APIError(400, 'INVALID_STATE', `PO is already ${pos[0].status}`);
  }

  const [updated] = await db`
    UPDATE purchase_orders
    SET status = ${POStatus.CONFIRMED}, confirmed_at = NOW(), updated_at = NOW()
    WHERE id = ${poId}
    RETURNING id, po_number, supplier_id, status, total_amount, created_by, confirmed_at, completed_at, created_at, updated_at
  `;

  return updated as PurchaseOrder;
}

export async function getPOItems(poId: string): Promise<POItem[]> {
  const db = getDatabase();
  const items = await db`
    SELECT id, po_id, item_id, quantity, unit_price, subtotal, received_qty, created_at
    FROM po_items
    WHERE po_id = ${poId}
    ORDER BY created_at ASC
  `;
  return items as unknown as POItem[];
}
