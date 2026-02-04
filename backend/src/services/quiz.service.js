// src/services/quiz.service.js
/**
 * Quiz service (ESM) — extended for Excel-backed quiz creation and built-in subject sampling.
 *
 * Exports default object with functions:
 *  - createQuiz(opts)
 *  - createFromExcel(opts)   // core new function for custom quiz using uploaded excel
 *  - createBuiltInQuiz(opts) // new function uses BuiltInPool + subjects selection
 *  - updateQuiz, archiveQuiz, getQuizById, getQuizByCode, listQuizzes
 *
 * Implementation notes:
 *  - For createFromExcel: we parse filePath with parseQuestionsFromFile (xlsx util),
 *    insert valid questions into Question collection (createdBy), sample the requested count,
 *    create a Quiz document with questionIds referencing new Question docs.
 *  - For createBuiltInQuiz: we sample from BuiltInPool by provided subjects / difficulty.
 */

import path from 'path';
import fs from 'fs';
import { parseQuestionsFromFile } from '../utils/excelParser.util.js';
import Question from '../models/question.model.js';
import BuiltInPool from '../models/builtinPool.model.js';
import Quiz from '../models/quiz.model.js';
import ApiError from '../utils/ApiError.js';
import { generateUniqueCode } from '../utils/codeGen.util.js';

function sampleArray(arr, n) {
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export const createQuiz = async ({ title, description = null, createdBy, type = 'custom', settings = {}, questionIds = [], builtInFilter = {}, status = 'published' }) => {
  if (!title) throw new ApiError(400, 'title is required');
  if (!createdBy) throw new ApiError(400, 'createdBy is required');

  const quizCode = await generateUniqueCode(6);
  const quiz = await Quiz.create({
    title,
    description,
    createdBy,
    quizCode,
    type,
    settings,
    questionIds,
    builtInFilter,
    status
  });
  return quiz;
};

/**
 * Create a custom quiz from an uploaded Excel file.
 *
 * opts: { title, description, createdBy, filePath, questionsCount (optional), settings }
 */
export const createFromExcel = async ({ title, description = null, createdBy, filePath, questionsCount = null, settings = {} }) => {
  if (!filePath) throw new ApiError(400, 'filePath is required for Excel import');
  if (!fs.existsSync(filePath)) throw new ApiError(400, 'Uploaded file not found on server');

  // Parse the file (first sheet by default)
  const { parsed, errors } = await parseQuestionsFromFile(filePath, {});
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ApiError(400, 'No valid questions found in Excel', errors || []);
  }

  // Sample questions FIRST (if count provided)
  let questionsToProcess = parsed;
  if (questionsCount && Number(questionsCount) > 0) {
    const n = Math.min(parsed.length, Number(questionsCount));
    questionsToProcess = sampleArray(parsed, n);
  }

  // Insert or Reuse questions
  const finalQuestionIds = [];

  for (const row of questionsToProcess) {
    // validate minimal fields
    if (!row.text || !Array.isArray(row.choices) || row.choices.length < 2 || !row.correctChoiceId) {
      continue;
    }

    // Compute fingerprint to check for duplicates
    const fingerprint = Question.computeFingerprint(row.text, row.choices);

    // Try to find existing question
    let question = await Question.findOne({ fingerprint });

    if (!question) {
      // Create new if not found
      try {
        question = await Question.create({
          text: row.text,
          choices: row.choices,
          correctChoiceId: row.correctChoiceId,
          difficulty: row.difficulty || 'easy',
          subject: row.subject || null,
          explanation: row.explanation || null,
          createdBy,
          fingerprint // Explicitly set fingerprint
        });
      } catch (err) {
        // If race condition caused duplicate insert, try finding it again
        if (err.code === 11000) {
          question = await Question.findOne({ fingerprint });
        } else {
          throw err; // Rethrow other errors
        }
      }
    }

    if (question) {
      finalQuestionIds.push(question._id);
    }
  }

  if (finalQuestionIds.length === 0) throw new ApiError(400, 'No valid questions could be processed from the Excel file');

  const quizCode = await generateUniqueCode(6);
  const quiz = await Quiz.create({
    title,
    description,
    createdBy,
    quizCode,
    type: 'custom',
    settings,
    questionIds: finalQuestionIds,
    status: 'published'
  });

  return { quiz, insertedCount: finalQuestionIds.length, sampleCount: finalQuestionIds.length };
};

