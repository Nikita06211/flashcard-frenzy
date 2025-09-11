import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for challenges (in production, use a database)
const challenges = new Map<string, any>();
const lastActivity = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { userId, lastPoll } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Update last activity
    lastActivity.set(userId, Date.now());

    // Check for pending challenges
    const pendingChallenge = challenges.get(userId);
    if (pendingChallenge && pendingChallenge.timestamp > lastPoll) {
      challenges.delete(userId); // Remove after sending
      return NextResponse.json({ 
        challenge: pendingChallenge,
        timestamp: Date.now()
      });
    }

    // Check for match redirects (simplified)
    // In a real app, you'd check match status here

    return NextResponse.json({ 
      status: 'ok',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in polling updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
