import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  console.log('🔄 /api/users/sync - POST request received');
  try {
    const { id, email } = await request.json();
    console.log('📝 User sync data:', { id, email });

    if (!id || !email) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID and email are required' 
        },
        { status: 400 }
      );
    }

    // Try to connect to MongoDB
    try {
      console.log('🔌 Attempting database connection for user sync...');
      await connectDB();
      
      console.log('📊 User model schema fields:', Object.keys(User.schema.paths));
      
      // Find existing user by email first, then by supabaseId
      let user = await User.findOne({ email: email.toLowerCase().trim() });
      
      if (user) {
        // Update existing user
        user.supabaseId = id;
        user.isOnline = true;
        user.lastActive = new Date();
        await user.save();
        console.log('👤 Updated existing user by email:', user);
      } else {
        // Try to find by supabaseId
        user = await User.findOne({ supabaseId: id });
        
        if (user) {
          // Update existing user
          user.email = email.toLowerCase().trim();
          user.isOnline = true;
          user.lastActive = new Date();
          await user.save();
          console.log('👤 Updated existing user by supabaseId:', user);
        } else {
          // Create new user
          user = await User.create({
            supabaseId: id,
            email: email.toLowerCase().trim(),
            isOnline: true,
            lastActive: new Date()
          });
          console.log('👤 Created new user:', user);
        }
      }
      
      console.log('👤 User document created/updated:', user);

      console.log('✅ User synced successfully in database');
      return NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          supabaseId: user.supabaseId,
          email: user.email,
          isOnline: user.isOnline,
          lastActive: user.lastActive
        }
      });
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      console.log('🔄 Using fallback data for user sync');
      
      // Return success even if DB is not available
      // This allows the app to work without MongoDB for now
      return NextResponse.json({
        success: true,
        user: {
          _id: id, // Using Supabase ID as fallback _id
          supabaseId: id,
          email: email,
          isOnline: true,
          lastActive: new Date().toISOString()
        },
        warning: 'Database not available - using fallback data'
      });
    }

  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync user' 
      },
      { status: 500 }
    );
  }
}
