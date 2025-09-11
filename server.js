const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || (dev ? 3001 : 3000);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Handle all Next.js routes including API routes
    handler(req, res);
  });
  
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [
            process.env.NEXT_PUBLIC_APP_URL || "https://flashcard-frenzy.vercel.app",
            "https://flashcard-frenzy.nikitabansal.xyz",
            "https://*.nikitabansal.xyz"
          ]
        : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    console.log('🔌 Socket transport:', socket.conn.transport.name);
    console.log('🔌 Total connected sockets:', io.sockets.sockets.size);
    

    socket.on('join-user-room', (userId) => {
      console.log(`👤 User ${userId} joining their personal room`);
      console.log(`👤 Socket ID: ${socket.id}`);
      socket.join(userId);
      console.log(`👤 User ${userId} joined room. Socket rooms:`, Array.from(socket.rooms));
    });


    socket.on('join-match', ({ matchId, userId }) => {
      console.log(`🎮 Player ${userId} joining match ${matchId}`);
      socket.join(matchId);
      // Only emit to other players, not the sender
      socket.to(matchId).emit('player-joined', { userId, matchId });
    });

    socket.on('answer', ({ matchId, userId, answer, questionId }) => {
      console.log(`📝 Answer received from ${userId} in match ${matchId}: ${answer}`);
      console.log(`📝 Answer data:`, { matchId, userId, answer, questionId });
      console.log(`📝 Socket ID:`, socket.id);
      
      // Emit to all players in the match, including the sender
      io.to(matchId).emit('player-answered', { 
        userId, 
        answer, 
        questionId,
        timestamp: Date.now() 
      });
      console.log(`📝 Player-answered event sent to all players in match ${matchId}`);
    });

    socket.on('challenge-player', ({ challengerId, challengerName, targetId, matchId }) => {
      console.log(`⚔️ Challenge from ${challengerName} (${challengerId}) to ${targetId}`);
      console.log(`🔍 Looking for user room: ${targetId}`);
      console.log(`🔍 Available rooms:`, Array.from(socket.rooms));
      console.log(`🔍 All connected sockets:`, io.sockets.sockets.size);
      
      // Check if target user is in a room
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) {
        console.log(`✅ Target user found in room: ${targetId}`);
        socket.to(targetId).emit('challenge-received', {
          challengerId,
          challengerName,
          matchId,
          timestamp: Date.now()
        });
        console.log(`📤 Challenge event sent to ${targetId}`);
      } else {
        console.log(`❌ Target user not found in room: ${targetId}`);
        console.log(`🔍 Available socket IDs:`, Array.from(io.sockets.sockets.keys()));
        
        // Try to emit to all connected sockets and let them filter
        io.emit('challenge-received', {
          challengerId,
          challengerName,
          matchId,
          targetId,
          timestamp: Date.now()
        });
        console.log(`📤 Challenge event broadcast to all users`);
      }
    });

    socket.on('challenge-response', ({ challengerId, targetId, accepted, matchId }) => {
      console.log(`⚔️ Challenge response: ${accepted ? 'accepted' : 'declined'} by ${targetId}`);
      if (accepted) {
        // Send challenge-accepted event to the challenger
        console.log(`📤 Sending challenge-accepted to challenger: ${challengerId}`);
        socket.to(challengerId).emit('challenge-accepted', {
          targetId,
          matchId,
          timestamp: Date.now()
        });
        
        // Send challenge-accepted event to the user who accepted (current socket)
        console.log(`📤 Sending challenge-accepted to accepter: ${targetId}`);
        socket.emit('challenge-accepted', {
          targetId,
          matchId,
          timestamp: Date.now()
        });
        
        // Both players join the match room
        console.log(`🎮 Joining match room: ${matchId}`);
        socket.join(matchId);
        socket.to(challengerId).emit('join-match', { matchId, userId: challengerId });
      } else {
        socket.to(challengerId).emit('challenge-declined', {
          targetId,
          timestamp: Date.now()
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 User disconnected:', socket.id, 'Reason:', reason);
      console.log('🔌 Remaining connected sockets:', io.sockets.sockets.size);
    });

    // Handle user leaving a match
    socket.on('leave-match', ({ matchId, userId }) => {
      socket.leave(matchId);
      // Emit to other players in the match
      socket.to(matchId).emit('player-left', { userId, matchId });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
    });
});
