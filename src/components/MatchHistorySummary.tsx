"use client";

import { MatchHistorySummary as Summary } from '@/types/matchHistory';

interface MatchHistorySummaryProps {
  summary: Summary;
}

export default function MatchHistorySummary({ summary }: MatchHistorySummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700" role="region" aria-label="Match history statistics">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Your Statistics
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Matches */}
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalMatches}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Matches
          </div>
        </div>

        {/* Win Rate */}
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Win Rate
          </div>
        </div>

        {/* Average Score */}
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.averageScore.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Score
          </div>
        </div>

        {/* Best Score */}
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {summary.bestScore}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Best Score
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {summary.wins}W - {summary.losses}L
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Win-Loss Record
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {summary.accuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Accuracy
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {summary.correctAnswers}/{summary.totalQuestionsAnswered}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Questions Answered
          </div>
        </div>
      </div>
    </div>
  );
}
