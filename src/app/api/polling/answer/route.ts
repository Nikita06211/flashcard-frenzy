import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { matchId, userId, answer, questionId } = await request.json();
    
    if (!matchId || !userId || !answer || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`📝 Answer received from ${userId} in match ${matchId}: ${answer}`);

    return NextResponse.json({ 
      success: true,
      message: 'Answer recorded successfully'
    });
  } catch (error) {
    console.error('Error recording answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
