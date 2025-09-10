import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';

export async function GET(request: NextRequest) {
  console.log('🔄 /api/players - GET request received');
  try {
    try {
      console.log('🔌 Attempting database connection for players fetch...');
      await connectDB();
      
      // Get all users first to debug
      const allUsers = await User.find({}).lean();
      console.log('📊 All users in database:', allUsers.length, allUsers);
      
      // Get online players
      const onlinePlayers = await User.find({ isOnline: true })
        .select('_id supabaseId email lastActive')
        .sort({ lastActive: -1 })
        .lean();

      console.log('✅ Players fetched successfully from database:', onlinePlayers.length);
      return NextResponse.json({
        success: true,
        players: onlinePlayers,
        count: onlinePlayers.length
      });
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      console.log('🔄 Using fallback data for players fetch');
      
      // Return empty array if DB is not available
      return NextResponse.json({
        success: true,
        players: [],
        count: 0,
        warning: 'Database not available'
      });
    }

  } catch (error) {
    console.error('Error fetching online players:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch online players' 
      },
      { status: 500 }
    );
  }
}
