import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchQuestion {
  questionId: string;
  question: string;
  playerAnswer: string;
  opponentAnswer: string;
  correctAnswer: string;
  playerCorrect: boolean;
  opponentCorrect: boolean;
  points: number;
}

export interface IMatchHistory extends Document {
  _id: string;
  matchId: string;
  playerId: string;
  opponentId: string;
  playerName: string;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
  winner: string; // userId of the winner
  totalQuestions: number;
  playerCorrectAnswers: number;
  opponentCorrectAnswers: number;
  matchDuration: number; // in seconds
  questions: IMatchQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const matchQuestionSchema = new Schema<IMatchQuestion>({
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  playerAnswer: { type: String, required: true },
  opponentAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  playerCorrect: { type: Boolean, required: true },
  opponentCorrect: { type: Boolean, required: true },
  points: { type: Number, required: true }
}, { _id: false });

const matchHistorySchema = new Schema<IMatchHistory>({
  matchId: { 
    type: String, 
    required: true,
    index: true 
  },
  playerId: { 
    type: String, 
    required: true,
    index: true 
  },
  opponentId: { 
    type: String, 
    required: true,
    index: true 
  },
  playerName: { type: String, required: true },
  opponentName: { type: String, required: true },
  playerScore: { type: Number, required: true, min: 0 },
  opponentScore: { type: Number, required: true, min: 0 },
  winner: { type: String, required: true },
  totalQuestions: { type: Number, required: true, min: 1 },
  playerCorrectAnswers: { type: Number, required: true, min: 0 },
  opponentCorrectAnswers: { type: Number, required: true, min: 0 },
  matchDuration: { type: Number, required: true, min: 0 },
  questions: [matchQuestionSchema]
}, {
  timestamps: true
});

// Indexes for efficient queries
matchHistorySchema.index({ playerId: 1, createdAt: -1 });
matchHistorySchema.index({ opponentId: 1, createdAt: -1 });
matchHistorySchema.index({ matchId: 1 });
matchHistorySchema.index({ winner: 1 });

// Compound index for finding matches where user is either player or opponent
matchHistorySchema.index({ playerId: 1, opponentId: 1 });

// Clear the model cache to ensure new schema is used
if (mongoose.models.MatchHistory) {
  delete mongoose.models.MatchHistory;
}

export const MatchHistory = mongoose.model<IMatchHistory>('MatchHistory', matchHistorySchema);
