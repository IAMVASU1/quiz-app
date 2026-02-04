// src/api/attempts.api.js
import client from './client';

export async function apiGetUserAttempts(userId) {
    const res = await client.get(`/attempts/user/${userId}`);
    return res.data.data;
}

export async function apiGetAttemptHistory(params = {}) {
    const { limit = 5 } = params;
    const res = await client.get(`/attempts/history?limit=${limit}`);
    return res.data.data;
}

export async function apiStartAttempt({ quizCode }) {
    const res = await client.post('/attempts/start', { quizCode });
    return res.data.data;
}

export async function apiSubmitAttempt(attemptId, answers) {
    const res = await client.post(`/attempts/${attemptId}/submit`, { answers });
    return res.data.data;
}

export async function apiStartPractice(data) {
    const res = await client.post('/attempts/practice', data);
    return res.data.data;
}

export async function apiGetAttemptsByQuiz(quizId) {
    const res = await client.get(`/attempts/quiz/${quizId}`);
    return res.data.data;
}

export async function apiGetAttemptById(attemptId) {
    const res = await client.get(`/attempts/${attemptId}`);
    return res.data.data;
}
