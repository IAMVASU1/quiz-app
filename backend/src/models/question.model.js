// src/models/question.model.js (partial — add fingerprint field and index)
import mongoose from "mongoose";
const { Schema } = mongoose;
import crypto from "crypto";

const ChoiceSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    choices: { type: [ChoiceSchema], required: true },
    correctChoiceId: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    subject: { type: String, default: null },
    tags: { type: [String], default: [] },
    explanation: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // <-- fingerprint for dedupe: SHA256 of normalized question text + ordered choices
    fingerprint: { type: String, index: true, unique: true, sparse: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// helper to compute fingerprint (normalized text + choices)
QuestionSchema.statics.computeFingerprint = function (text, choices) {
  const normalizedText = (text || "").trim().toLowerCase();
  // Normalize choices order + text: keep order to preserve meaning; trim & lower
  const normalizedChoices = (choices || []).map((c) =>
    String(c.text || "")
      .trim()
      .toLowerCase()
  );
  const payload = normalizedText + "||" + normalizedChoices.join("||");
  return crypto.createHash("sha256").update(payload).digest("hex");
};

// before saving, if fingerprint not provided, compute it
QuestionSchema.pre("save", function (next) {
  if (!this.fingerprint) {
    try {
      this.fingerprint = mongoose
        .model("Question")
        .computeFingerprint(this.text, this.choices);
    } catch (e) {
      // ignore and continue
    }
  }
  next();
});

export default mongoose.model("Question", QuestionSchema);
