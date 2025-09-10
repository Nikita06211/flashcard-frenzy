import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcard {
  question: string;
  answer: string;
  answeredBy: string | null; // userId
  isCorrect: boolean | null;
  answeredAt: Date | null;
}

export interface IGame extends Document {
  _id: string;
  matchId: mongoose.Types.ObjectId; // Reference to Match
  flashcards: IFlashcard[];
  scores: {
    player1: number;
    player2: number;
  };
  status: 'active' | 'finished';
  startedAt: Date;
  endedAt: Date | null;
}

const flashcardSchema = new Schema<IFlashcard>({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  answeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  answeredAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const gameSchema = new Schema<IGame>({
  matchId: {
    type: Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  flashcards: [flashcardSchema],
  scores: {
    player1: {
      type: Number,
      default: 0,
      min: 0
    },
    player2: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'finished'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
gameSchema.index({ matchId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ startedAt: 1 });

// Validation to ensure at least one flashcard
gameSchema.pre('save', function(this: IGame, next: (error?: Error) => void) {
  if (this.flashcards.length === 0) {
    next(new Error('A game must have at least one flashcard'));
  } else {
    next();
  }
});

// Auto-set endedAt when status changes to finished
gameSchema.pre('save', function(this: IGame, next: (error?: Error) => void) {
  if (this.isModified('status') && this.status === 'finished' && !this.endedAt) {
    this.endedAt = new Date();
  }
  next();
});

export const Game = mongoose.models.Game || mongoose.model<IGame>('Game', gameSchema);
