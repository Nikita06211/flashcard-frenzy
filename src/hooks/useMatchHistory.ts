"use client";

import { useState, useEffect, useCallback } from 'react';
import { MatchHistory, MatchHistorySummary } from '@/types/matchHistory';

export function useMatchHistory(playerId: string) {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [summary, setSummary] = useState<MatchHistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchHistory = useCallback(async () => {
    if (!playerId) {
      console.log('🔄 No playerId provided, skipping fetch');
      return;
    }

    console.log('🔄 Fetching match history for player:', playerId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/match-history?playerId=${playerId}`);
      console.log('🔄 Fetch response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔄 Fetch error response:', errorText);
        throw new Error(`Failed to fetch match history: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('🔄 Fetched match data:', data);
      setMatches(data.matches);
      
      // Calculate summary statistics
      if (data.matches.length > 0) {
        const summary = calculateSummary(data.matches, playerId);
        setSummary(summary);
        console.log('🔄 Calculated summary:', summary);
      } else {
        console.log('🔄 No matches found for player');
      }
    } catch (err) {
      console.error('❌ Error fetching match history:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const saveMatch = useCallback(async (matchData: Omit<MatchHistory, 'id' | 'timestamp'>) => {
    try {
      console.log('🔄 Saving match via API:', matchData);
      
      const response = await fetch('/api/match-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      console.log('🔄 API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔄 API error response:', errorText);
        throw new Error(`Failed to save match: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('🔄 API success response:', result);

      // Refresh the match history
      console.log('🔄 Refreshing match history...');
      await fetchMatchHistory();
      
      return result;
    } catch (err) {
      console.error('❌ Error saving match:', err);
      throw err;
    }
  }, [fetchMatchHistory]);

  const clearHistory = useCallback(async () => {
    if (!playerId) return;

    try {
      const response = await fetch(`/api/match-history?playerId=${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear match history');
      }

      setMatches([]);
      setSummary(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [playerId]);

  useEffect(() => {
    fetchMatchHistory();
  }, [fetchMatchHistory]);

  return {
    matches,
    summary,
    loading,
    error,
    saveMatch,
    clearHistory,
    refresh: fetchMatchHistory,
  };
}

function calculateSummary(matches: MatchHistory[], playerId: string): MatchHistorySummary {
  const totalMatches = matches.length;
  let wins = 0;
  let totalScore = 0;
  let bestScore = 0;
  let totalQuestionsAnswered = 0;
  let correctAnswers = 0;

  matches.forEach(match => {
    const isPlayer = match.playerId === playerId;
    const playerScore = isPlayer ? match.playerScore : match.opponentScore;
    const playerCorrect = isPlayer ? match.playerCorrectAnswers : match.opponentCorrectAnswers;
    
    totalScore += playerScore;
    bestScore = Math.max(bestScore, playerScore);
    totalQuestionsAnswered += match.totalQuestions;
    correctAnswers += playerCorrect;
    
    if (match.winner === playerId) {
      wins++;
    }
  });

  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const averageScore = totalMatches > 0 ? totalScore / totalMatches : 0;
  const accuracy = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0;

  return {
    totalMatches,
    wins,
    losses,
    winRate,
    averageScore,
    bestScore,
    totalQuestionsAnswered,
    correctAnswers,
    accuracy,
  };
}
