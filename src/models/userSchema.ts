import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  supabaseId: string; // Supabase user ID (UUID)
  email: string;
  isOnline: boolean;
  lastActive: Date;
}

const userSchema = new Schema<IUser>({
  supabaseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries (removed duplicate email index)
userSchema.index({ isOnline: 1 });
userSchema.index({ lastActive: 1 });

// Clear any existing model to ensure fresh schema
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User = mongoose.model<IUser>('User', userSchema);
