import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for challenge responses (in production, use a database)
const challengeResponses = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { challengerId, targetId, accepted, matchId } = await request.json();
    
    if (!challengerId || !targetId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const responseData = {
      challengerId,
      targetId,
      accepted,
      matchId,
      timestamp: Date.now()
    };

    // Store response for the challenger
    challengeResponses.set(challengerId, responseData);

    console.log(`⚔️ Challenge response stored: ${accepted ? 'accepted' : 'declined'} by ${targetId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Challenge response sent successfully'
    });
  } catch (error) {
    console.error('Error sending challenge response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
