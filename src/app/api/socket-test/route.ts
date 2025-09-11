import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test if we can reach the socket server
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/socket`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'Socket server is accessible',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Socket server is not accessible',
        statusCode: response.status
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Socket server connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
