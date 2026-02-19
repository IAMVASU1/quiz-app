// src/controllers/admin.controller.js
/**
 * Admin controller
 * - get dashboard stats
 */

import User from '../models/user.model.js';
import Quiz from '../models/quiz.model.js';
import Attempt from '../models/attempt.model.js';
import Question from '../models/question.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * GET /api/v1/admin/stats
 * Get dashboard statistics
 */
export const getStats = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') throw new ApiError(403, 'Admin only');

    const [totalUsers, totalAdmins, totalFaculty, totalStudents, totalQuizzes, totalAttempts, subjectBuckets] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'faculty' }),
        User.countDocuments({ role: 'student' }),
        Quiz.countDocuments(),
        Attempt.countDocuments(),
        Question.aggregate([
            {
                $match: {
                    subject: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $project: {
                    normalizedSubject: {
                        $trim: {
                            input: { $toLower: '$subject' }
                        }
                    }
                }
            },
            {
                $match: {
                    normalizedSubject: { $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$normalizedSubject',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ])
    ]);

    const topSubjects = subjectBuckets.map(item =>
        item._id
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    );

    res.json({
        success: true,
        data: {
            totalUsers,
            totalAdmins,
            totalFaculty,
            totalStudents,
            totalQuizzes,
            totalAttempts,
            topSubjects
        }
    });
});

/**
 * GET /api/v1/admin/stats/trend
 * Get attempt trend for the last 7 days
 */
export const getAttemptTrend = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'admin') throw new ApiError(403, 'Admin only');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trend = await Attempt.aggregate([
        {
            $match: {
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const found = trend.find(t => t._id === dateStr);

        // Format date as "Mon", "Tue" etc.
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        result.push({
            name: dayName,
            attempts: found ? found.count : 0,
            date: dateStr
        });
    }

    res.json({
        success: true,
        data: result
    });
});
