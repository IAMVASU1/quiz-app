// src/models/quiz.model.js
/**
 * Quiz Model (ESM)
 *
 * - createdBy → faculty id
 * - quizCode → short join code for students (unique)
 * - type → custom | built-in
 * - questionIds → used for custom quizzes
 * - builtInFilter → for built-in quiz generation
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const QuizSettingsSchema = new Schema(
  {
    shuffleQuestions: { type: Boolean, default: true },
    questionsCount: { type: Number, default: 10 },
    allowMultipleAttempts: { type: Boolean, default: true },
  },
  { _id: false }
);

const BuiltInFilterSchema = new Schema(
  {
    category: { type: String, enum: ["aptitude", "technical"], default: "aptitude" },
    difficulty: { type: String, enum: ["easy", "medium", "hard", null], default: null },
    subjects: { type: [String], default: [] },
  },
  { _id: false }
);

const QuizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },

    description: { type: String, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    quizCode: { type: String, required: true, unique: true, index: true },

    status: {
      type: String,
      enum: ["draft", "published", "paused", "archived"],
      default: "draft",
    },

    type: { type: String, enum: ["custom", "built-in"], default: "custom" },

    settings: { type: QuizSettingsSchema, default: () => ({}) },

    questionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],

    builtInFilter: { type: BuiltInFilterSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Quick check to see if students can join
QuizSchema.methods.isJoinable = function () {
  return this.status === "published";
};

export default mongoose.model("Quiz", QuizSchema);
