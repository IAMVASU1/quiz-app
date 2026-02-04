// src/controllers/attempt.controller.js
/**
 * Attempt controller (ESM VERSION)
 */

import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import Attempt from "../models/attempt.model.js";
import BuiltInPool from "../models/builtinPool.model.js";
import User from "../models/user.model.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * Helper: sample N items from array
 */
function sampleArray(arr, n) {
  const copy = arr.slice();
  const result = [];
  while (result.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * POST /api/v1/attempts/start
 */
export const start = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || (user.role !== "student" && user.role !== "admin")) {
    throw new ApiError(403, "Only students and admins can start attempts");
  }

  const { quizId, quizCode } = req.body;
  let quiz;

  if (quizId) quiz = await Quiz.findById(quizId);
  else if (quizCode) quiz = await Quiz.findOne({ quizCode });
  else throw new ApiError(400, "quizId or quizCode required");

  if (!quiz) throw new ApiError(404, "Quiz not found");
  if (!quiz.isJoinable || quiz.status !== "published") {
    throw new ApiError(403, "Quiz is not open");
  }

  let questions = [];

  if (quiz.questionIds && quiz.questionIds.length > 0) {
    questions = await Question.find({
      _id: { $in: quiz.questionIds },
      isActive: true,
    }).lean();

    if (quiz.settings?.shuffleQuestions) {
      questions = sampleArray(questions, questions.length);
    }

    const count = quiz.settings?.questionsCount
      ? parseInt(quiz.settings.questionsCount, 10)
      : questions.length;

    questions = sampleArray(questions, Math.min(count, questions.length));
  } else {
    // Fallback for purely dynamic quizzes (legacy or specific use case)
    const filter = { source: quiz.builtInFilter.category || "aptitude" };

    if (quiz.builtInFilter.difficulty)
      filter.difficulty = quiz.builtInFilter.difficulty;

    if (quiz.builtInFilter.subjects?.length)
      filter.subject = { $in: quiz.builtInFilter.subjects };

    const poolItems = await BuiltInPool.find(filter).lean();

    const count =
      quiz.settings?.questionsCount || Math.min(10, poolItems.length);

    questions = sampleArray(poolItems, Math.min(count, poolItems.length));
  }

  if (!questions || questions.length === 0) {
    throw new ApiError(404, "No questions found for this quiz");
  }

  const attempt = await Attempt.create({
    quizId: quiz._id,
    userId: user.id,
    startedAt: new Date(),
    answers: [],
    questions: questions.map(q => ({
      questionId: q._id,
      text: q.text,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
      points: q.points || 1
    })),
    metadata: {
      quizSnapshot: {
        title: quiz.title,
      },
    },
  });

  const clientQuestions = questions.map((q) => ({
    id: q._id,
    text: q.text,
    choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    difficulty: q.difficulty,
    subject: q.subject,
  }));

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      questions: clientQuestions,
      quizSettings: quiz.settings,
    },
  });
});

/**
 * POST /api/v1/attempts/:id/submit
 */
export const submit = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user || (user.role !== "student" && user.role !== "admin")) {
    throw new ApiError(403, "Only students and admins can submit attempts");
  }

  const { id } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers))
    throw new ApiError(400, "answers array is required");

  const attempt = await Attempt.findById(id);
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (String(attempt.userId) !== String(user.id))
    throw new ApiError(403, "Not allowed");
  if (attempt.finishedAt) throw new ApiError(400, "Attempt already submitted");

  // Use the snapshot of questions saved in the attempt
  const attemptQuestions = attempt.questions || [];

  // Create a map for quick lookup
  const questionMap = {};
  attemptQuestions.forEach(q => {
    questionMap[String(q.questionId)] = q;
  });

  let totalPoints = 0;
  let maxPoints = 0;
  const answerDocs = [];

  // Process all questions in the attempt (not just submitted answers)
  for (const q of attemptQuestions) {
    const qId = String(q.questionId);
    const submittedAnswer = answers.find(a => String(a.questionId) === qId);

    let correct = false;
    let pts = 0;
    const qPoints = q.points || 1;
    maxPoints += qPoints;

    if (submittedAnswer) {
      correct = String(q.correctChoiceId) === String(submittedAnswer.choiceId);
      pts = correct ? qPoints : 0;

      answerDocs.push({
        questionId: q.questionId,
        choiceId: submittedAnswer.choiceId,
        correct,
        points: pts,
      });
    }

    totalPoints += pts;
  }

  attempt.answers = answerDocs;
  attempt.finishedAt = new Date();
  attempt.computeScore();
  await attempt.save();

  await User.findByIdAndUpdate(user.id, {
    $inc: {
      totalScore: attempt.score,
      totalCorrectAnswers: attempt.answers.filter((a) => a.correct).length,
      totalQuestionsAnswered: attempt.answers.length,
    },
  });

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      score: attempt.score,
      maxScore: attempt.maxScore,
      questions: attempt.questions, // Include full questions snapshot
      answers: attempt.answers      // Include user answers
    },
  });
});

/**
 * GET /api/v1/attempts/history
 */
export const history = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user || (user.role !== "student" && user.role !== "admin" && user.role !== "faculty"))
    throw new ApiError(403, "Only students, admins, and faculty can view history");

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Attempt.find({ userId: user.id })
      .sort({ finishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attempt.countDocuments({ userId: user.id }),
  ]);

  res.json({
    success: true,
    data: { items, meta: { total, page, limit } },
  });
});

