import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // Update user status to offline
    await User.findByIdAndUpdate(
      userId,
      { 
        isOnline: false,
        lastActive: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      message: 'User logged out successfully'
    });

  } catch (error) {
    console.error('Error logging out user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to logout user' 
      },
      { status: 500 }
    );
  }
}
