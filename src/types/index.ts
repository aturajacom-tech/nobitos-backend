/**
 * NOBITOS APP — Type Definitions
 * All TypeScript interfaces and types used throughout the backend
 */

// ============ ENUMS ============

export enum RoleType {
  OFFICE_PUSAT = 'office_pusat',
  GUDANG_PUSAT = 'gudang_pusat',
  SUPPLIER = 'supplier',
  KITCHEN_HEAD = 'kitchen_head',
  KITCHEN_STAFF = 'kitchen_staff',
  OUTLET_MANAGER = 'outlet_manager',
  OUTLET_GUDANG = 'outlet_gudang',
  OUTLET_OPS = 'outlet_ops',
  KURIR = 'kurir',
  OPNAME_OFFICER = 'opname_officer',
  HQ_MANAGEMENT = 'hq_management'
}

export enum POStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  CONFIRMED = 'confirmed',
  PARTIALLY_RECEIVED = 'partially_received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ItemType {
  PBD = 'pbd',
  OPERATIONAL = 'operational'
}

export enum ItemCondition {
  BAHAN_BAKU = 'bahan_baku',
  PERLU_DIOLAH = 'perlu_diolah',
  PERLU_DIPRODUKSI = 'perlu_diproduksi',
  SUDAH_DIREPACK = 'sudah_direpack',
  PERLU_DIREPACK = 'perlu_direpack'
}

// ============ DATABASE MODELS ============

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: RoleType;
  organization_id: string;
  created_at: string;
  updated_at: string;
  password_hash?: string; // Not returned in API responses
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  location?: string;
  contact_person?: string;
  phone?: string;
  created_at: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  item_type: ItemType;
  item_condition: ItemCondition;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  whatsapp?: string;
  bank_account?: string;
  delivery_range?: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: POStatus;
  total_amount?: number;
  created_by: string;
  confirmed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface POItem {
  id: string;
  po_id: string;
  item_id: string;
  quantity: number;
  unit_price?: number;
  subtotal?: number;
  received_qty: number;
  created_at: string;
}

export interface StockLedger {
  id: string;
  organization_id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  reference_id?: string;
  reference_type?: string;
  recorded_by: string;
  notes?: string;
  created_at: string;
}

export interface CurrentStock {
  id: string;
  organization_id: string;
  item_id: string;
  quantity: number;
  updated_at: string;
}

export interface DeliveryOrder {
  id: string;
  delivery_number: string;
  from_org_id: string;
  to_org_id: string;
  status: string;
  po_id?: string;
  created_by: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  item_id: string;
  quantity: number;
  received_qty?: number;
  created_at: string;
}

export interface HandoverPin {
  id: string;
  delivery_id: string;
  sender_pin: string;
  receiver_pin: string;
  sender_id: string;
  receiver_id: string;
  sender_verified_at?: string;
  receiver_verified_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// ============ JWT PAYLOAD ============

export interface JWTPayload {
  user_id: string;
  email: string;
  role: RoleType;
  organization_id: string;
  iat: number;
  exp: number;
}

// ============ REQUEST DTOs ============

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  organization_id: string;
  role: RoleType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePORequest {
  po_number: string;
  supplier_id: string;
  items: POItemInput[];
  total_amount?: number;
}

export interface POItemInput {
  item_id: string;
  quantity: number;
  unit_price?: number;
}

export interface ConfirmPORequest {
  po_id: string;
}

export interface CreateDeliveryRequest {
  delivery_number: string;
  from_org_id: string;
  to_org_id: string;
  po_id?: string;
  items: DeliveryItemInput[];
}

export interface DeliveryItemInput {
  item_id: string;
  quantity: number;
}

export interface CreateHandoverRequest {
  delivery_id: string;
  receiver_id: string;
  sender_pin: string;
  receiver_pin: string;
}

export interface VerifyPINRequest {
  handover_id: string;
  pin: string;
  verified_by_role: 'sender' | 'receiver';
}

// ============ RESPONSE DTOs ============

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  code?: string;
  message?: string;
}

export interface AuthResponse {
  user_id: string;
  email: string;
  full_name: string;
  role: RoleType;
  organization_id: string;
  token?: string;
  expires_in?: number;
  token_type?: string;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============ ERROR HANDLING ============

export interface ErrorResponse {
  status: 'error';
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

// ============ MIDDLEWARE CONTEXT ============

export interface AuthenticatedRequest {
  user?: JWTPayload;
  token?: string;
  ip?: string;
}

// ============ PAGINATION ============

export interface PaginationParams {
  page: number;
  per_page: number;
  offset: number;
}

export function parsePaginationParams(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const per_page = Math.min(100, Math.max(1, parseInt(query.per_page) || 20));
  const offset = (page - 1) * per_page;

  return { page, per_page, offset };
}
