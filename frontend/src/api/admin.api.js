import client from './client';

export const apiGetDashboardStats = async () => {
    try {
        const response = await client.get('/admin/stats');
        return response.data;
    } catch (error) {
        console.error('apiGetDashboardStats error:', error);
        throw error;
    }
};

export const apiGetAttemptTrend = async () => {
    try {
        const response = await client.get('/admin/stats/trend');
        return response.data;
    } catch (error) {
        console.error('apiGetAttemptTrend error:', error);
        throw error;
    }
};
