/**
 * Minimal Excel parser for question imports using SheetJS (xlsx)
 *
 * Exports:
 * - parseQuestionsFromFile(filePath, options)
 */

// src/utils/excelParser.util.js
/**
 * Minimal Excel parser for question imports using SheetJS (xlsx)
 *
 * Exports:
 *  - parseQuestionsFromFile(filePath, options)
 *
 * This parser is intentionally simple:
 *  - It reads the first row as headers
 *  - Converts the sheet to an array of row objects
 *  - Filters out completely empty rows
 *  - Leaves all question/option/answer validation to import.service.js
 */

import xlsx from "xlsx";
import fs from "fs";

/**
 * Parse questions from an Excel file.
 *
 * @param {string} filePath - Absolute or relative path to the Excel file
 * @param {object} options
 * @param {number} [options.sheetIndex=0] - Which sheet to read (0-based)
 *
 * @returns {Promise<{ parsed: object[], errors: {reason: string}[] }>}
 */
export async function parseQuestionsFromFile(filePath, options = {}) {
  const errors = [];

  if (!filePath) {
    errors.push({ reason: "filePath is required" });
    return { parsed: [], errors };
  }

  if (!fs.existsSync(filePath)) {
    errors.push({ reason: `File not found: ${filePath}` });
    return { parsed: [], errors };
  }

  try {
    const workbook = xlsx.readFile(filePath);

    const sheetIndex =
      typeof options.sheetIndex === "number" ? options.sheetIndex : 0;

    const sheetName = workbook.SheetNames[sheetIndex];

    if (!sheetName) {
      errors.push({ reason: `No sheet found at index ${sheetIndex}` });
      return { parsed: [], errors };
    }

    const worksheet = workbook.Sheets[sheetName];

    // This gives you: [{ "Question Description": "...", "Option A": "3", ... }, ...]
    const rawRows = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",     // keep empty cells as empty string
      blankrows: false, // don't include blank rows as {} by default
    });

    if (rawRows.length > 0) {
      console.log('Excel Parser - First Row Keys:', Object.keys(rawRows[0]));
    } else {
      console.log('Excel Parser - No rows found');
    }

    // Normalize keys
    const parsed = [];
    rawRows.forEach((row, index) => {
      const newRow = {};
      // Helper to find value case-insensitively
      const getValue = (keys) => {
        const rowKeys = Object.keys(row);
        for (const k of rowKeys) {
          const normalizedKey = k.toLowerCase().trim().replace(/\s+/g, ' '); // Normalize spaces
          if (keys.some(targetKey => targetKey.toLowerCase() === normalizedKey)) {
            return row[k];
          }
        }
        return null;
      };

      const text = getValue(['text', 'question', 'question text', 'question description', 'q', 'description']);
      const correctChoiceId = getValue(['correctchoiceid', 'correct answer', 'answer', 'correct option', 'correct', 'correctanswer']);
      const difficulty = getValue(['difficulty', 'level']) || 'easy';
      const subject = getValue(['subject', 'category', 'topic']) || null;
      const explanation = getValue(['explanation', 'rationale']) || null;

      // Choices: look for choice1, choice2 OR option A, option B etc.
      const choices = [];
      // Try choice 1..6
      for (let i = 1; i <= 6; i++) {
        const char = String.fromCharCode(64 + i); // A, B, C...
        const val = getValue([
          `choice${i}`, `choice ${i}`,
          `option${i}`, `option ${i}`,
          `option ${char}`, `option${char}`, // Option A, OptionA
          char // Just 'A', 'B'
        ]);
        if (val) choices.push({ id: String(i), text: String(val) });
      }

      if (text && choices.length >= 2 && correctChoiceId) {
        // Map correctChoiceId (if it's 'A', 'B' -> '1', '2')
        let finalCorrectId = String(correctChoiceId).trim();
        // Handle "Option A", "A", "Option A" etc.
        const cleanCorrect = finalCorrectId.replace(/^option\s*/i, '').toLowerCase();

        if (['a', 'b', 'c', 'd', 'e', 'f'].includes(cleanCorrect)) {
          const map = { a: '1', b: '2', c: '3', d: '4', e: '5', f: '6' };
          finalCorrectId = map[cleanCorrect];
        }

        newRow.text = String(text);
        newRow.choices = choices;
        newRow.correctChoiceId = finalCorrectId;
        newRow.difficulty = String(difficulty).toLowerCase();
        newRow.subject = subject ? String(subject) : null;
        newRow.explanation = explanation ? String(explanation) : null;
        parsed.push(newRow);
      } else {
        // Only log error if it looks like a data row (has some content)
        if (Object.values(row).some(v => v)) {
          const missing = [];
          if (!text) missing.push('Question Description');
          if (choices.length < 2) missing.push('At least 2 Options');
          if (!correctChoiceId) missing.push('Correct Answer');

          errors.push({ reason: `Row ${index + 2}: Missing required fields (${missing.join(', ')})` });
        }
      }
    });

    if (parsed.length === 0 && errors.length === 0) {
      errors.push({ reason: "No valid questions found. Please check your column headers. Expected: 'Question Description', 'Option A', 'Option B', 'Correct Answer'." });
    }

    return { parsed, errors };
  } catch (err) {
    errors.push({ reason: err.message || String(err) });
    return { parsed: [], errors };
  }
}

export default { parseQuestionsFromFile };


// src/utils/excelParser.util.js
// import xlsx from "xlsx";
// import fs from "fs";

// export async function parseQuestionsFromFile(filePath, options = {}) {
//   const errors = [];

//   if (!fs.existsSync(filePath)) {
//     errors.push({ reason: `File not found: ${filePath}` });
//     return { parsed: [], errors };
//   }

//   try {
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];

//     // This will give you [{ Question Description: "...", Option A: 3, ... }]
//     const json = xlsx.utils.sheet_to_json(worksheet, {
//       defval: "", // keep empty cells as empty string
//     });

//     return { parsed: json, errors };
//   } catch (err) {
//     errors.push({ reason: err.message || String(err) });
//     return { parsed: [], errors };
//   }
// }
