import { NextRequest, NextResponse } from 'next/server';
import { MatchHistory } from '@/types/matchHistory';

// In-memory storage for demo purposes
// In production, this would be stored in a database
let matchHistory: MatchHistory[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');

  if (!playerId) {
    return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
  }

  // Get match history for the specific player
  const playerMatches = matchHistory.filter(
    match => match.playerId === playerId || match.opponentId === playerId
  );

  // Sort by timestamp (newest first)
  playerMatches.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json({ matches: playerMatches });
}

export async function POST(request: NextRequest) {
  try {
    const matchData: MatchHistory = await request.json();
    
    // Validate required fields
    if (!matchData.matchId || !matchData.playerId || !matchData.opponentId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Generate unique ID for the match history entry
    matchData.id = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    matchData.timestamp = Date.now();

    // Store the match history
    matchHistory.push(matchData);

    return NextResponse.json({ 
      success: true, 
      matchId: matchData.id 
    });
  } catch (error) {
    console.error('Error saving match history:', error);
    return NextResponse.json(
      { error: 'Failed to save match history' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');

  if (!playerId) {
    return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
  }

  // Remove all matches for the player
  matchHistory = matchHistory.filter(
    match => match.playerId !== playerId && match.opponentId !== playerId
  );

  return NextResponse.json({ success: true });
}
