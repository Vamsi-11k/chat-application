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
    },

    // Feature 4: Message Forwarding
    forwardedFrom: {
      type: {
        originalSender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        },
        originalSenderName: {
          type: String,
          default: null
        },
        originalConversationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Conversation',
          default: null
        }
      },
      _id: false,
      default: null
    },

    // Feature 5: Pinned Messages (Shared per-conversation)
    pinned: {
      type: Boolean,
      default: false
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    pinnedAt: {
      type: Date,
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
