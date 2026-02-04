/**
 * Generates short alphanumeric quiz codes and ensures uniqueness against Quiz collection.
 *
 * Usage:
 *   const code = await generateUniqueCode(6);
 *
 * Note: Lazy dynamic import avoids circular dependencies.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomCode(length = 6) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function generateUniqueCode(length = 6, tries = 5) {
  // Dynamic import instead of require()
  const { default: Quiz } = await import('../models/quiz.model.js');

  for (let i = 0; i < tries; i++) {
    const candidate = randomCode(length);
    const exists = await Quiz.findOne({ quizCode: candidate }).lean();
    if (!exists) return candidate;
  }

  // Rare fallback loop
  while (true) {
    const candidate = randomCode(length);
    const exists = await Quiz.findOne({ quizCode: candidate }).lean();
    if (!exists) return candidate;
  }
}
