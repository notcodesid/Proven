import { NextRequest, NextResponse } from "next/server";
import { UserChallenge } from "../../../../src/services/userChallenge/types";
import { fetchChallenges } from "../../../../src/services/challengeService";

// Mock database
const userChallenges: UserChallenge[] = [];

// Initialize with some sample data for development
if (process.env.NODE_ENV === 'development') {
  // This will only load in development mode
  // In production, we would have a real database
  try {
    // Try to load from a local file if needed
  } catch (error) {
  }
}

// GET /api/challenges/user - Get all challenges for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'ACTIVE', 'COMPLETED', 'FAILED'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Filter challenges by user ID and optional status
    let filteredChallenges = userChallenges.filter(uc => uc.userId === userId);
    
    if (status) {
      filteredChallenges = filteredChallenges.filter(uc => uc.status === status);
    }
    
    return NextResponse.json({ userChallenges: filteredChallenges }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error retrieving user challenges' }, { status: 500 });
  }
}

// POST /api/challenges/user - Record a new challenge for a user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.challengeId || data.stake === undefined || !data.transactionSignature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the challenge details
    const challenges = await fetchChallenges();
    const challenge = challenges.find(c => c.id === data.challengeId);
    
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    // Create a new user challenge
    const userChallenge: UserChallenge = {
      id: `uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      challengeId: data.challengeId,
      userId: data.userId,
      status: 'ACTIVE',
      progress: 0,
      startDate: new Date().toISOString(),
      endDate: null,
      stakeAmount: data.stakeAmount,
      transactionSignature: data.transactionSignature,
      challenge
    };
    
    // Add to mock database
    userChallenges.push(userChallenge);
    
    return NextResponse.json({ userChallenge }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating user challenge' }, { status: 500 });
  }
}

// PATCH /api/challenges/user/:id - Update a user challenge
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Find the challenge to update
    const index = userChallenges.findIndex(uc => uc.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'User challenge not found' },
        { status: 404 }
      );
    }
    
    // Update the challenge
    const updatedChallenge = {
      ...userChallenges[index],
      ...data
    };
    
    // If progress is 100% or more, mark as completed
    if (data.progress && data.progress >= 1) {
      updatedChallenge.status = 'COMPLETED';
      updatedChallenge.endDate = new Date().toISOString();
    }
    
    userChallenges[index] = updatedChallenge;
    
    return NextResponse.json({ userChallenge: updatedChallenge }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating user challenge' }, { status: 500 });
  }
} 