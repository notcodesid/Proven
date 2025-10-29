import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { initializeEscrow, stakeToEscrow, getEscrowBalance } from '../utils/solana';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { joinUserChallenge, recordChallengeStake } from '@/services/userChallenge';
import { checkUserChallenge } from '@/services/userChallenge/checkUserChallenge';
import { formatAmount } from '@/utils/formatters';
import { BLOCKCHAIN, TIMEOUTS } from '@/config/constants';

interface StakeFormProps {
  stakeAmount?: number;
  challengeId?: string;
}

export function StakeForm({ stakeAmount = 0.1, challengeId }: StakeFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState(stakeAmount);
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stakeSuccessful, setStakeSuccessful] = useState(false);
  const [recordingChallenge, setRecordingChallenge] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [showAlreadyJoinedPopup, setShowAlreadyJoinedPopup] = useState(false);

  // Update amount when the stakeAmount prop changes
  useEffect(() => {
    setAmount(stakeAmount);
  }, [stakeAmount]);

  // Check if user has already joined this challenge
  useEffect(() => {
    const checkIfAlreadyJoined = async () => {
      if (challengeId && user && user.id) {
        try {
          const result = await checkUserChallenge(challengeId);
          if (result.hasJoined) {
            setAlreadyJoined(true);
            setShowAlreadyJoinedPopup(true);
          }
        } catch (err) {
        }
      }
    };
    
    checkIfAlreadyJoined();
  }, [challengeId, user]);

  useEffect(() => {
    // Get escrow balance when component mounts or wallet connects
    const updateEscrowBalance = async () => {
      if (connection) {
        try {
          const balance = await getEscrowBalance(connection);
          setEscrowBalance(balance);
        } catch (err) {
        }
      }
    };

    // Get wallet balance
    const updateWalletBalance = async () => {
      if (connection && wallet.publicKey) {
        try {
          const balance = await connection.getBalance(wallet.publicKey);
          setWalletBalance(balance / LAMPORTS_PER_SOL);
        } catch (err) {
        }
      } else {
        setWalletBalance(null);
      }
    };

    updateEscrowBalance();
    updateWalletBalance();

    // Set up interval to refresh balances
    const intervalId = setInterval(() => {
      updateEscrowBalance();
      updateWalletBalance();
    }, BLOCKCHAIN.BALANCE_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [connection, wallet.publicKey, wallet.connected, transactionSignature]);

  const handleStake = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!user || !user.id) {
      setError('Please sign in to join a challenge');
      return;
    }

    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (walletBalance !== null && amount > walletBalance) {
      setError(`Not enough SOL in your wallet. Your balance is ${formatAmount(walletBalance)} SOL`);
      return;
    }
    
    // Check if user has already joined this challenge before proceeding
    if (challengeId) {
      try {
        const result = await checkUserChallenge(challengeId);
        if (result.hasJoined) {
          setAlreadyJoined(true);
          setShowAlreadyJoinedPopup(true);
          return;
        }
      } catch (err) {
      }
    }

    setIsStaking(true);
    setError(null);
    
    try {
      // First make sure the escrow is initialized
      await initializeEscrow(connection, wallet);
      
      // Then stake the amount
      const signature = await stakeToEscrow(connection, wallet, amount);
      
      if (signature) {
        setTransactionSignature(signature);
        // Refresh the escrow balance
        const balance = await getEscrowBalance(connection);
        setEscrowBalance(balance);
        // Update wallet balance
        if (wallet.publicKey) {
          const walletBal = await connection.getBalance(wallet.publicKey);
          setWalletBalance(walletBal / LAMPORTS_PER_SOL);
        }
        setStakeSuccessful(true);
        
        // Join the challenge and record the stake in the user's profile
        if (challengeId && user && user.id) {
          try {
            setRecordingChallenge(true);
            
            // First join the challenge via the API
            const userChallenge = await joinUserChallenge(challengeId, amount);

            if (userChallenge) {

              // Then record the stake transaction
              try {
                await recordChallengeStake(
                  challengeId,
                  user.id,
                  amount,
                  signature
                );
              } catch (recordError) {
                // Even if recording the stake fails, the user has already joined the challenge
              }

              // Redirect to profile page after delay
              setTimeout(() => {
                router.push('/profile');
              }, TIMEOUTS.REDIRECT_DELAY);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error joining challenge. Please try again.');
            setStakeSuccessful(false);
          } finally {
            setRecordingChallenge(false);
          }
        }
      } else {
        setError('Transaction failed');
      }
    } catch (err) {
      setError('Error processing transaction');
    } finally {
      setIsStaking(false);
    }
  };

  // Handle view profile button click
  const handleViewProfile = () => {
    router.push('/profile');
  };

  // Handle close popup
  const handleClosePopup = () => {
    setShowAlreadyJoinedPopup(false);
  };

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: '#18181a' }}>
      {/* Already Joined Popup */}
      {showAlreadyJoinedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#18181a] p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ color: '#c4c2c9' }}>Already Joined</h3>
              <button 
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 mb-6">You have already joined this challenge. You cannot stake again for the same challenge.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClosePopup}
                className="py-2 px-4 rounded-lg bg-gray-700 text-white"
              >
                Close
              </button>
              <button
                onClick={handleViewProfile}
                className="py-2 px-4 rounded-lg text-white"
                style={{ background: 'linear-gradient(to right, #FF5757, #FF7F50)' }}
              >
                View My Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4" style={{ color: '#c4c2c9' }}>
        {stakeSuccessful ? 'Successfully Staked!' : 'Stake SOL for Challenge'}
      </h2>

      {wallet.connected && wallet.publicKey && (
        <div className="mb-4">
          <p className="text-sm" style={{ color: '#8a8891' }}>Your Wallet Balance:</p>
          <p className="font-bold" style={{ color: '#c4c2c9' }}>
            {walletBalance !== null ? `${formatAmount(walletBalance)} SOL` : 'Loading...'}
          </p>
        </div>
      )}

      {escrowBalance !== null && (
        <div className="mb-4">
          <p className="text-sm" style={{ color: '#8a8891' }}>Escrow Balance:</p>
          <p className="font-bold" style={{ color: '#c4c2c9' }}>{formatAmount(escrowBalance)} SOL</p>
        </div>
      )}
      
      {!stakeSuccessful ? (
        <>
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Stake Amount (SOL)</label>
            <input
              type="number"
              value={amount}
              readOnly
              disabled
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] focus:outline-none cursor-not-allowed opacity-80"
            />
          </div>

          <button
            onClick={handleStake}
            disabled={isStaking || !wallet.connected}
            className="w-full py-3 px-4 rounded-lg font-medium text-white disabled:opacity-50"
            style={{
              background: isStaking ? '#666' : 'linear-gradient(to right, #FF5757, #FF7F50)',
            }}
          >
            {isStaking ? 'Processing...' : `Stake ${amount} SOL`}
          </button>
          
          {error && (
            <div className="mt-3 text-[#FF5757] text-sm">
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#c4c2c9' }}>Stake Successful!</h3>
          <p className="text-gray-300 mb-4">You have successfully staked {amount} SOL for this challenge.</p>
          {recordingChallenge ? (
            <p className="text-sm" style={{ color: '#8a8891' }}>Adding challenge to your profile...</p>
          ) : (
            <p className="text-sm" style={{ color: '#8a8891' }}>Redirecting to your profile...</p>
          )}
        </div>
      )}
      
      {transactionSignature && (
        <div className="mt-4 p-3 rounded-lg bg-[#252329]">
          <p className="text-sm mb-1" style={{ color: '#8a8891' }}>Transaction successful!</p>
          <a
            href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs break-all text-[#FF5757] hover:underline"
          >
            View on Solana Explorer
          </a>
        </div>
      )}
    </div>
  );
} 