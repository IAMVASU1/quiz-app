// src/api/questions.api.js
import client from './client';
// Use legacy API for uploadAsync support in SDK 54+
import * as FileSystem from 'expo-file-system/legacy';

export async function apiCreateQuestion(data) {
    const res = await client.post('/questions', data);
    return res.data.data;
}

export async function apiListQuestions(params = {}) {
    const res = await client.get('/questions', { params });
    return res.data.data;
}

export async function apiGetSubjects() {
    const res = await client.get('/questions/subjects');
    return res.data.data;
}

export async function apiGetQuestionById(id) {
    const res = await client.get(`/questions/${id}`);
    return res.data.data;
}

export async function apiUpdateQuestion(id, data) {
    const res = await client.put(`/questions/${id}`, data);
    return res.data.data;
}

export async function apiCountQuestionsByCreator(userId) {
    const res = await client.get(`/questions/count/creator/${userId}`);
    return res.data.data;
}

// Bulk upload questions
// Accepts file object: { uri, name, mimeType }
export const apiBulkUploadQuestions = async (file) => {
    try {
        const token = client.defaults.headers.common.Authorization?.replace('Bearer ', '');
        const url = `${client.defaults.baseURL}/questions/bulk-upload`;

        console.log('Uploading file:', file.uri, 'to', url);

        // Robustly determine uploadType
        let uploadType = 1; // Default to MULTIPART (usually 1)

        // Check legacy export names
        if (FileSystem.FileSystemUploadType && FileSystem.FileSystemUploadType.MULTIPART !== undefined) {
            uploadType = FileSystem.FileSystemUploadType.MULTIPART;
        } else if (FileSystem.UploadType && FileSystem.UploadType.MULTIPART !== undefined) {
            uploadType = FileSystem.UploadType.MULTIPART;
        }

        console.log('Using uploadType:', uploadType);

        const response = await FileSystem.uploadAsync(url, file.uri, {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: uploadType,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            mimeType: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        // response.body is a string
        console.log('Upload response status:', response.status);
        console.log('Upload response body:', response.body);

        let data;
        try {
            data = JSON.parse(response.body);
        } catch (e) {
            data = { message: response.body };
        }

        if (response.status >= 200 && response.status < 300) {
            return data;
        } else {
            throw data;
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};
