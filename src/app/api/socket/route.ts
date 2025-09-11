import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';

interface SocketServer extends NetServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends Response {
  socket: SocketWithIO;
}

export async function GET(request: NextRequest) {
  return new Response('Socket.IO server is running', { status: 200 });
}

export async function POST(request: NextRequest) {
  return new Response('Socket.IO server is running', { status: 200 });
}

