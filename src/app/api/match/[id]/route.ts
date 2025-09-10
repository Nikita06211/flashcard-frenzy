import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Match, Game } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const matchId = params.id;

    // Validate match ID format
    if (!matchId || matchId.length !== 24) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid match ID format' 
        },
        { status: 400 }
      );
    }

    // Get match details with populated players
    const match = await Match.findById(matchId)
      .populate('players', 'email isOnline lastActive')
      .lean();

    if (!match) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Match not found' 
        },
        { status: 404 }
      );
    }

    // Get associated game if it exists
    const game = await Game.findOne({ matchId })
      .populate('flashcards.answeredBy', 'email')
      .lean();

    return NextResponse.json({
      success: true,
      match: {
        _id: match._id,
        players: match.players,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      },
      game: game ? {
        _id: game._id,
        flashcards: game.flashcards,
        scores: game.scores,
        status: game.status,
        startedAt: game.startedAt,
        endedAt: game.endedAt
      } : null
    });

  } catch (error) {
    console.error('Error fetching match details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch match details' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const matchId = params.id;
    const { status } = await request.json();

    // Validate match ID format
    if (!matchId || matchId.length !== 24) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid match ID format' 
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!status || !['pending', 'active', 'finished'].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid status. Must be pending, active, or finished' 
        },
        { status: 400 }
      );
    }

    // Update match status
    const match = await Match.findByIdAndUpdate(
      matchId,
      { status },
      { new: true, runValidators: true }
    ).populate('players', 'email isOnline lastActive');

    if (!match) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Match not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      match: {
        _id: match._id,
        players: match.players,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update match' 
      },
      { status: 500 }
    );
  }
}
