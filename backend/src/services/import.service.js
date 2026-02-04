// // src/services/import.service.js
// /**
//  * Import service (ESM)
//  *
//  * - Uses excelParser.util to parse uploaded Excel files
//  * - Validates rows and inserts into Question or BuiltInPool depending on options
//  *
//  * API:
//  * - importFromFile(filePath, options)
//  *   options: { target: 'question'|'builtin', createdBy, source: 'aptitude'|'technical', difficulty (for aptitude), subject (for technical) }
//  *
//  * Returns:
//  *  { imported: Number, skipped: Number, errors: [ { row, reason } ] }
//  */

import { parseQuestionsFromFile } from "../utils/excelParser.util.js";
import Question from "../models/question.model.js";
import BuiltInPool from "../models/builtinPool.model.js";
import ApiError from "../utils/ApiError.js";

/**
 * Normalize Excel headers: remove spaces, lowercase
 */
function normalizeRow(row) {
  const normalized = {};
  for (const key in row) {
    const cleanKey = key.replace(/\s+/g, "").toLowerCase();
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

export async function importFromFile(filePath, options = {}) {
  if (!filePath) throw new ApiError(400, "filePath is required");

  console.log("👉 importFromFile CALLED with:", filePath, options);

  const { parsed, errors: parseErrors } = await parseQuestionsFromFile(
    filePath,
    {}
  );

  console.log("👉 parseQuestionsFromFile RESULT:", {
    parsedLength: parsed?.length,
    firstRow: parsed?.[0],
    errors: parseErrors,
  });

  const report = { imported: 0, skipped: 0, errors: parseErrors || [] };

  const target = options.target || "question";
  const createdBy = options.uploadedBy || options.createdBy || null;
  const source = options.source || "aptitude";

  for (let i = 0; i < parsed.length; i += 1) {
    const rowRaw = parsed[i];
    console.log("👉 ROW RAW", i, rowRaw);

    const row = normalizeRow(rowRaw); // <-- now it exists
    console.log("👉 ROW NORMALIZED", i, row);

    try {
      const text =
        row["questiondescription"] ||
        row["question"] ||
        row["questiondescription:"] ||
        null;

      if (!text) {
        report.skipped += 1;
        report.errors.push({ row: i + 2, reason: "Missing question text" });
        continue;
      }

      const choices = [
        { id: "A", text: row["optiona"]?.toString().trim() },
        { id: "B", text: row["optionb"]?.toString().trim() },
        { id: "C", text: row["optionc"]?.toString().trim() },
        { id: "D", text: row["optiond"]?.toString().trim() },
      ].filter((c) => c.text);

      if (choices.length < 2) {
        report.skipped += 1;
        report.errors.push({
          row: i + 2,
          reason: "At least 2 options required",
        });
        continue;
      }

      const correctChoiceId = row["correctanswer"]?.toString().trim();
      if (
        !correctChoiceId ||
        !choices.some(
          (c) => c.id === correctChoiceId || c.text === correctChoiceId
        )
      ) {
        report.skipped += 1;
        report.errors.push({
          row: i + 2,
          reason: "Missing or invalid correct answer",
        });
        continue;
      }

      const difficulty = (
        row["difficultylevel"] ||
        row["difficulty"] ||
        "easy"
      ).toLowerCase();
      const subject = row["subject"] || options.subject || null;
      const explanation = row["remark"] || row["explanation"] || null;
      const tags = row["bloomstaxonomylevel"]
        ? [row["bloomstaxonomylevel"]]
        : [];

      if (target === "question") {
        await Question.create({
          text,
          choices,
          correctChoiceId,
          difficulty,
          subject,
          explanation,
          tags,
          createdBy,
        });
        report.imported += 1;
      } else {
        await BuiltInPool.create({
          text,
          choices,
          correctChoiceId,
          difficulty,
          subject,
          explanation,
          tags,
          source: source === "technical" ? "technical" : "aptitude",
          createdBy,
        });
        report.imported += 1;
      }
    } catch (err) {
      report.skipped += 1;
      report.errors.push({ row: i + 2, reason: err.message || String(err) });
    }
  }

  console.log("👉 FINAL REPORT:", report);
  return report;
}



// TODO : don't add questions that already exist in DB