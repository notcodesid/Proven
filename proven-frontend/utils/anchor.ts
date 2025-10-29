import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '../config/blockchain';

// Import the actual IDL from the Solana program
import idl from './proven_stake_idl.json';

// TypeScript interface (keeping for reference, not actively used)
interface ProvenStakeIDLType {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }>;
    args: Array<{
      name: string;
      type: string;
    }>;
  }>;
  accounts: Array<{
    name: string;
    type: {
      kind: string;
      fields: Array<{
        name: string;
        type: string | { defined: string };
      }>;
    };
  }>;
  errors: Array<{
    code: number;
    name: string;
    msg: string;
  }>;
}

// The actual IDL is imported from the JSON file above
// OLD manually created IDL has been removed

export const useAnchorProgram = () => {
  const wallet = useWallet();

  const getProgram = (connection: Connection) => {
    // Single source of truth for program ID
    const addr = (idl as any)?.metadata?.address ?? process.env.NEXT_PUBLIC_PROGRAM_ID;

    console.log('[getProgram] Raw address from IDL:', (idl as any)?.metadata?.address);
    console.log('[getProgram] Env PROGRAM_ID:', process.env.NEXT_PUBLIC_PROGRAM_ID);
    console.log('[getProgram] Final addr:', addr);
    console.log('[getProgram] Type of addr:', typeof addr);

    if (!addr || typeof addr !== 'string') {
      throw new Error(
        'Program ID missing/invalid: ensure idl.metadata.address or NEXT_PUBLIC_PROGRAM_ID is a base58 string. ' +
        `Got: ${JSON.stringify(addr)}`
      );
    }

    // Trim just in case there's whitespace
    const trimmedAddr = addr.trim();
    console.log('[getProgram] Trimmed address:', trimmedAddr);
    console.log('[getProgram] Address length:', trimmedAddr.length);

    // Test PublicKey creation
    let programId: PublicKey;
    try {
      programId = new PublicKey(trimmedAddr);
      console.log('✅ PublicKey created successfully:', programId.toBase58());
    } catch (err: any) {
      console.error('❌ Failed to create PublicKey:', err);
      console.error('   Address value:', JSON.stringify(trimmedAddr));
      console.error('   Address bytes:', Array.from(trimmedAddr).map(c => c.charCodeAt(0)));
      throw new Error(`Invalid program address: ${trimmedAddr}. Error: ${err.message}`);
    }

    // Create provider
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    );

    console.log('[getProgram] Provider created');
    console.log('[getProgram] Wallet public key:', wallet.publicKey?.toBase58());

    // Create Program with explicit parameters
    try {
      console.log('[getProgram] Creating Program with:');
      console.log('  - IDL name:', (idl as any).name);
      console.log('  - IDL version:', (idl as any).version);
      console.log('  - Program ID:', programId.toBase58());
      console.log('  - Wallet:', wallet.publicKey?.toBase58());

      // Create IDL with address field as string (required by Anchor's Idl type)
      // Use type assertion via 'unknown' to handle IDL structure differences
      const idlWithAddress = {
        ...idl,
        address: trimmedAddr
      } as unknown as Idl;

      // Pass the IDL with address and the provider
      const program = new Program(idlWithAddress, provider);

      console.log('✅ Program created successfully!');
      console.log('  - Program ID:', program.programId.toBase58());

      return program;
    } catch (err: any) {
      console.error('❌ Program creation failed:', err);
      console.error('   Stack:', err.stack);
      throw new Error(`Failed to create Anchor Program: ${err.message}`);
    }
  };

  return { getProgram };
};

// NOTE: Below this point is where the old manually-created IDL was.
// It has been removed and replaced with the proper IDL import above.

// Helper functions for PDAs
export const getChallengeAddress = async (
  challengeId: string,
  admin: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('challenge'),
      Buffer.from(challengeId),
      admin.toBuffer()
    ],
    PROGRAM_ID
  );
};

export const getParticipantAddress = async (
  challengePDA: PublicKey,
  user: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('participant'),
      challengePDA.toBuffer(),
      user.toBuffer()
    ],
    PROGRAM_ID
  );
};

// Challenge creation parameters
export interface CreateChallengeParams {
  challengeId: string; // Unique challenge identifier
  stakeAmount: number; // SOL amount (will be converted to lamports)
  totalDays: number;
  thresholdBps: number; // Basis points (e.g., 8000 = 80%)
  platformFeeBps: number; // Basis points (e.g., 500 = 5%)
  startDate: Date;
  oraclePublicKey: PublicKey;
}

export interface JoinChallengeParams {
  challengeId: string; // Challenge ID string
  challengePDA: PublicKey; // Challenge PDA address
}
