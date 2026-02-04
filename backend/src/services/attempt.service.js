// src/services/attempt.service.js
/**
 * Attempt service (ESM) — updated to maintain user accuracy stats & leaderboard
 *
 * Key changes:
 * - submitAttempt now updates user's:
 *    - totalScore (increment by attempt.score)
 *    - totalCorrectAnswers (increment by #correct)
 *    - totalQuestionsAnswered (increment by #answered)
 *
 * All updates are done with atomic MongoDB $inc to avoid race conditions.
 */

import Attempt from '../models/attempt.model.js';
import Quiz from '../models/quiz.model.js';
import Question from '../models/question.model.js';
import BuiltInPool from '../models/builtinPool.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

function sampleArray(arr, n) {
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function toClientQuestion(q) {
  return {
    id: q._id,
    text: q.text,
    choices: (q.choices || []).map((c) => ({ id: c.id, text: c.text })),
    difficulty: q.difficulty || null,
    subject: q.subject || null
  };
}

export async function startAttempt({ userId, quizId = null, quizCode = null }) {
  if (!userId) throw new ApiError(401, 'User required');
  let quiz = null;
  if (quizId) quiz = await Quiz.findById(quizId);
  else if (quizCode) quiz = await Quiz.findOne({ quizCode });
  else throw new ApiError(400, 'quizId or quizCode required');

  if (!quiz) throw new ApiError(404, 'Quiz not found');
  if (quiz.status === 'paused') throw new ApiError(403, 'Quiz is currently paused by the instructor');
  if (quiz.status !== 'published') throw new ApiError(403, 'Quiz not open');

  let questions = [];
  if (quiz.type === 'custom') {
    questions = await Question.find({ _id: { $in: quiz.questionIds }, isActive: true }).lean();
    if (quiz.settings && quiz.settings.shuffleQuestions) questions = sampleArray(questions, questions.length);
    const count = quiz.settings && quiz.settings.questionsCount ? Number(quiz.settings.questionsCount) : questions.length;
    questions = sampleArray(questions, Math.min(count, questions.length));
  } else {
    const filter = { source: quiz.builtInFilter.category || 'aptitude' };
    if (quiz.builtInFilter.difficulty) filter.difficulty = quiz.builtInFilter.difficulty;
    if (quiz.builtInFilter.subjects && quiz.builtInFilter.subjects.length) filter.subject = { $in: quiz.builtInFilter.subjects };
    const pool = await BuiltInPool.find(filter).lean();
    const count = quiz.settings && quiz.settings.questionsCount ? Number(quiz.settings.questionsCount) : Math.min(10, pool.length);
    questions = sampleArray(pool, Math.min(count, pool.length));
  }

  const attempt = await Attempt.create({
    quizId: quiz._id,
    userId,
    startedAt: new Date(),
    answers: [],
    metadata: { quizSnapshot: { title: quiz.title } }
  });

  const clientQuestions = questions.map(toClientQuestion);
  return { attempt, questions: clientQuestions, quizSettings: quiz.settings };
}

/**
 * submitAttempt:
 * - attemptId, userId, answers: [{ questionId, choiceId }]
 * - scoring: 1 point per correct answer
 * - updates Attempt doc and increments User stats atomically
 */
export async function submitAttempt({ attemptId, userId, answers = [] }) {
  if (!attemptId || !userId) throw new ApiError(400, 'attemptId and userId required');
  if (!Array.isArray(answers)) throw new ApiError(400, 'answers must be an array');

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, 'Attempt not found');
  if (String(attempt.userId) !== String(userId)) throw new ApiError(403, 'Not allowed');

  if (attempt.finishedAt) throw new ApiError(400, 'Attempt already submitted');

  // Resolve custom question ids
  const qIds = answers.map((a) => a.questionId);
  const questions = await Question.find({ _id: { $in: qIds } }).lean();
  const qMap = new Map(questions.map((q) => [String(q._id), q]));

  let totalPoints = 0;
  const answerDocs = [];

  for (const a of answers) {
    const q = qMap.get(String(a.questionId));
    let correct = false;
    let pts = 0;

    if (q) {
      correct = String(q.correctChoiceId) === String(a.choiceId);
      pts = correct ? 1 : 0;
    } else {
      const poolQ = await BuiltInPool.findById(a.questionId).lean();
      if (poolQ) {
        correct = String(poolQ.correctChoiceId) === String(a.choiceId);
        pts = correct ? 1 : 0;
      } else {
        correct = false;
        pts = 0;
      }
    }

    totalPoints += pts;
    answerDocs.push({ questionId: a.questionId, choiceId: a.choiceId, correct, points: pts });
  }

  attempt.answers = answerDocs;
  attempt.finishedAt = new Date();
  attempt.score = totalPoints;
  attempt.maxScore = answerDocs.length; // assuming 1 per question
  await attempt.save();

  // Atomically update user's totals:
  // - totalScore (leaderboard) increases by attempt.score
  // - totalCorrectAnswers increases by #correct
  // - totalQuestionsAnswered increases by #answered
  const correctCount = totalPoints;
  const answeredCount = answerDocs.length;

  await User.findByIdAndUpdate(userId, {
    $inc: {
      totalScore: correctCount,
      totalCorrectAnswers: correctCount,
      totalQuestionsAnswered: answeredCount
    }
  });

  return { attemptId: attempt._id, score: attempt.score, maxScore: attempt.maxScore };
}

export async function getHistory({ userId, page = 1, limit = 50 } = {}) {
  if (!userId) throw new ApiError(401, 'User required');
  const p = Math.max(1, Number(page || 1));
  const l = Math.min(200, Math.max(1, Number(limit || 50)));
  const skip = (p - 1) * l;

  const [items, total] = await Promise.all([
    Attempt.find({ userId }).sort({ finishedAt: -1 }).skip(skip).limit(l).lean(),
    Attempt.countDocuments({ userId })
  ]);

  return { items, meta: { total, page: p, limit: l } };
}

export async function getAttemptById(id) {
  if (!id) return null;
  return Attempt.findById(id).lean();
}
