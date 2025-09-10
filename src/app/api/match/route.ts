import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Match, User } from '@/models';

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
      _id: { $in: [player1Id, player2Id] },
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

    // Create new match
    const match = new Match({
      players: [player1Id, player2Id],
      status: 'pending'
    });

    await match.save();

    // Populate player details for response
    await match.populate('players', 'email isOnline lastActive');

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
