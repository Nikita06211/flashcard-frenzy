"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";

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

  const challenge = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to challenge players');
      setChallengeStatus('error');
      return;
    }

    if (user.id === player.supabaseId) {
      setErrorMessage('You cannot challenge yourself');
      setChallengeStatus('error');
      return;
    }

    setIsChallenging(true);
    setChallengeStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          player1Id: user.id, 
          player2Id: player.supabaseId 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChallengeStatus('success');
        // You could redirect to the match or show a success message
        console.log('Match created:', data.match);
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
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
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
            {player.email}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last active: {formatLastActive(player.lastActive)}
          </p>
        </div>
      </div>

      {/* Challenge Button */}
      <div className="space-y-3">
        <button
          onClick={challenge}
          disabled={isChallenging || !user || user.id === player.supabaseId}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isChallenging
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : !user
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : user.id === player.supabaseId
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
          ) : user.id === player.supabaseId ? (
            'Yourself'
          ) : (
            'Challenge Player'
          )}
        </button>

        {/* Status Messages */}
        {challengeStatus === 'success' && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">
              ✓ Challenge sent successfully!
            </p>
          </div>
        )}

        {challengeStatus === 'error' && errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