/**
 * Create a built-in quiz by selecting random questions from BuiltInPool by subjects and/or difficulty.
 *
 * opts: { title, description, createdBy, builtInFilter: { category, subjects: [], difficulty }, questionsCount, settings }
 *
 * Behavior: collects pool items filtered by builtInFilter.subjects (if provided), then samples `questionsCount`.
 */
export const createBuiltInQuiz = async ({ title, description = null, createdBy, builtInFilter = {}, questionsCount = 10, settings = {} }) => {
  if (!title) throw new ApiError(400, 'title is required');
  if (!createdBy) throw new ApiError(400, 'createdBy is required');

  let questionIds = [];
  const limit = Number(questionsCount || 10);

  const filter = {};
  if (builtInFilter.difficulty) filter.difficulty = builtInFilter.difficulty;

  if (builtInFilter.subjects && Array.isArray(builtInFilter.subjects) && builtInFilter.subjects.length > 0) {
    // Equal distribution logic
    const subjects = builtInFilter.subjects;
    const baseCount = Math.floor(limit / subjects.length);
    let remainder = limit % subjects.length;
    let allSelectedQuestions = [];

    for (const subject of subjects) {
      const targetCount = baseCount + (remainder > 0 ? 1 : 0);
      remainder--;

      if (targetCount <= 0) continue;

      const subjectFilter = { ...filter, subject: subject }; // Exact match or regex if needed
      // Note: filter.subject was set to { $in: ... } above, we override it here for specific subject

      const subjectPool = await Question.find(subjectFilter).lean();
      const subjectSample = sampleArray(subjectPool, Math.min(targetCount, subjectPool.length));
      allSelectedQuestions = allSelectedQuestions.concat(subjectSample);
    }

    // Shuffle the combined result
    allSelectedQuestions = sampleArray(allSelectedQuestions, allSelectedQuestions.length);
    questionIds = allSelectedQuestions.map(q => q._id);

  } else {
    // Original logic for no specific subjects or single filter
    console.log('Built-in Quiz Filter:', JSON.stringify(filter));

    // Fetch pool items from Question model (uploaded by faculty/admin)
    const pool = await Question.find(filter).lean();
    console.log(`Found ${pool.length} questions for built-in quiz`);

    if (!pool || pool.length === 0) {
      throw new ApiError(404, 'No questions found for selected filters (Subject/Difficulty). Ensure you have uploaded questions for this subject.');
    }

    const n = Math.min(pool.length, limit);
    const sample = sampleArray(pool, n);

    // Store references to Question _id
    questionIds = sample.map((p) => p._id);
  }

  const quizCode = await generateUniqueCode(6);
  const quiz = await Quiz.create({
    title,
    description,
    createdBy,
    quizCode,
    type: 'built-in',
    settings,
    questionIds,
    builtInFilter,
    status: 'published'
  });

  return { quiz, sampleCount: questionIds.length };
};

/**
 * Other helpers (update, archive, get, list)
 */
export const updateQuiz = async (quizId, updater = {}, actor = null) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  const fields = ['title', 'description', 'settings', 'questionIds', 'status', 'builtInFilter'];
  let changed = false;
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(updater, f)) {
      quiz[f] = updater[f];
      changed = true;
    }
  }
  if (changed) await quiz.save();
  return quiz;
};

export const deleteQuiz = async (quizId) => {
  const quiz = await Quiz.findByIdAndDelete(quizId);
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  return quiz;
};

export const getQuizById = async (id, opts = {}) => {
  if (!id) return null;
  if (opts.populateQuestions) return Quiz.findById(id).populate('questionIds').lean();
  return Quiz.findById(id).lean();
};

export const getQuizByCode = async (code) => {
  if (!code) return null;
  return Quiz.findOne({ quizCode: code }).lean();
};

export const listQuizzes = async ({ ownerId = null, page = 1, limit = 50 } = {}) => {
  const p = Math.max(1, Number(page || 1));
  const l = Math.min(200, Math.max(1, Number(limit || 50)));
  const skip = (p - 1) * l;
  const filter = {};
  if (ownerId) filter.createdBy = ownerId;
  const [items, total] = await Promise.all([
    Quiz.find(filter).populate('createdBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Quiz.countDocuments(filter)
  ]);

  const itemsWithCount = items.map(quiz => ({
    ...quiz,
    questionsCount: quiz.questionIds ? quiz.questionIds.length : (quiz.settings?.questionsCount || 0)
  }));

  return { items: itemsWithCount, meta: { total, page: p, limit: l } };
};
