export interface Challenge {
  id: string;
  title: string;
  type: string;
  hostType: string;
  sponsor: string;
  creator?: {
    id: string;
    name: string;
    image: string;
  };
  duration: string;
  difficulty: string;
  userStake: number;
  stakeAmount: number; // Alias for userStake for blockchain compatibility
  totalPrizePool: number;
  participants: number;
  metrics: string;
  category?: string;
  steps?: string;
  trackingMetrics: string[];
  image: string;
  description?: string;
  rules?: string[];
  startDate?: Date | string;
  endDate?: Date | string;
  escrowAddress?: string; // Solana wallet address where stakes are held
  blockchainId?: string; // Legacy field (deprecated - use escrowAddress)
  tokenType?: 'SOL' | 'USDC'; // Token type for staking
} 