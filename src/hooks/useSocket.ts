"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface ChallengeData {
  challengerId: string;
  challengerName: string;
  matchId: string;
  timestamp: number;
}

export function useSocket(userId: string, userName: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log('🔌 No userId provided, skipping socket connection');
      return;
    }

    // If socket already exists, check if it's actually connected
    if (socketRef.current) {
      console.log('🔌 Socket already exists, checking connection status');
      console.log('🔌 Existing socket connected:', socketRef.current.connected);
      console.log('🔌 Existing socket ID:', socketRef.current.id);
      
      // If the existing socket is not connected, disconnect it and create a new one
      if (!socketRef.current.connected) {
        console.log('🔌 Existing socket is not connected, disconnecting and creating new one');
        socketRef.current.disconnect();
        socketRef.current = null;
      } else {
        console.log('🔌 Reusing existing connected socket');
      setSocket(socketRef.current);
        setConnected(true);
      return;
      }
    }

    console.log('🔌 Initializing unified socket connection for user:', userId);
    
    // Try to connect to the same origin first, then fallback to localhost:3001
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : window.location.origin; // Use same origin in development too
    
    console.log('🔌 Attempting to connect to socket URL:', socketUrl);
    
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Join user's personal room for challenges
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('❌ Attempted URL:', socketUrl);
      setConnected(false);
      
      // If connection fails to same origin, try localhost:3001 as fallback
      if (socketUrl === window.location.origin && window.location.origin !== 'http://localhost:3001') {
        console.log('🔄 Trying fallback connection to localhost:3001');
        const fallbackSocket = io('http://localhost:3001', {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          autoConnect: true
        });
        
        fallbackSocket.on('connect', () => {
          setConnected(true);
          fallbackSocket.emit('join-user-room', userId);
          setSocket(fallbackSocket);
        });
        
        fallbackSocket.on('connect_error', (fallbackError) => {
          console.error('❌ Fallback socket also failed:', fallbackError);
          setConnected(false);
        });
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
      setConnected(false);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after maximum attempts');
      setConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
    });


    // Challenge events
    newSocket.on('challenge-received', (data: ChallengeData) => {
      console.log('⚔️ Challenge received:', data);
      setChallenge(data);
    });

    newSocket.on('challenge-accepted', (data: { targetId: string; matchId: string }) => {
      console.log('✅ Challenge accepted, joining match:', data.matchId);
      console.log('✅ Challenge accepted data:', data);
      console.log('✅ Current user ID:', userId);
      router.push(`/game/${data.matchId}`);
    });

    newSocket.on('challenge-declined', (data: { targetId: string }) => {
      console.log('❌ Challenge declined by:', data.targetId);
      // Could show a toast notification here
    });

    // Game events
    newSocket.on('player-joined', ({ userId: joinedUserId, matchId: roomId }) => {
    });

    newSocket.on('player-answered', ({ userId: answerUserId, answer, questionId, timestamp }) => {
      console.log(`📝 Player ${answerUserId} answered: ${answer} for question ${questionId}`);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, router]);

  const sendChallenge = (targetId: string, matchId: string) => {
    if (socket && connected) {
      console.log('⚔️ Sending challenge to:', targetId);
      console.log('⚔️ Challenge data:', { challengerId: userId, challengerName: userName, targetId, matchId });
      socket.emit('challenge-player', {
        challengerId: userId,
        challengerName: userName,
        targetId,
        matchId
      });
    } else {
      console.error('❌ Cannot send challenge - socket not connected');
      console.error('❌ Socket:', socket);
      console.error('❌ Connected:', connected);
    }
  };

  const respondToChallenge = (accepted: boolean) => {
    if (socket && connected && challenge) {
      console.log('⚔️ Responding to challenge:', accepted ? 'accept' : 'decline');
      
      const responseData = {
        challengerId: challenge.challengerId,
        targetId: userId,
        accepted,
        matchId: challenge.matchId
      };
      
      console.log('⚔️ Emitting challenge-response event...');
      socket.emit('challenge-response', responseData);
      console.log('⚔️ Event emitted successfully');
      
      setChallenge(null);
    } else {
      console.error('❌ Cannot respond to challenge');
      console.error('❌ Socket:', socket);
      console.error('❌ Connected:', connected);
      console.error('❌ Challenge:', challenge);
    }
  };

  const clearChallenge = () => {
    setChallenge(null);
  };

  const joinMatch = useCallback((matchId: string) => {
    if (socket && connected) {
      console.log('🎮 Joining match:', matchId, 'for user:', userId);
      socket.emit('join-match', { matchId, userId });
    }
  }, [socket, connected, userId]);

  const sendAnswer = useCallback((matchId: string, answer: string, questionId: string) => {
    if (socket && connected) {
      console.log('📤 Sending answer:', answer);
      console.log('📤 Answer data:', { matchId, userId, answer, questionId });
      socket.emit('answer', {
        matchId,
        userId,
        answer,
        questionId
      });
      console.log('📤 Answer event emitted successfully');
    } else {
      console.error('❌ Cannot send answer - socket not connected');
      console.error('❌ Socket:', socket);
      console.error('❌ Connected:', connected);
    }
  }, [socket, connected, userId]);

  const leaveMatch = useCallback((matchId: string) => {
    if (socket && connected) {
      socket.emit('leave-match', { matchId, userId });
    }
  }, [socket, connected, userId]);

  const cleanupMatches = useCallback(async () => {
    try {
      const response = await fetch('/api/match', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: userId })
      });
      
      const data = await response.json();
    } catch (error) {
      console.error('Error cleaning up matches:', error);
    }
  }, [userId]);

  const forceReconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
    
    // Trigger a new connection by updating the effect
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : window.location.origin;
    
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Force reconnect error:', error);
      setConnected(false);
    });

    // Set up all the event listeners again
    newSocket.on('challenge-received', (data: ChallengeData) => {
      console.log('⚔️ Challenge received:', data);
      setChallenge(data);
    });

    newSocket.on('challenge-accepted', (data: { targetId: string; matchId: string }) => {
      console.log('✅ Challenge accepted, joining match:', data.matchId);
      console.log('✅ Challenge accepted data:', data);
      console.log('✅ Current user ID:', userId);
      router.push(`/game/${data.matchId}`);
    });

    newSocket.on('challenge-declined', (data: { targetId: string }) => {
      console.log('❌ Challenge declined by:', data.targetId);
    });

    newSocket.on('player-joined', ({ userId: joinedUserId, matchId: roomId }) => {
    });

    newSocket.on('player-answered', ({ userId: answerUserId, answer, questionId, timestamp }) => {
      console.log(`📝 Player ${answerUserId} answered: ${answer} for question ${questionId}`);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  return {
    socket,
    connected,
    challenge,
    sendChallenge,
    respondToChallenge,
    clearChallenge,
    joinMatch,
    sendAnswer,
    leaveMatch,
    cleanupMatches,
    forceReconnect
  };
}

