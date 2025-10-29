import { Challenge } from '../../types/challenge';

// User challenge interface
export interface UserChallenge {
  id: string;
  challengeId: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  progress: number;
  startDate: string;
  endDate: string | null;
  stakeAmount: number;
  transactionSignature?: string;
  challenge: Challenge;
}
