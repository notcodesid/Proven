"use client"
import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import { joinChallenge } from '../../services/challengeService';

interface JoinChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  challenge: {
    id: string;
    title: string;
    stakeAmount: number;
    escrowAddress?: string;
    tokenType?: 'SOL' | 'USDC';
  };
}

// Devnet USDC mint address
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  challenge
}) => {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [error, setError] = useState<string | null>(null);

  const tokenType = challenge.tokenType || 'USDC';

  const handleJoinChallenge = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!challenge.escrowAddress) {
      setError('Challenge escrow address not configured');
      return;
    }

    if (!sendTransaction) {
      setError('Wallet does not support sending transactions');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      // Step 1: Validate network (ensure we're on Devnet)
      const endpoint = connection.rpcEndpoint;
      if (!endpoint.includes('devnet') && !endpoint.includes('localhost')) {
        // Not on Devnet - still proceed but may fail
      }

      // Step 2: Check SOL balance for gas + rent
      const balance = await connection.getBalance(publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;

      // Need at least 0.005 SOL for gas + potential ATA creation (~0.002 SOL per ATA)
      const minRequiredSol = 0.005;
      if (balanceInSol < minRequiredSol) {
        throw new Error(
          `Insufficient SOL for transaction fees. You have ${balanceInSol.toFixed(4)} SOL but need at least ${minRequiredSol} SOL.\n\n` +
          `Get Devnet SOL from: https://faucet.solana.com/`
        );
      }

      // Step 3: Get token account addresses
      const escrowPubkey = new PublicKey(challenge.escrowAddress);
      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );
      const escrowTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        escrowPubkey
      );

      // Step 4: Build transaction with ATA creation if needed
      const transaction = new Transaction();

      // Check if user's USDC token account exists
      let userAccountExists = false;
      try {
        await getAccount(connection, userTokenAccount);
        userAccountExists = true;
      } catch (error: any) {
        if (error.name === 'TokenAccountNotFoundError') {
          // Add instruction to create user's USDC token account
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              userTokenAccount, // account to create
              publicKey, // owner
              USDC_MINT, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        } else {
          throw error;
        }
      }

      // Check if escrow's USDC token account exists
      let escrowAccountExists = false;
      try {
        await getAccount(connection, escrowTokenAccount);
        escrowAccountExists = true;
      } catch (error: any) {
        if (error.name === 'TokenAccountNotFoundError') {
          // Add instruction to create escrow's USDC token account
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer (user pays for escrow's ATA)
              escrowTokenAccount, // account to create
              escrowPubkey, // owner (escrow)
              USDC_MINT, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        } else {
          throw error;
        }
      }

      // Step 5: Check user has enough USDC (only if account exists)
      if (userAccountExists) {
        try {
          const userAccount = await getAccount(connection, userTokenAccount);
          const userBalance = Number(userAccount.amount) / 1_000_000; // Convert from smallest unit

          if (userBalance < challenge.stakeAmount) {
            throw new Error(
              `Insufficient USDC balance. You have ${userBalance} USDC but need ${challenge.stakeAmount} USDC.\n\n` +
              `Get Devnet USDC from: https://spl-token-faucet.com/?token-name=USDC`
            );
          }
        } catch (error: any) {
          if (error.message?.includes('Insufficient USDC')) {
            throw error;
          }
          // If we can't read balance, continue (account might be being created)
        }
      }

      // Step 6: Add transfer instruction
      const amountInSmallestUnit = Math.floor(challenge.stakeAmount * 1_000_000);
      transaction.add(
        createTransferInstruction(
          userTokenAccount,
          escrowTokenAccount,
          publicKey,
          amountInSmallestUnit,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Step 7: Set transaction properties
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      // Step 8: Simulate transaction first to catch errors early
      try {
        const simulation = await connection.simulateTransaction(transaction);
        if (simulation.value.err) {
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simError: any) {
        throw new Error(`Transaction validation failed: ${simError.message}`);
      }

      // Step 9: Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Step 10: Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      // Step 11: Call backend to join challenge with real signature
      const result = await joinChallenge(
        challenge.id,
        challenge.stakeAmount,
        publicKey.toBase58(),
        signature
      );

      if (result.success) {
        setStep('success');

        // Wait a moment before calling success callback
        setTimeout(() => {
          onSuccess();
          onClose();
          resetModal();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to join challenge');
      }

    } catch (err: any) {

      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred';

      if (err.message?.includes('User rejected') || err.message?.includes('User declined')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (err.message?.includes('Insufficient SOL')) {
        errorMessage = err.message; // Already formatted with faucet link
      } else if (err.message?.includes('Insufficient USDC')) {
        errorMessage = err.message; // Already formatted with faucet link
      } else if (err.message?.includes('simulation failed') || err.message?.includes('validation failed')) {
        errorMessage = `Transaction validation failed. This usually means:\n• Not enough SOL/USDC in wallet\n• Wallet on wrong network (should be Devnet)\n• Invalid transaction parameters\n\nDetails: ${err.message}`;
      } else if (err.message?.includes('blockhash') || err.message?.includes('block height')) {
        errorMessage = 'Network error: Transaction expired. Please try again.';
      } else if (err.message?.includes('TokenAccountNotFoundError')) {
        errorMessage = 'USDC token account error. The system will create it automatically - please try again.';
      } else if (err.message) {
        // Use the error message directly if it exists
        errorMessage = err.message;
      } else {
        errorMessage = 'Transaction failed. Please ensure:\n• Wallet is connected to Devnet\n• You have enough SOL (≥0.005) for gas\n• You have enough USDC for the stake\n\nThen try again.';
      }

      setError(errorMessage);
      setStep('error');
    }
  };

  const resetModal = () => {
    setStep('confirm');
    setError(null);
  };

  const handleClose = () => {
    if (step !== 'processing') {
      onClose();
      resetModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1E] rounded-xl w-full max-w-md p-6">

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Challenge Joined!</h3>
            <p className="text-gray-300 mb-4">
              You&apos;ve successfully joined the challenge. Good luck!
            </p>
            <div className="text-sm text-gray-400">
              You can now start submitting daily proof to complete the challenge.
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Join Failed</h3>
            <div className="text-red-400 mb-4 text-left max-w-md mx-auto">
              <p className="whitespace-pre-line">{error}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setStep('confirm');
                  setError(null);
                }}
                className="flex-1 py-3 bg-[#FF5757] text-white rounded-lg hover:bg-[#e04747] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin w-16 h-16 border-4 border-[#FF5757] border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Sending Transaction...</h3>
            <p className="text-gray-300 mb-2">Transferring {challenge.stakeAmount} {tokenType} to escrow</p>
            <p className="text-sm text-gray-400">
              Please confirm the transaction in your wallet
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This may take a few moments to confirm on-chain
            </p>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Join Challenge</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-[#27272A] rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-1">{challenge.title}</h4>
                <p className="text-2xl font-bold text-[#FF5757] mb-2">
                  {challenge.stakeAmount} {tokenType}
                </p>
                <p className="text-sm text-gray-400">Stake amount</p>
              </div>

              {challenge.escrowAddress && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                    </svg>
                    Escrow Wallet Address
                  </h5>
                  <div className="bg-black/30 rounded p-2 mb-2">
                    <p className="text-xs text-gray-300 font-mono break-all">
                      {challenge.escrowAddress}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Your {challenge.stakeAmount} {tokenType} stake will be securely held here until challenge completion
                  </p>
                </div>
              )}

              <div className="bg-[#FF5757]/10 border border-[#FF5757]/30 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">⚠️ Important</h5>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• You will send {challenge.stakeAmount} {tokenType} to the escrow wallet</li>
                  <li>• Complete the challenge to get your stake back + share of prize pool</li>
                  <li>• Missing 2+ consecutive days will result in stake loss</li>
                  <li>• Make sure you have enough {tokenType} in your wallet</li>
                  <li>• Transaction is final once confirmed on-chain</li>
                </ul>
              </div>

              {!connected && (
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    Please connect your wallet to join this challenge.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinChallenge}
                disabled={!connected}
                className="flex-1 py-3 bg-[#FF5757] text-white rounded-lg hover:bg-[#e04747] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Join Challenge
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
