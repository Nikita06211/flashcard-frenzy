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
    
    // Try to connect to the same origin first, then fallback to localhost:3001
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : window.location.origin; // Use same origin in development too
    
    console.log('🔌 Challenge socket attempting to connect to:', socketUrl);
    
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
      console.log('🔌 Challenge socket connected:', newSocket.id, 'to', socketUrl);
      setConnected(true);
      // Join user's personal room for challenges
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Challenge socket connection error:', error);
      setConnected(false);
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
