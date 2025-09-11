import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { matchId, userId } = await request.json();
    
    if (!matchId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🎮 User ${userId} joined match ${matchId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Joined match successfully'
    });
  } catch (error) {
    console.error('Error joining match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
