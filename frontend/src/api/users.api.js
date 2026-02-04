// src/api/users.api.js
import client from './client';
import { AUTH_LOGIN, AUTH_REGISTER, USERS_ME } from './endpoints';

/**
 * login: { email, password } -> { token, user }
 * register: { name, email, password, role } -> { token, user }
 * getProfile: GET /users/me -> { user }
 */

export async function apiLogin(email, password) {
  const res = await client.post(AUTH_LOGIN, { email, password });
  return res.data.data;
}

export async function apiRegister({ name, email, password, role = 'student' }) {
  const res = await client.post(AUTH_REGISTER, { name, email, password, role });
  return res.data.data;
}

export async function apiGetProfile() {
  const res = await client.get(USERS_ME);
  return res.data.data;
}

export async function apiListUsers(page = 1, limit = 50) {
  const res = await client.get(`/users?page=${page}&limit=${limit}`);
  return res.data.data;
}

export async function apiDeleteUser(id) {
  const res = await client.delete(`/users/${id}`);
  return res.data;
}

export async function apiGetTopLeaderboard(params = {}) {
  const { limit = 3 } = params;
  const res = await client.get(`/leaderboard/top?limit=${limit}`);
  return res.data.data;
}