/**
 * GET /api/v1/attempts/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const user = req.user;
  const attempt = await Attempt.findById(req.params.id).lean();

  if (!attempt) throw new ApiError(404, "Attempt not found");

  if (
    user.role === "student" &&
    String(attempt.userId) !== String(user.id)
  ) {
    throw new ApiError(403, "Not allowed");
  }

  // Legacy support: if questions snapshot is missing, reconstruct it
  if (!attempt.questions || attempt.questions.length === 0) {
    const questionIds = attempt.answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();

    // Map back to snapshot format
    attempt.questions = questions.map(q => ({
      questionId: q._id,
      text: q.text,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
      points: q.points || 1
    }));
  }

  res.json({ success: true, data: attempt });
});

/**
 * POST /api/v1/attempts/practice
 * Generate a practice quiz (student)
 */
export const practice = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || (user.role !== "student" && user.role !== "admin")) {
    throw new ApiError(403, "Only students and admins can start practice attempts");
  }

  const { subjects = [], limit = 10 } = req.body;

  // 1. Create a temporary/private quiz for this practice session
  const quiz = await Quiz.create({
    title: `Practice: ${subjects.length > 0 ? subjects.join(", ") : "General"}`,
    description: "Auto-generated practice quiz",
    type: "built-in",
    status: "published",
    createdBy: user.id,
    quizCode: `PRAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isJoinable: false,
    builtInFilter: {
      source: "technical",
      subjects: subjects.length > 0 ? subjects : undefined,
    },
    settings: {
      questionsCount: limit,
      timeLimit: 0,
      shuffleQuestions: true,
      showResultsImmediately: true,
    },
  });

  // 2. Fetch questions with equal distribution
  let selectedQuestions = [];

  if (subjects.length > 0) {
    const baseCount = Math.floor(limit / subjects.length);
    let remainder = limit % subjects.length;

    for (const subject of subjects) {
      const targetCount = baseCount + (remainder > 0 ? 1 : 0);
      remainder--;

      if (targetCount <= 0) continue;

      let subjectRegex;
      if (subject.trim().toLowerCase() === 'aptitude') {
        subjectRegex = /^(Aptitude|Apptitude)$/i;
      } else {
        subjectRegex = new RegExp(`^${subject.trim()}$`, 'i');
      }

      const builtInFilter = { subject: subjectRegex };
      const customFilter = { isActive: true, subject: subjectRegex };

      const [poolItems, customItems] = await Promise.all([
        BuiltInPool.find(builtInFilter).lean(),
        Question.find(customFilter).lean()
      ]);

      const normalizedCustomItems = customItems.map(q => ({
        _id: q._id,
        text: q.text,
        choices: q.choices,
        correctChoiceId: q.correctChoiceId,
        difficulty: q.difficulty,
        subject: q.subject,
        points: 1
      }));

      const allSubjectItems = [...poolItems, ...normalizedCustomItems];
      const subjectSamples = sampleArray(allSubjectItems, Math.min(targetCount, allSubjectItems.length));
      selectedQuestions = selectedQuestions.concat(subjectSamples);
    }
  } else {
    // General practice (no specific subjects)
    const builtInFilter = { source: "technical" };
    const customFilter = { isActive: true };

    const [poolItems, customItems] = await Promise.all([
      BuiltInPool.find(builtInFilter).lean(),
      Question.find(customFilter).lean()
    ]);

    const normalizedCustomItems = customItems.map(q => ({
      _id: q._id,
      text: q.text,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
      difficulty: q.difficulty,
      subject: q.subject,
      points: 1
    }));

    const allItems = [...poolItems, ...normalizedCustomItems];
    selectedQuestions = sampleArray(allItems, Math.min(limit, allItems.length));
  }

  // Shuffle the final set so subjects are mixed
  selectedQuestions = sampleArray(selectedQuestions, selectedQuestions.length);

  if (selectedQuestions.length === 0) {
    await Quiz.findByIdAndDelete(quiz._id);
    throw new ApiError(404, "No questions found for the selected subjects");
  }

  // 3. Create Attempt
  const attempt = await Attempt.create({
    quizId: quiz._id,
    userId: user.id,
    startedAt: new Date(),
    answers: [],
    questions: selectedQuestions.map(q => ({
      questionId: q._id,
      text: q.text,
      choices: q.choices,
      correctChoiceId: q.correctChoiceId,
      points: 1
    })),
    metadata: {
      quizSnapshot: {
        title: quiz.title,
        isPractice: true
      },
    },
  });

  const clientQuestions = selectedQuestions.map((q) => ({
    id: q._id,
    text: q.text,
    choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    difficulty: q.difficulty,
    subject: q.subject,
  }));

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      questions: clientQuestions,
      quizSettings: quiz.settings,
      quizTitle: quiz.title,
    },
  });
});

/**
 * GET /api/v1/attempts/user/:userId
 * Admin only: list attempts for a specific user
 */
export const listByUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    throw new ApiError(403, "Admin only");
  }

  const { userId } = req.params;
  const attempts = await Attempt.find({ userId }).sort({ finishedAt: -1 }).lean();

  res.json({ success: true, data: attempts });
});

/**
 * GET /api/v1/attempts/quiz/:quizId
 * Faculty/Admin: list all attempts for a specific quiz
 */
export const listByQuiz = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || (user.role !== "admin" && user.role !== "faculty")) {
    throw new ApiError(403, "Admin or Faculty only");
  }

  const { quizId } = req.params;

  // Fetch attempts and populate user details (email, name)
  const attempts = await Attempt.find({ quizId })
    .populate('userId', 'email name')
    .sort({ finishedAt: -1 })
    .lean();

  res.json({ success: true, data: attempts });
});
