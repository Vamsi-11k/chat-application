import mongoose from 'mongoose';

const chatRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    message: {
      type: String,
      maxlength: 200,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate requests between the same two users
chatRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);
