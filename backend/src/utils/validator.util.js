/**
 * Minimal Excel parser for question imports using SheetJS (xlsx)
 *
 * Function exported:
 * - parseQuestionsFromFile(filePath, options)
 */

import xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

function normalizeHeader(h) {
  if (!h) return '';
  return String(h).toLowerCase().trim();
}

function readSheetRows(filePath, sheetIndex = 0) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetNames = workbook.SheetNames;

  if (!sheetNames || sheetNames.length === 0)
    return { rows: [], errors: ['No sheets found'] };

  const sheetName = sheetNames[sheetIndex];
  const worksheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (json.length === 0)
    return { rows: [], errors: ['Sheet empty'] };

  const headers = json[0].map(normalizeHeader);

  const dataRows = json.slice(1);
  const rows = [];
  const errors = [];

  dataRows.forEach((r, rowIndex) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] !== undefined ? r[i] : '';
    });

    // Question text
    const questionText = obj.question || obj.q || obj['question text'] || '';
    if (!questionText || String(questionText).trim() === '') {
      errors.push({ row: rowIndex + 2, reason: 'Missing question text' });
      return;
    }

    // Choice columns
    const choiceCols = headers.filter((h) => /choice|option|opt/i.test(h));
    const choices = [];

    if (choiceCols.length > 0) {
      choiceCols.forEach((col) => {
        const text = obj[col];
        if (text && String(text).trim() !== '') {
          choices.push({ id: uuidv4(), text: String(text).trim() });
        }
      });
    } else {
      // fallback A/B/C/D
      for (let i = 1; i <= 4; i++) {
        const val = r[i];
        if (val && String(val).trim() !== '') {
          choices.push({ id: uuidv4(), text: String(val).trim() });
        }
      }
    }

    if (choices.length < 2) {
      errors.push({ row: rowIndex + 2, reason: 'Less than 2 choices' });
      return;
    }

    // Correct answer
    let correctRaw =
      obj.correct ||
      obj.answer ||
      obj.correctAnswer ||
      obj['correct answer'] ||
      '';

    let correctChoiceId = null;

    if (correctRaw) {
      const cr = String(correctRaw).trim();

      if (/^[0-9]+$/.test(cr)) {
        const idx = parseInt(cr, 10) - 1;
        if (choices[idx]) correctChoiceId = choices[idx].id;
      } else {
        const found = choices.find(
          (c) => String(c.text).trim().toLowerCase() === cr.toLowerCase()
        );

        if (found) correctChoiceId = found.id;
        else {
          const letterIndex = cr.toUpperCase().charCodeAt(0) - 65;
          if (letterIndex >= 0 && choices[letterIndex])
            correctChoiceId = choices[letterIndex].id;
        }
      }
    }

    const difficulty =
      (obj.difficulty || obj.level || '').toString().toLowerCase() || null;

    const subject = obj.subject || obj.category || obj.topic || null;

    const explanation = obj.explanation || obj.explain || '';

    rows.push({
      text: String(questionText).trim(),
      choices,
      correctChoiceId,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty)
        ? difficulty
        : 'easy',
      subject: subject ? String(subject).trim() : null,
      explanation: explanation ? String(explanation).trim() : '',
    });
  });

  return { rows, errors };
}

export async function parseQuestionsFromFile(filePath, options = {}) {
  try {
    const sheetIndex =
      typeof options.sheetIndex === 'number' ? options.sheetIndex : 0;

    const { rows, errors } = readSheetRows(filePath, sheetIndex);
    return { parsed: rows, errors };
  } catch (err) {
    return { parsed: [], errors: [{ reason: err.message || String(err) }] };
  }
}

export default { parseQuestionsFromFile };
