"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserSync } from "@/hooks/useUserSync";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useSocket } from "@/hooks/useSocket";
import ChallengeNotification from "@/components/ChallengeNotification";
import LobbyList from "./LobbyList";

export default function Lobby() {
  // Sync user with database when they access the lobby
  useUserSync();
  const userData = useUser();
  const router = useRouter();

  // Safely destructure with default values
  const user = userData?.user || null;
  const userName = user?.email?.split('@')[0] || 'Player';
  
  // Initialize unified socket for receiving challenges
  const { challenge, respondToChallenge, clearChallenge, connected: challengeConnected, cleanupMatches, forceReconnect } = useSocket(
    user?.email || '', 
    userName
  );

  // Debug connection status
  console.log('Lobby: Challenge connection status:', challengeConnected, 'User ID:', user?.email);

  // Cleanup any existing matches when entering lobby
  useEffect(() => {
    if (user?.email && cleanupMatches) {
      console.log('🧹 Cleaning up matches when entering lobby');
      cleanupMatches();
    }
  }, [user?.email, cleanupMatches]);

  const handleLogout = async () => {
    try {
      // Update user status in database
      if (user) {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.email }),
        });
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to auth page
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${challengeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {challengeConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flashcard Frenzy Lobby
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/history')}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
                aria-label="View match history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>History</span>
              </button>
              <button
                onClick={forceReconnect}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reconnect</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Welcome, {user?.email}! Find online players and start your flashcard battle!
          </p>
        </div>

        {/* Lobby Content */}
        <div className="max-w-4xl mx-auto">
          <LobbyList />
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Challenge other players to test your knowledge with flashcards</p>
        </div>
      </div>

      {/* Challenge Notification */}
      {challenge && (
        <ChallengeNotification
          challengerName={challenge.challengerName}
          challengerId={challenge.challengerId}
          matchId={challenge.matchId}
          onAccept={() => respondToChallenge(true)}
          onDecline={() => respondToChallenge(false)}
          onClose={clearChallenge}
        />
      )}
    </div>
  );
}
