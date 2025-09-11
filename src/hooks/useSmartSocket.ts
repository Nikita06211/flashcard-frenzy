"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import { usePollingSocket } from "./usePollingSocket";

interface ChallengeData {
  challengerId: string;
  challengerName: string;
  matchId: string;
  timestamp: number;
}

interface SmartSocketReturn {
  connected: boolean;
  challenge: ChallengeData | null;
  sendChallenge: (targetId: string, matchId: string) => void;
  respondToChallenge: (accepted: boolean) => void;
  clearChallenge: () => void;
  joinMatch: (matchId: string) => void;
  sendAnswer: (matchId: string, answer: string, questionId: string) => void;
  leaveMatch: (matchId: string) => void;
  cleanupMatches: () => Promise<void>;
  forceReconnect: () => void;
  connectionType: 'websocket' | 'polling' | 'none';
}

export function useSmartSocket(userId: string, userName: string): SmartSocketReturn {
  const [usePolling, setUsePolling] = useState(false);
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'none'>('none');

  // Try WebSocket first
  const socketHook = useSocket(userId, userName);
  const pollingHook = usePollingSocket(userId, userName);

  // Check if we should use polling instead of WebSocket
  useEffect(() => {
    if (!userId) return;

    // In production, prefer polling if WebSocket fails
    if (process.env.NODE_ENV === 'production') {
      const checkSocketAvailability = async () => {
        try {
          const response = await fetch('/api/socket', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          // If socket returns 503 (service unavailable), use polling
          if (response.status === 503) {
            console.log('🔄 Socket server unavailable, switching to polling');
            setUsePolling(true);
            setConnectionType('polling');
          } else {
            console.log('🔄 Socket server available, trying WebSocket');
            setUsePolling(false);
            setConnectionType('websocket');
          }
        } catch (error) {
          console.log('🔄 Socket server check failed, using polling');
          setUsePolling(true);
          setConnectionType('polling');
        }
      };

      checkSocketAvailability();
    } else {
      // In development, try WebSocket first
      setUsePolling(false);
      setConnectionType('websocket');
    }
  }, [userId]);

  // Monitor WebSocket connection and fallback to polling if it fails
  useEffect(() => {
    if (!usePolling && socketHook.connected === false) {
      const timeout = setTimeout(() => {
        if (!socketHook.connected) {
          console.log('🔄 WebSocket connection failed, falling back to polling');
          setUsePolling(true);
          setConnectionType('polling');
        }
      }, 5000); // Wait 5 seconds for WebSocket to connect

      return () => clearTimeout(timeout);
    }
  }, [usePolling, socketHook.connected]);

  // Use the appropriate hook based on the connection type
  const activeHook = usePolling ? pollingHook : socketHook;

  // Update connection type based on actual connection status
  useEffect(() => {
    if (usePolling) {
      setConnectionType(activeHook.connected ? 'polling' : 'none');
    } else {
      setConnectionType(activeHook.connected ? 'websocket' : 'none');
    }
  }, [usePolling, activeHook.connected]);

  return {
    ...activeHook,
    connectionType
  };
}
