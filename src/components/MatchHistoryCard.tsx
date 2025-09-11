"use client";

import { MatchHistory } from '@/types/matchHistory';

interface MatchHistoryCardProps {
  match: MatchHistory;
  currentPlayerId: string;
}

export default function MatchHistoryCard({ match, currentPlayerId }: MatchHistoryCardProps) {
  const isPlayer = match.playerId === currentPlayerId;
  const playerScore = isPlayer ? match.playerScore : match.opponentScore;
  const opponentScore = isPlayer ? match.opponentScore : match.playerScore;
  const playerName = isPlayer ? match.playerName : match.opponentName;
  const opponentName = isPlayer ? match.opponentName : match.playerName;
  const playerCorrect = isPlayer ? match.playerCorrectAnswers : match.opponentCorrectAnswers;
  const opponentCorrect = isPlayer ? match.opponentCorrectAnswers : match.playerCorrectAnswers;
  const isWinner = match.winner === currentPlayerId;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
        isWinner 
          ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
      role="article"
      aria-label={`Match against ${opponentName} on ${formatDate(match.timestamp)}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            vs {opponentName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(match.timestamp)}
          </p>
        </div>
        
        {/* Result Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isWinner 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {isWinner ? 'Victory' : 'Defeat'}
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Player Score */}
        <div className={`text-center p-4 rounded-lg ${
          isWinner 
            ? 'bg-green-100 dark:bg-green-900/20' 
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {playerScore}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {playerName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {playerCorrect}/{match.totalQuestions} correct
          </div>
        </div>

        {/* Opponent Score */}
        <div className={`text-center p-4 rounded-lg ${
          !isWinner 
            ? 'bg-red-100 dark:bg-red-900/20' 
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {opponentScore}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {opponentName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {opponentCorrect}/{match.totalQuestions} correct
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatDuration(match.matchDuration)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Questions:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {match.totalQuestions}
          </span>
        </div>
      </div>

      {/* Question Breakdown (Collapsible) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          View Question Details
        </summary>
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {match.questions.map((question, index) => {
            const isPlayerCorrect = isPlayer ? question.playerCorrect : question.opponentCorrect;
            const playerAnswer = isPlayer ? question.playerAnswer : question.opponentAnswer;
            
            return (
              <div 
                key={question.questionId}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Q{index + 1}: {question.question}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Your answer:</span>
                    <span className={`font-medium ${
                      isPlayerCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {playerAnswer || 'No answer'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Correct answer:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {question.correctAnswer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Points:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {isPlayerCorrect ? `+${question.points}` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
