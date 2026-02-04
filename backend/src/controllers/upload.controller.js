import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Question from "../models/question.model.js";
import xlsx from "xlsx";
import fs from "fs";

/**
 * POST /api/v1/questions/bulk-upload
 * Bulk upload questions from Excel file
 */
export const bulkUploadQuestions = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const filePath = req.file.path;
  let workbook;

  try {
    workbook = xlsx.readFile(filePath);
  } catch (error) {
    fs.unlinkSync(filePath); // Clean up
    throw new ApiError(400, "Invalid Excel file");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  // Expected columns: Question Description, Option A, Option B, Option C, Option D, Correct Answer, Subject
  const questionsToInsert = [];
  const errors = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // Excel row number (1-based, header is 1)

    const text = row["Question Description"];
    const optionA = row["Option A"];
    const optionB = row["Option B"];
    const optionC = row["Option C"];
    const optionD = row["Option D"];
    const correctAnswer = row["Correct Answer"]; // Should be 'A', 'B', 'C', or 'D'
    const subject = row["Subject"];

    if (!text || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      errors.push(`Row ${rowNum}: Missing required fields`);
      continue;
    }

    const choices = [
      { id: "A", text: String(optionA) },
      { id: "B", text: String(optionB) },
      { id: "C", text: String(optionC) },
      { id: "D", text: String(optionD) },
    ];

    // Validate correct answer
    const validOptions = ["A", "B", "C", "D"];
    const normalizedCorrect = String(correctAnswer).trim().toUpperCase();

    if (!validOptions.includes(normalizedCorrect)) {
      errors.push(`Row ${rowNum}: Invalid Correct Answer '${correctAnswer}'. Must be A, B, C, or D.`);
      continue;
    }

    questionsToInsert.push({
      text: String(text),
      choices,
      correctChoiceId: normalizedCorrect,
      subject: subject ? String(subject).trim() : "General",
      difficulty: "medium", // Default
      isActive: true,
      createdBy: req.user.id,
      fingerprint: Question.computeFingerprint(String(text), choices),
    });
  }

  // Clean up file
  fs.unlinkSync(filePath);

  if (questionsToInsert.length === 0) {
    throw new ApiError(400, "No valid questions found in file. " + errors.join("; "));
  }

  // Pre-check for duplicates to handle legacy data (missing fingerprints)
  // We check for existing fingerprints OR existing text
  const fingerprints = questionsToInsert.map(q => q.fingerprint);
  const texts = questionsToInsert.map(q => q.text);

  const existingQuestions = await Question.find({
    $or: [
      { fingerprint: { $in: fingerprints } },
      { text: { $in: texts } } // Fallback for legacy questions without fingerprint
    ]
  }).select('fingerprint text');

  const existingFingerprints = new Set(existingQuestions.map(q => q.fingerprint).filter(Boolean));
  const existingTexts = new Set(existingQuestions.map(q => q.text));

  const uniqueQuestions = questionsToInsert.filter(q => {
    if (existingFingerprints.has(q.fingerprint)) return false;
    if (existingTexts.has(q.text)) return false;
    return true;
  });

  const skippedCount = questionsToInsert.length - uniqueQuestions.length;

  // Bulk insert unique questions
  let insertedCount = 0;
  if (uniqueQuestions.length > 0) {
    try {
      const result = await Question.insertMany(uniqueQuestions, { ordered: false });
      insertedCount = result.length;
    } catch (error) {
      if (error.insertedDocs) {
        insertedCount = error.insertedDocs.length;
      }
    }
  }

  res.status(201).json({
    success: true,
    message: `Processed ${questionsToInsert.length} questions. Uploaded: ${insertedCount}, Skipped (Duplicates/Errors): ${skippedCount}.`,
    data: {
      total: questionsToInsert.length,
      inserted: insertedCount,
      skipped: skippedCount,
    },
    errors: errors.length > 0 ? errors : undefined,
  });
});

export const handleUpload = bulkUploadQuestions;
