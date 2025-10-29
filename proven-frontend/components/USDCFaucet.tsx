"use client"
import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useUSDCFaucet, mockUSDCFaucet } from '../services/usdcFaucet';
import { TIMEOUTS } from '@/config/constants';

interface USDCFaucetProps {
  onBalanceUpdate?: (newBalance: number) => void;
}

export const USDCFaucet: React.FC<USDCFaucetProps> = ({ onBalanceUpdate }) => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { getUSDCBalance, requestUSDC } = useUSDCFaucet();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastRequest, setLastRequest] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<React.ReactNode | null>(null);

  // Check balance when wallet connects
  useEffect(() => {
    const checkBalance = async () => {
      if (connected && publicKey) {
        try {
          const currentBalance = await getUSDCBalance(connection);
          setBalance(currentBalance);
          onBalanceUpdate?.(currentBalance);
        } catch (err) {
        }
      } else {
        setBalance(null);
      }
    };

    checkBalance();
  }, [connected, publicKey, connection, getUSDCBalance, onBalanceUpdate]);

  const handleRequestUSDC = async (amount: number = 100) => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsRequesting(true);
    setError(null);
    setSuccess(null);

    try {
      
      // Use real backend faucet
      const result = await requestUSDC(connection, amount);
      
      if (result) {
        const shortSig = result.slice(0, 8);
        setSuccess(
          <div>
            <div>Successfully requested {amount} USDC!</div>
            <div className="text-xs mt-1">
              <span>TX: {shortSig}...</span>
              <a 
                href={`https://explorer.solana.com/tx/${result}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                View on Explorer
              </a>
            </div>
          </div>
        );
        setLastRequest(new Date());
        
        // Update balance after a delay (simulate network confirmation time)
        setTimeout(async () => {
          try {
            const newBalance = await getUSDCBalance(connection);
            setBalance(newBalance);
            onBalanceUpdate?.(newBalance);
          } catch (balanceError) {
            // For mock faucet, simulate the addition
            const simulatedBalance = (balance || 0) + amount;
            setBalance(simulatedBalance);
            onBalanceUpdate?.(simulatedBalance);
          }
        }, 3000);
      } else {
        setError('Faucet request failed - no signature returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request USDC from faucet');
    } finally {
      setIsRequesting(false);
    }
  };

  const canRequestAgain = () => {
    if (!lastRequest) return true;
    const timeSinceLastRequest = Date.now() - lastRequest.getTime();
    return timeSinceLastRequest > TIMEOUTS.FAUCET_COOLDOWN;
  };

  const getRemainingCooldown = () => {
    if (!lastRequest || canRequestAgain()) return 0;
    const timeSinceLastRequest = Date.now() - lastRequest.getTime();
    return Math.ceil((TIMEOUTS.FAUCET_COOLDOWN - timeSinceLastRequest) / 1000);
  };

  if (!connected) {
    return (
      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">USDC Faucet</h3>
            <p className="text-blue-400 text-sm">Connect wallet to get test USDC</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1C1C1E] border border-[#27272A] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium">USDC Faucet</h3>
          <p className="text-gray-400 text-sm">Get devnet USDC for testing</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white">
            {balance !== null ? `${balance.toFixed(2)} USDC` : 'Loading...'}
          </div>
          <div className="text-xs text-gray-400">Current balance</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="flex space-x-2">
        {[50, 100, 200].map((amount) => (
          <button
            key={amount}
            onClick={() => handleRequestUSDC(amount)}
            disabled={isRequesting || !canRequestAgain()}
            className="flex-1 py-2 px-3 bg-[#FF5757] text-white rounded-lg font-medium text-sm hover:bg-[#e04747] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isRequesting ? '...' : `${amount} USDC`}
          </button>
        ))}
      </div>

      {!canRequestAgain() && (
        <div className="mt-3 text-center">
          <p className="text-gray-400 text-xs">
            Cooldown: {Math.floor(getRemainingCooldown() / 60)}m {getRemainingCooldown() % 60}s
          </p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#27272A]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <p className="text-yellow-500 text-xs">
            This is a mock faucet for development. Real devnet USDC requires a proper faucet service.
          </p>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          Wallet: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
        </p>
      </div>
    </div>
  );
};