// src/models/builtinPool.model.js
/**
 * Built-in Question Pool Model (ESM)
 *
 * Stores aptitude & technical questions separately from custom faculty questions.
 */

import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const { Schema } = mongoose;

const PoolChoiceSchema = new Schema(
  {
    id: { type: String, default: () => uuid() },
    text: { type: String, required: true },
  },
  { _id: false }
);

const BuiltInPoolSchema = new Schema(
  {
    source: { type: String, enum: ["aptitude", "technical"], required: true, index: true },

    difficulty: { type: String, enum: ["easy", "medium", "hard", null], default: null, index: true },

    subject: { type: String, default: null, index: true },

    refQuestion: { type: Schema.Types.ObjectId, ref: "Question", default: null },

    text: { type: String, required: true },

    choices: { type: [PoolChoiceSchema], required: true },

    correctChoiceId: { type: String, required: true },

    tags: { type: [String], default: [] },

    explanation: { type: String, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Convert to client format (remove correct answer)
BuiltInPoolSchema.methods.toClientQuestion = function (opts = { includeCorrect: false }) {
  const base = {
    id: this._id,
    text: this.text,
    choices: this.choices.map((c) => ({ id: c.id, text: c.text })),
    difficulty: this.difficulty,
    subject: this.subject,
    tags: this.tags,
  };

  if (opts.includeCorrect) base.correctChoiceId = this.correctChoiceId;

  return base;
};

export default mongoose.model("BuiltInPool", BuiltInPoolSchema);
