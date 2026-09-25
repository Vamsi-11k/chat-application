import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
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
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    readAt: {
      type: Date,
      default: null
    },

    // Feature 1: Editing & Soft-Deletion
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },

    // Feature 2: Emoji Reactions (Multi-Emoji per user with toggle and timestamp)
    reactions: [
      {
        emoji: {
          type: String,
          required: true
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        reactedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Feature 3: Quote-Reply to a Message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ text: 'text' });

export const Message = mongoose.model('Message', messageSchema);
