"use client";

import { useUser } from "@/hooks/useUser";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Game from "@/features/game/Game";
import AuthGuard from "@/components/AuthGuard";

export default function GamePage() {
  return (
    <AuthGuard>
      <GamePageContent />
    </AuthGuard>
  );
}

function GamePageContent() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const userData = useUser();
  
  // Safely destructure with default values
  const user = userData?.user || null;
  const loading = userData?.loading || false;

  // Only check for matchId, AuthGuard handles authentication
  useEffect(() => {
    if (!loading && !matchId) {
      console.log('GamePage: No matchId provided, redirecting to lobby');
      router.push('/lobby');
    }
  }, [loading, matchId, router]);

  // Show loading while AuthGuard is checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // If no matchId, show error (AuthGuard will handle auth)
  if (!matchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Match</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No match ID provided</p>
          <button
            onClick={() => router.push('/lobby')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // AuthGuard ensures user is authenticated, so we can safely use user.id
  return (
    <Game 
      matchId={matchId} 
      userId={user?.id || ''} 
    />
  );
}
