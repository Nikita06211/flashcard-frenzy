"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useSocket } from "@/hooks/useSocket";

interface Player {
  _id: string;
  supabaseId: string;
  email: string;
  lastActive: string;
}

interface Props {
  player: Player;
}

export default function LobbyItem({ player }: Props) {
  const [isChallenging, setIsChallenging] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useUser();
  const userName = user?.email?.split('@')[0] || 'Player';
  
  // Initialize unified socket
  const { sendChallenge, connected: challengeConnected } = useSocket(
    user?.email || '', 
    userName
  );

  // Debug connection status
  console.log('LobbyItem: Challenge connection status:', challengeConnected, 'User ID:', user?.email, 'Target:', player.supabaseId);

  const challenge = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to challenge players');
      setChallengeStatus('error');
      return;
    }

    if (user.email === player.supabaseId) {
      setErrorMessage('You cannot challenge yourself');
      setChallengeStatus('error');
      return;
    }

    if (!challengeConnected) {
      setErrorMessage('Connection not ready. Please wait...');
      setChallengeStatus('error');
      return;
    }

    setIsChallenging(true);
    setChallengeStatus('idle');
    setErrorMessage('');

    try {
      // First test if API is reachable
      console.log('🧪 Testing API connectivity...');
      try {
        const testResponse = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true }),
        });
        const testData = await testResponse.json();
        console.log('✅ API test successful:', testData);
      } catch (testError) {
        console.error('❌ API test failed:', testError);
        setErrorMessage('API server is not reachable. Please check if the server is running.');
        setChallengeStatus('error');
        return;
      }

      // Test match endpoint specifically
      console.log('🧪 Testing match endpoint...');
      try {
        const matchTestResponse = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            player1Id: "test1", 
            player2Id: "test2" 
          }),
        });
        console.log('📡 Match endpoint test status:', matchTestResponse.status);
        const matchTestData = await matchTestResponse.json();
        console.log('📡 Match endpoint test response:', matchTestData);
      } catch (matchTestError) {
        console.error('❌ Match endpoint test failed:', matchTestError);
      }

      // First ensure both players are synced and online
      console.log('🔄 Ensuring both players are synced before creating match...');
      
      // Sync current user
      await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.email,
          email: user.email,
        }),
      });
      
      // Sync target player
      await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: player.supabaseId,
          email: player.email,
        }),
      });

      // Wait a moment for sync to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now create a match
      console.log('🚀 Creating match with:', { 
        player1Id: user.email, 
        player2Id: player.supabaseId 
      });
      
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          player1Id: user.email, 
          player2Id: player.supabaseId 
        }),
      });

      console.log('📡 Match creation response status:', response.status);
      const data = await response.json();
      console.log('📡 Match creation response data:', data);

      if (data.success) {
        // Send challenge via WebSocket - use email for WebSocket routing
        const matchId = data.match._id;
        console.log('🎯 Sending challenge to email:', player.email, 'instead of supabaseId:', player.supabaseId);
        sendChallenge(player.email, matchId);
        
        setChallengeStatus('success');
        setErrorMessage('Challenge sent! Waiting for response...');
        
        // Auto-redirect after a short delay (in case they accept)
        setTimeout(() => {
          if (challengeStatus === 'success') {
            window.location.href = `/game/${matchId}`;
          }
        }, 2000);
      } else {
        setErrorMessage(data.error || 'Failed to create match');
        setChallengeStatus('error');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setChallengeStatus('error');
      console.error('Error creating match:', error);
    } finally {
      setIsChallenging(false);
    }
  };

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return 'bg-green-500';
    if (diffInMinutes < 15) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 w-full">
      {/* Player Info */}
      <div className="flex items-center space-x-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {player.email.charAt(0).toUpperCase()}
          </div>
          {/* Online Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(player.lastActive)}`}></div>
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
            {player.email}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Last active: {formatLastActive(player.lastActive)}
          </p>
        </div>
      </div>

      {/* Challenge Button */}
      <div className="space-y-3">
        <div className="space-y-2">
          <button
            onClick={challenge}
            disabled={isChallenging || !user || user.email === player.supabaseId}
            className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
              isChallenging
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : !user
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : user.email === player.supabaseId
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:shadow-lg transform hover:scale-[1.02]'
            }`}
          >
          {isChallenging ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Challenging...</span>
            </div>
          ) : !user ? (
            'Login to Challenge'
          ) : user.email === player.supabaseId ? (
            'Yourself'
          ) : (
            'Challenge Player'
          )}
          </button>
          
        </div>

        {/* Status Messages */}
        {challengeStatus === 'success' && (
          <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium">
              ✓ Challenge sent successfully!
            </p>
          </div>
        )}

        {challengeStatus === 'error' && errorMessage && (
          <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
