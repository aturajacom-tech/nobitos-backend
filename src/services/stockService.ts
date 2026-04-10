/**
 * Stock Service
 * Stock management with Supabase PostgreSQL
 */

import { getDatabase } from '../config/database';
import { CurrentStock, StockLedger, APIError, PaginationParams } from '../types';

export async function getCurrentStock(organizationId: string): Promise<CurrentStock[]> {
  const db = getDatabase();

  const stock = await db`
    SELECT cs.id, cs.organization_id, cs.item_id, cs.quantity, cs.updated_at,
           i.sku, i.name as item_name, i.unit, i.item_type, i.item_condition
    FROM current_stock cs
    JOIN items i ON cs.item_id = i.id
    WHERE cs.organization_id = ${organizationId}
    ORDER BY i.name ASC
  `;

  return stock as any[];
}

export async function getStockHistory(organizationId: string, params: PaginationParams): Promise<{ items: StockLedger[], total: number }> {
  const db = getDatabase();

  const [countResult] = await db`
    SELECT COUNT(*)::int as total
    FROM stock_ledger
    WHERE organization_id = ${organizationId}
  `;

  const items = await db`
    SELECT sl.id, sl.organization_id, sl.item_id, sl.transaction_type,
           sl.quantity, sl.reference_id, sl.reference_type,
           sl.recorded_by, sl.notes, sl.created_at,
           i.name as item_name, i.sku, i.unit,
           u.full_name as recorded_by_name
    FROM stock_ledger sl
    JOIN items i ON sl.item_id = i.id
    LEFT JOIN users u ON sl.recorded_by = u.id
    WHERE sl.organization_id = ${organizationId}
    ORDER BY sl.created_at DESC
    LIMIT ${params.per_page}
    OFFSET ${params.offset}
  `;

  return {
    items: items as unknown as StockLedger[],
    total: countResult.total
  };
}

export async function getItemStockHistory(itemId: string, organizationId: string): Promise<StockLedger[]> {
  const db = getDatabase();

  const history = await db`
    SELECT sl.id, sl.organization_id, sl.item_id, sl.transaction_type,
           sl.quantity, sl.reference_id, sl.reference_type,
           sl.recorded_by, sl.notes, sl.created_at,
           u.full_name as recorded_by_name
    FROM stock_ledger sl
    LEFT JOIN users u ON sl.recorded_by = u.id
    WHERE sl.item_id = ${itemId}
      AND sl.organization_id = ${organizationId}
    ORDER BY sl.created_at DESC
    LIMIT 100
  `;

  return history as unknown as StockLedger[];
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
  await db`
    INSERT INTO stock_ledger (organization_id, item_id, transaction_type, quantity, reference_id, recorded_by, notes)
    VALUES (${organizationId}, ${itemId}, ${transactionType}, ${quantity}, ${referenceId || null}, ${recordedBy}, ${notes || null})
  `;

  // Update current_stock (upsert)
  await db`
    INSERT INTO current_stock (organization_id, item_id, quantity)
    VALUES (${organizationId}, ${itemId}, ${quantity})
    ON CONFLICT (organization_id, item_id)
    DO UPDATE SET
      quantity = current_stock.quantity + ${quantity},
      updated_at = NOW()
  `;
}

export async function getStockLevel(organizationId: string, itemId: string): Promise<number> {
  const db = getDatabase();
  const result = await db`
    SELECT quantity FROM current_stock
    WHERE organization_id = ${organizationId} AND item_id = ${itemId}
    LIMIT 1
  `;
  return result.length > 0 ? result[0].quantity : 0;
}
