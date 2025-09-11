"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchHistory } from '@/hooks/useMatchHistory';
import MatchHistoryCard from '@/components/MatchHistoryCard';
import MatchHistorySummary from '@/components/MatchHistorySummary';

export default function MatchHistoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');

  // Get userId from localStorage or generate one
  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const { matches, summary, loading, error, clearHistory } = useMatchHistory(userId);

  // Debug logging
  useEffect(() => {
    console.log('📊 History page - userId:', userId);
    console.log('📊 History page - matches:', matches);
    console.log('📊 History page - loading:', loading);
    console.log('📊 History page - error:', error);
    console.log('📊 History page - localStorage userId:', localStorage.getItem('userId'));
    console.log('📊 History page - matches length:', matches?.length);
    if (matches && matches.length > 0) {
      console.log('📊 History page - first match:', matches[0]);
    }
  }, [userId, matches, loading, error]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all your match history? This action cannot be undone.')) {
      try {
        await clearHistory();
      } catch (err) {
        console.error('Error clearing history:', err);
      }
    }
  };

  const handleTestSave = async () => {
    if (!userId) return;
    
    try {
      const testMatch = {
        matchId: 'test-match-' + Date.now(),
        playerId: userId,
        opponentId: 'test-opponent',
        playerName: 'Test Player',
        opponentName: 'Test Opponent',
        playerScore: 30,
        opponentScore: 25,
        winner: userId,
        totalQuestions: 4,
        playerCorrectAnswers: 3,
        opponentCorrectAnswers: 2,
        matchDuration: 120,
        questions: [
          {
            questionId: '1',
            question: 'What is 2 + 2?',
            playerAnswer: '4',
            opponentAnswer: '4',
            correctAnswer: '4',
            playerCorrect: true,
            opponentCorrect: true,
            points: 10,
          }
        ],
      };

      const response = await fetch('/api/match-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMatch),
      });

      if (response.ok) {
        alert('Test match saved successfully!');
        window.location.reload();
      } else {
        alert('Failed to save test match');
      }
    } catch (err) {
      console.error('Error saving test match:', err);
      alert('Error saving test match');
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.push('/lobby')}
              aria-label="Return to lobby"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Lobby</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Match History
            </h1>
            <div></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading match history...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Summary */}
              {summary && (
                <div className="mb-8">
                  <MatchHistorySummary summary={summary} />
                </div>
              )}

              {/* Match History */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recent Matches ({matches.length})
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleTestSave}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                  >
                    Test Save
                  </button>
                  {matches.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      aria-label="Clear all match history"
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear History</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Match Cards */}
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No matches yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start playing games to see your match history here!
                  </p>
                  <button
                    onClick={() => router.push('/lobby')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    Go to Lobby
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="list" aria-label="Match history">
                  {matches.map((match) => (
                    <div key={match.id} role="listitem">
                      <MatchHistoryCard match={match} currentPlayerId={userId} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
