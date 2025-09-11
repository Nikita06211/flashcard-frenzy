import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';
import { Match } from '@/models/matchSchema';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { playerId } = await request.json();
    
    if (!playerId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Player ID is required' 
        },
        { status: 400 }
      );
    }

    // Find and update all active matches for this player
    const result = await Match.updateMany(
      { 
        players: playerId,
        status: { $in: ['pending', 'active'] }
      },
      { 
        status: 'finished',
        updatedAt: new Date()
      }
    );


    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} matches`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error cleaning up matches:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clean up matches' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { player1Id, player2Id } = await request.json();
    

    // Validate input
    if (!player1Id || !player2Id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Both player1Id and player2Id are required' 
        },
        { status: 400 }
      );
    }

    if (player1Id === player2Id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A player cannot match with themselves' 
        },
        { status: 400 }
      );
    }

    // Check if both players exist and are online
    const players = await User.find({
      supabaseId: { $in: [player1Id, player2Id] },
      isOnline: true
    });

    if (players.length !== 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'One or both players not found or not online' 
        },
        { status: 404 }
      );
    }

    // Check if either player is already in an active match
    const existingMatch = await Match.findOne({
      players: { $in: [player1Id, player2Id] },
      status: { $in: ['pending', 'active'] }
    });

    if (existingMatch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'One or both players are already in an active match' 
        },
        { status: 409 }
      );
    }

    // Create new match with player references
    const match = new Match({
      players: [player1Id, player2Id],
      status: 'pending'
    });

    await match.save();

    return NextResponse.json({
      success: true,
      match: {
        _id: match._id,
        players: match.players,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create match' 
      },
      { status: 500 }
    );
  }
}
