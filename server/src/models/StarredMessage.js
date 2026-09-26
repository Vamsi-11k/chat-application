import mongoose from 'mongoose';

const starredMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    starredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

starredMessageSchema.index({ user: 1, message: 1 }, { unique: true });
starredMessageSchema.index({ user: 1, createdAt: -1 });

export const StarredMessage = mongoose.model('StarredMessage', starredMessageSchema);
