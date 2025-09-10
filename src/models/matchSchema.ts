import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  _id: string;
  players: mongoose.Types.ObjectId[]; // Array of userIds
  status: 'pending' | 'active' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>({
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'finished'],
    default: 'pending'
  }
}, {
  timestamps: true
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

export const Match = mongoose.models.Match || mongoose.model<IMatch>('Match', matchSchema);
