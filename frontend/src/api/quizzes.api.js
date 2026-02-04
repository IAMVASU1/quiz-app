import client from './client';

export const apiCreateQuiz = async (formData) => {
    const response = await client.post('/quizzes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const apiListQuizzes = async (page = 1, limit = 10) => {
    const response = await client.get(`/quizzes?page=${page}&limit=${limit}`);
    return response.data.data; // { items: [], meta: {} }
};

export const apiGetQuizById = async (id) => {
    const response = await client.get(`/quizzes/${id}`);
    return response.data.data;
};

export const apiDeleteQuiz = async (id) => {
    const response = await client.delete(`/quizzes/${id}`);
    return response.data;
};

export const apiUpdateQuiz = async (id, data) => {
    const response = await client.put(`/quizzes/${id}`, data);
    return response.data.data;
};

export const apiGetQuizzesByCreator = async (userId) => {
    const response = await client.get(`/quizzes/creator/${userId}`);
    return response.data.data; // { items: [], meta: {} }
};

export const apiGetQuizByCode = async (code) => {
    const response = await client.get(`/quizzes/by-code/${code}`);
    return response.data.data;
};
