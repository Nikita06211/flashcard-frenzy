"use client";

import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface ChallengeData {
  challengerId: string;
  challengerName: string;
  matchId: string;
  timestamp: number;
}

export function useChallengeSocket(userId: string, userName: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [connected, setConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      console.log('🔌 No userId provided, skipping challenge socket connection');
      return;
    }

    console.log('🔌 Initializing challenge socket connection for user:', userId);
    
    // In development, socket server runs on port 3001, in production it runs on same port as Next.js
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3001';
    
    console.log('🔌 Challenge socket attempting to connect to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      transports: process.env.NODE_ENV === 'production' ? ['polling', 'websocket'] : ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('🔌 Challenge socket connected:', newSocket.id, 'to', socketUrl);
      setConnected(true);
      // Join user's personal room for challenges
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Challenge socket connection error:', error);
      setConnected(false);
      
      // If connection fails to localhost:3001, try same origin as fallback
      if (socketUrl === 'http://localhost:3001' && window.location.origin !== 'http://localhost:3001') {
        console.log('🔄 Challenge socket trying fallback connection to same origin:', window.location.origin);
        const fallbackSocket = io(window.location.origin, {
          path: '/api/socket',
          transports: ['polling'], // Use polling only for fallback
          timeout: 20000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          autoConnect: true
        });
        
        fallbackSocket.on('connect', () => {
          console.log('✅ Challenge fallback socket connected successfully');
          setConnected(true);
          fallbackSocket.emit('join-user-room', userId);
          setSocket(fallbackSocket);
        });
        
        fallbackSocket.on('connect_error', (fallbackError) => {
          console.error('❌ Challenge fallback socket also failed:', fallbackError);
          setConnected(false);
        });
        
        // Set up event listeners for fallback socket
        fallbackSocket.on('challenge-received', (data: ChallengeData) => {
          console.log('⚔️ Challenge received:', data);
          setChallenge(data);
        });

        fallbackSocket.on('challenge-accepted', (data: { targetId: string; matchId: string }) => {
          console.log('✅ Challenge accepted, joining match:', data.matchId);
          router.push(`/game/${data.matchId}`);
        });

        fallbackSocket.on('challenge-declined', (data: { targetId: string }) => {
          console.log('❌ Challenge declined by:', data.targetId);
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Challenge socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('challenge-received', (data: ChallengeData) => {
      console.log('⚔️ Challenge received:', data);
      setChallenge(data);
    });

    newSocket.on('challenge-accepted', (data: { targetId: string; matchId: string }) => {
      console.log('✅ Challenge accepted, joining match:', data.matchId);
      router.push(`/game/${data.matchId}`);
    });

    newSocket.on('challenge-declined', (data: { targetId: string }) => {
      console.log('❌ Challenge declined by:', data.targetId);
      // Could show a toast notification here
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up challenge socket...');
      newSocket.disconnect();
    };
  }, [userId, router]);

  const sendChallenge = (targetId: string, matchId: string) => {
    if (socket && connected) {
      console.log('⚔️ Sending challenge to:', targetId);
      socket.emit('challenge-player', {
        challengerId: userId,
        challengerName: userName,
        targetId,
        matchId
      });
    }
  };

  const respondToChallenge = (accepted: boolean) => {
    if (socket && connected && challenge) {
      console.log('⚔️ Responding to challenge:', accepted ? 'accept' : 'decline');
      socket.emit('challenge-response', {
        challengerId: challenge.challengerId,
        targetId: userId,
        accepted,
        matchId: challenge.matchId
      });
      setChallenge(null);
    }
  };

  const clearChallenge = () => {
    setChallenge(null);
  };

  return {
    socket,
    connected,
    challenge,
    sendChallenge,
    respondToChallenge,
    clearChallenge
  };
}
