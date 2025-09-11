const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    console.log('🔌 Socket transport:', socket.conn.transport.name);
    console.log('🔌 Total connections:', io.engine.clientsCount);
    console.log('🔌 Socket handshake:', socket.handshake);
    

    socket.on('join-user-room', (userId) => {
      console.log(`👤 User ${socket.id} joined personal room: ${userId}`);
      socket.join(userId);
    });


    socket.on('join-match', ({ matchId, userId }) => {
      console.log(`🎮 User ${userId} (${socket.id}) joined match: ${matchId}`);
      socket.join(matchId);
      socket.to(matchId).emit('player-joined', { userId, matchId });
    });

    socket.on('answer', ({ matchId, userId, answer, questionId }) => {
      console.log(`📝 Answer received from ${userId} in match ${matchId}: ${answer}`);
      socket.to(matchId).emit('player-answered', { 
        userId, 
        answer, 
        questionId,
        timestamp: Date.now() 
      });
    });

    socket.on('challenge-player', ({ challengerId, challengerName, targetId, matchId }) => {
      console.log(`⚔️ Challenge from ${challengerName} (${challengerId}) to ${targetId}`);
      socket.to(targetId).emit('challenge-received', {
        challengerId,
        challengerName,
        matchId,
        timestamp: Date.now()
      });
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
      console.log('🔌 Remaining connections:', io.engine.clientsCount);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', socket.id, error);
    });

    // Handle user leaving a match
    socket.on('leave-match', ({ matchId, userId }) => {
      console.log(`🚪 User ${userId} leaving match ${matchId}`);
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
      console.log(`🔌 Socket.IO server ready on ws://${hostname}:${port}/api/socket`);
      console.log(`🔌 Socket.IO transports: websocket, polling`);
    });
});
