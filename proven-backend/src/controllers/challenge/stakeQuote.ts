import { Response, Request } from 'express';
import prisma from '../../lib/prisma';
import crypto from 'crypto';

// Quote cache (in-memory for MVP). Use Redis in production.
const QUOTE_TTL_MS = 60_000; // 60 seconds
const quoteStore = new Map<string, { challengeId: string; amountLamports: number; escrowPubkey: string; expiresAt: number }>();

export const getStakeQuote = async (req: Request, res: Response) => {
  try {
    const { id: challengeId } = req.params;
    if (!challengeId) {
      res.status(400).json({ success: false, message: 'Challenge ID is required' });
      return;
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      res.status(404).json({ success: false, message: 'Challenge not found' });
      return;
    }

    // Convert SOL to lamports if stored as SOL. Here assume stakeAmount is SOL numeric.
    const amountLamports = Math.round((challenge.stakeAmount || 0) * 1_000_000_000);

    // For MVP use a single escrow PDA pubkey from env; later per-challenge PDA
    const escrowPubkey = process.env.ESCROW_PUBKEY || '11111111111111111111111111111111';

    const quoteId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + QUOTE_TTL_MS;
    quoteStore.set(quoteId, { challengeId, amountLamports, escrowPubkey, expiresAt });

    res.json({ success: true, data: { quoteId, amountLamports, escrowPubkey, expiresAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create stake quote' });
  }
};

export const useStakeQuote = (quoteId: string) => {
  const q = quoteStore.get(quoteId);
  if (!q) return null;
  if (Date.now() > q.expiresAt) {
    quoteStore.delete(quoteId);
    return null;
  }
  // Consume quote
  quoteStore.delete(quoteId);
  return q;
};






