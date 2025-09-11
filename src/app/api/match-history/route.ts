import { NextRequest, NextResponse } from 'next/server';
import { MatchHistory as MatchHistoryType } from '@/types/matchHistory';
import { MatchHistory } from '@/models/matchHistorySchema';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectDB();

    // Get match history for the specific player
    const playerMatches = await MatchHistory.find({
      $or: [
        { playerId: playerId },
        { opponentId: playerId }
      ]
    })
    .sort({ createdAt: -1 }) // Sort by creation date (newest first)
    .lean(); // Convert to plain objects

    // Transform MongoDB documents to match the expected format
    const transformedMatches = playerMatches.map(match => ({
      id: match._id.toString(),
      timestamp: match.createdAt.getTime(),
      matchId: match.matchId,
      playerId: match.playerId,
      opponentId: match.opponentId,
      playerName: match.playerName,
      opponentName: match.opponentName,
      playerScore: match.playerScore,
      opponentScore: match.opponentScore,
      winner: match.winner,
      totalQuestions: match.totalQuestions,
      playerCorrectAnswers: match.playerCorrectAnswers,
      opponentCorrectAnswers: match.opponentCorrectAnswers,
      matchDuration: match.matchDuration,
      questions: match.questions
    }));

    return NextResponse.json({ matches: transformedMatches });
  } catch (error) {
    console.error('Error fetching match history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match history' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const matchData: Omit<MatchHistoryType, 'id' | 'timestamp'> = await request.json();
    
    // Validate required fields
    if (!matchData.matchId || !matchData.playerId || !matchData.opponentId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Create new match history document
    const newMatchHistory = new MatchHistory({
      matchId: matchData.matchId,
      playerId: matchData.playerId,
      opponentId: matchData.opponentId,
      playerName: matchData.playerName,
      opponentName: matchData.opponentName,
      playerScore: matchData.playerScore,
      opponentScore: matchData.opponentScore,
      winner: matchData.winner,
      totalQuestions: matchData.totalQuestions,
      playerCorrectAnswers: matchData.playerCorrectAnswers,
      opponentCorrectAnswers: matchData.opponentCorrectAnswers,
      matchDuration: matchData.matchDuration,
      questions: matchData.questions
    });

    // Save to MongoDB
    const savedMatch = await newMatchHistory.save();

    return NextResponse.json({ 
      success: true, 
      matchId: savedMatch._id.toString() 
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
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectDB();

    // Remove all matches for the player
    const result = await MatchHistory.deleteMany({
      $or: [
        { playerId: playerId },
        { opponentId: playerId }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting match history:', error);
    return NextResponse.json(
      { error: 'Failed to delete match history' }, 
      { status: 500 }
    );
  }
}
