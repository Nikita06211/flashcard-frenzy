export interface MatchHistory {
  id: string;
  matchId: string;
  playerId: string;
  opponentId: string;
  playerName: string;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
  winner: string; // playerId of the winner
  totalQuestions: number;
  playerCorrectAnswers: number;
  opponentCorrectAnswers: number;
  matchDuration: number; // in seconds
  timestamp: number;
  questions: {
    questionId: string;
    question: string;
    playerAnswer: string;
    opponentAnswer: string;
    correctAnswer: string;
    playerCorrect: boolean;
    opponentCorrect: boolean;
    points: number;
  }[];
}

export interface MatchHistorySummary {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
}
