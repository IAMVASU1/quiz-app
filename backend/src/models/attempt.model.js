// src/models/attempt.model.js
/**
 * Attempt / Quiz Result Model (ESM)
 *
 * - userId → student who took quiz
 * - quizId → quiz reference
 * - answers[] → chosen answers with correctness
 * - score / maxScore → computed at submission
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const AnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    choiceId: { type: String, required: true },
    correct: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
  },
  { _id: false }
);

const AttemptSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    startedAt: { type: Date, default: () => new Date() },
    finishedAt: { type: Date, default: null },

    answers: { type: [AnswerSchema], default: [] },

    // Snapshot of questions for this attempt (to calculate maxScore correctly)
    questions: [{
      questionId: { type: Schema.Types.ObjectId, ref: "Question" },
      text: String,
      choices: [{ id: String, text: String }],
      correctChoiceId: String,
      points: { type: Number, default: 1 }
    }],

    score: { type: Number, default: 0, index: true },
    maxScore: { type: Number, default: 0 },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compute score automatically
AttemptSchema.methods.computeScore = function () {
  // Use the snapshot of questions if available, otherwise fallback to answers (legacy)
  const source = this.questions && this.questions.length > 0 ? this.questions : this.answers;

  let score = 0;
  let max = 0;

  if (this.questions && this.questions.length > 0) {
    // New logic: iterate over ALL questions in the snapshot
    const answerMap = {};
    this.answers.forEach(a => {
      answerMap[String(a.questionId)] = a;
    });

    this.questions.forEach(q => {
      const qPoints = q.points || 1;
      max += qPoints;

      const submitted = answerMap[String(q.questionId)];
      if (submitted && submitted.correct) {
        score += submitted.points || qPoints; // Use stored points or question points
      }
    });
  } else {
    // Legacy logic (only counts submitted answers)
    this.answers.forEach((a) => {
      const pts = typeof a.points === "number" ? a.points : a.correct ? 1 : 0;
      score += pts;
      max += typeof a.points === "number" ? a.points : 1;
    });
  }

  this.score = score;
  this.maxScore = max;

  return { score, maxScore: max };
};

export default mongoose.model("Attempt", AttemptSchema);
