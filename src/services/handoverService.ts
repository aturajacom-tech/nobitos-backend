/**
 * Handover Service — Supabase client version
 */

import { getDatabase } from '../config/database';
import { CreateHandoverRequest, APIError } from '../types';

function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createHandover(req: CreateHandoverRequest): Promise<{ handover_id: string; sender_pin: string; receiver_pin: string }> {
  if (!req.delivery_id || !req.receiver_id) {
    throw new APIError(400, 'INVALID_INPUT', 'Missing required handover fields');
  }

  const db = getDatabase();

  const sendPin = generateRandomPin();
  const receivePin = generateRandomPin();

  const { data: handover, error } = await db
    .from('handover_pins')
    .insert({
      delivery_id: req.delivery_id,
      sender_pin: sendPin,
      receiver_pin: receivePin,
      receiver_id: req.receiver_id
    })
    .select('id')
    .single();

  if (error || !handover) {
    throw new APIError(500, 'CREATE_HANDOVER_ERROR', error?.message || 'Failed to create handover');
  }

  return {
    handover_id: handover.id,
    sender_pin: sendPin,
    receiver_pin: receivePin
  };
}

export async function verifyHandoverPin(handoverId: string, pin: string, verifiedBy: 'sender' | 'receiver'): Promise<void> {
  const db = getDatabase();

  const { data: handover } = await db
    .from('handover_pins')
    .select('id, sender_pin, receiver_pin, sender_verified_at, receiver_verified_at')
    .eq('id', handoverId)
    .single();

  if (!handover) throw new APIError(404, 'NOT_FOUND', 'Handover not found');

  if (verifiedBy === 'sender') {
    if (handover.sender_pin !== pin) throw new APIError(400, 'INVALID_PIN', 'Incorrect sender PIN');
    await db.from('handover_pins').update({ sender_verified_at: new Date().toISOString() }).eq('id', handoverId);
  } else {
    if (handover.receiver_pin !== pin) throw new APIError(400, 'INVALID_PIN', 'Incorrect receiver PIN');
    await db.from('handover_pins').update({ receiver_verified_at: new Date().toISOString() }).eq('id', handoverId);
  }
}

export async function getHandoverStatus(handoverId: string): Promise<any> {
  const db = getDatabase();
  const { data } = await db.from('handover_pins').select('*').eq('id', handoverId).single();
  return data;
}
