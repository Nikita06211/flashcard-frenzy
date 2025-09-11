"use client";

interface PlayerScore {
  score: number;
  name: string;
  answers: { [questionId: string]: boolean };
}

interface ScoreboardProps {
  scores: { [key: string]: PlayerScore };
}

export default function Scoreboard({ scores }: ScoreboardProps) {
  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => b.score - a.score)
    .map(([userId, playerData], index) => ({
      userId,
      score: playerData.score,
      name: playerData.name,
      rank: index + 1
    }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700" role="region" aria-label="Game scoreboard">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Scoreboard
        </h3>
      </div>

      {sortedScores.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No scores yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Start answering questions to see scores!
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Player rankings">
          {sortedScores.map(({ userId, score, name, rank }) => (
            <div
              key={userId}
              role="listitem"
              aria-label={`${name}, rank ${rank}, ${score} points`}
              className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                rank === 1
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700'
                  : rank === 2
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600'
                  : rank === 3
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700'
                  : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    rank === 1
                      ? 'bg-yellow-500 text-white'
                      : rank === 2
                      ? 'bg-gray-400 text-white'
                      : rank === 3
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-label={`Rank ${rank}`}
                >
                  <span aria-hidden="true">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</span>
                </div>

                {/* Player Info */}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Player ID: {userId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {score}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {score === 1 ? 'point' : 'points'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Players */}
      {sortedScores.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>Total Players:</span>
            <span className="font-semibold">{sortedScores.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
