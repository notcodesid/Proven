import { NextRequest, NextResponse } from "next/server";
import { Transaction } from "../../../src/services/transactionService";

// Mock database
const transactions: Transaction[] = [];

// Initialize with some sample data for development
if (process.env.NODE_ENV === 'development') {
  // This will only load in development mode
  // In production, we would have a real database
  try {
    // Try to load from a local file if needed
  } catch (error) {
  }
}

// GET /api/transactions - Get all transactions or filtered by userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Filter transactions by userId if provided
    const filteredTransactions = userId 
      ? transactions.filter(tx => tx.userId === userId) 
      : transactions;
    
    return NextResponse.json({ transactions: filteredTransactions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error retrieving transactions' }, { status: 500 });
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.type || data.amount === undefined || !data.signature) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Create new transaction
    const newTransaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      signature: data.signature,
      timestamp: new Date().toISOString(),
      description: data.description || `${data.type} transaction`,
      challengeId: data.challengeId,
      challengeTitle: data.challengeTitle
    };
    
    // Add to mock database
    transactions.push(newTransaction);
    
    return NextResponse.json({ transaction: newTransaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating transaction' }, { status: 500 });
  }
} 