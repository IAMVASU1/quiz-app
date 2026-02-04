// src/models/user.model.js
/**
 * User model (ESM)
 *
 * Added fields for leaderboard + accuracy:
 * - totalScore: sum of correct answers across all attempts (used for leaderboard)
 * - totalCorrectAnswers: total count of correct question answers
 * - totalQuestionsAnswered: total count of questions answered (correct+incorrect)
 *
 * Virtual:
 * - accuracy: computed percentage (0-100) or null if no answers
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },

    avatar: { type: String, default: null },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320
    },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
      required: true
    },

    subjects: { type: [String], default: [] },

    // Leaderboard score (sum of correct answers across all attempts)
    totalScore: { type: Number, default: 0, index: true },

    // Stats used to compute accuracy
    totalCorrectAnswers: { type: Number, default: 0 },
    totalQuestionsAnswered: { type: Number, default: 0 },

    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

/**
 * Virtual accuracy: percentage (0-100) rounded to 2 decimals, or null if no questions answered.
 */
UserSchema.virtual('accuracy').get(function () {
  if (!this.totalQuestionsAnswered || this.totalQuestionsAnswered === 0) return null;
  const v = (this.totalCorrectAnswers / this.totalQuestionsAnswered) * 100;
  return Math.round(v * 100) / 100; // two decimals
});

/**
 * toPublic: returns safe public profile including computed accuracy
 */
UserSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    subjects: this.subjects,
    totalScore: this.totalScore,
    totalCorrectAnswers: this.totalCorrectAnswers,
    totalQuestionsAnswered: this.totalQuestionsAnswered,
    accuracy: this.accuracy,
    metadata: this.metadata,
    createdAt: this.createdAt
  };
};

export default mongoose.model('User', UserSchema);
