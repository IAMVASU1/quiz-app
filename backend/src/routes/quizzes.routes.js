// src/routes/quizzes.routes.js
import express from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// Create quiz: allows Excel upload via 'file'
router.post('/', auth, role(['faculty', 'admin']), upload.single('file'), quizController.create);

// Correct order
router.get('/by-code/:code', quizController.getByCode);
router.get('/creator/:userId', auth, role(['admin', 'faculty']), quizController.getByCreator);

router.get('/', auth, quizController.list);
router.get('/:id', auth, quizController.getById);
router.put('/:id', auth, quizController.update);
router.delete('/:id', auth, quizController.remove);

export default router;
