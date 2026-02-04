import client from './client';

export const getTopLeaderboard = async (limit = 10) => {
    const response = await client.get(`/leaderboard/top?limit=${limit}`);
    return response.data;
};

export const getStudentProfile = async (id) => {
    const response = await client.get(`/leaderboard/${id}`);
    return response.data;
};
