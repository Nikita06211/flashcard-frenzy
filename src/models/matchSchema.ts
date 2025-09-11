import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  _id: string;
  players: string[]; // Array of Supabase user IDs
  status: 'pending' | 'active' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>({
  players: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'finished'],
    default: 'pending'
  }
}, {
  timestamps: true,
  strict: false // Allow flexible schema for migration
});

// Index for efficient queries
matchSchema.index({ players: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: 1 });

// Validation to ensure exactly 2 players
matchSchema.pre('save', function(this: IMatch, next: (error?: Error) => void) {
  if (this.players.length !== 2) {
    next(new Error('A match must have exactly 2 players'));
  } else {
    next();
  }
});

// Transform players to strings if they're ObjectIds
matchSchema.pre('save', function(this: IMatch, next: (error?: Error) => void) {
  if (this.players) {
    this.players = this.players.map(player => {
      if (typeof player === 'object' && player && 'toString' in player) {
        return (player as { toString(): string }).toString();
      }
      return player;
    });
  }
  next();
});

// Clear the model cache to ensure new schema is used
if (mongoose.models.Match) {
  delete mongoose.models.Match;
}

export const Match = mongoose.model<IMatch>('Match', matchSchema);
