import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for challenges (in production, use a database)
const challenges = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { challengerId, challengerName, targetId, matchId } = await request.json();
    
    if (!challengerId || !targetId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challengeData = {
      challengerId,
      challengerName,
      matchId,
      targetId,
      timestamp: Date.now()
    };

    // Store challenge for the target user
    challenges.set(targetId, challengeData);

    console.log(`⚔️ Challenge stored for ${targetId} from ${challengerName}`);

    return NextResponse.json({ 
      success: true,
      message: 'Challenge sent successfully'
    });
  } catch (error) {
    console.error('Error sending challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
