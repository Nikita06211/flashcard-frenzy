import { NextRequest, NextResponse } from 'next/server';

// This is a fallback API route for when Socket.IO server is not available
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'error', 
    message: 'Socket.IO server not available in this environment',
    suggestion: 'Use polling-based real-time updates instead'
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    status: 'error', 
    message: 'Socket.IO server not available in this environment',
    suggestion: 'Use polling-based real-time updates instead'
  }, { status: 503 });
}
