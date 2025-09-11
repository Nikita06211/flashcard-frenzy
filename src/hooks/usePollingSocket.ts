"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ChallengeData {
  challengerId: string;
  challengerName: string;
  matchId: string;
  timestamp: number;
}

interface PollingSocketReturn {
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
}

export function usePollingSocket(userId: string, userName: string): PollingSocketReturn {
  const [connected, setConnected] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollRef = useRef<number>(0);

  // Polling function to check for updates
  const pollForUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/polling/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          lastPoll: lastPollRef.current 
        })
      });

      if (response.ok) {
        const data = await response.json();
        lastPollRef.current = Date.now();
        
        if (data.challenge) {
          setChallenge(data.challenge);
        }
        
        if (data.redirectToMatch) {
          router.push(`/game/${data.redirectToMatch}`);
        }
        
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch (error) {
      console.error('❌ Polling error:', error);
      setConnected(false);
    }
  }, [userId, router]);

  // Start polling
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Starting polling-based real-time updates for user:', userId);
    
    // Initial connection
    setConnected(true);
    
    // Start polling every 2 seconds
    pollingIntervalRef.current = setInterval(pollForUpdates, 2000);
    
    // Initial poll
    pollForUpdates();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [userId, pollForUpdates]);

  const sendChallenge = useCallback(async (targetId: string, matchId: string) => {
    try {
      const response = await fetch('/api/polling/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerId: userId,
          challengerName: userName,
          targetId,
          matchId
        })
      });

      if (response.ok) {
        console.log('✅ Challenge sent successfully');
      } else {
        console.error('❌ Failed to send challenge');
      }
    } catch (error) {
      console.error('❌ Error sending challenge:', error);
    }
  }, [userId, userName]);

  const respondToChallenge = useCallback(async (accepted: boolean) => {
    if (!challenge) return;

    try {
      const response = await fetch('/api/polling/challenge-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerId: challenge.challengerId,
          targetId: userId,
          accepted,
          matchId: challenge.matchId
        })
      });

      if (response.ok) {
        console.log('✅ Challenge response sent successfully');
        setChallenge(null);
      } else {
        console.error('❌ Failed to send challenge response');
      }
    } catch (error) {
      console.error('❌ Error sending challenge response:', error);
    }
  }, [challenge, userId]);

  const clearChallenge = useCallback(() => {
    setChallenge(null);
  }, []);

  const joinMatch = useCallback(async (matchId: string) => {
    try {
      const response = await fetch('/api/polling/join-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, userId })
      });

      if (response.ok) {
        console.log('✅ Joined match successfully');
      } else {
        console.error('❌ Failed to join match');
      }
    } catch (error) {
      console.error('❌ Error joining match:', error);
    }
  }, [userId]);

  const sendAnswer = useCallback(async (matchId: string, answer: string, questionId: string) => {
    try {
      const response = await fetch('/api/polling/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, userId, answer, questionId })
      });

      if (response.ok) {
        console.log('✅ Answer sent successfully');
      } else {
        console.error('❌ Failed to send answer');
      }
    } catch (error) {
      console.error('❌ Error sending answer:', error);
    }
  }, [userId]);

  const leaveMatch = useCallback(async (matchId: string) => {
    try {
      const response = await fetch('/api/polling/leave-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, userId })
      });

      if (response.ok) {
        console.log('✅ Left match successfully');
      } else {
        console.error('❌ Failed to leave match');
      }
    } catch (error) {
      console.error('❌ Error leaving match:', error);
    }
  }, [userId]);

  const cleanupMatches = useCallback(async () => {
    try {
      const response = await fetch('/api/match', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: userId })
      });
      
      if (response.ok) {
        console.log('✅ Matches cleaned up successfully');
      }
    } catch (error) {
      console.error('❌ Error cleaning up matches:', error);
    }
  }, [userId]);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting polling...');
    setConnected(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Restart polling
    setTimeout(() => {
      setConnected(true);
      pollingIntervalRef.current = setInterval(pollForUpdates, 2000);
      pollForUpdates();
    }, 1000);
  }, [pollForUpdates]);

  return {
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
