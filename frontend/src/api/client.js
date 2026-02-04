// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FOR ANDROID EMULATOR: Use 'http://10.0.2.2:3000/api/v1'
// FOR PHYSICAL DEVICE: Use 'http://192.168.1.3:3000/api/v1' (This is your current LAN IP)
// WHY NETWORK ERROR? 'localhost' on phone refers to the phone itself, not your PC.
// const BASE_URL = process.env.API_URL || 'https://ugsf-backend-production.up.railway.app/api/v1';
const BASE_URL = process.env.API_URL || 'http://10.222.208.112:3000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// helper to set auth header
export async function setAuthToken(token) {
  if (!token) {
    delete client.defaults.headers.common.Authorization;
    await AsyncStorage.removeItem('token');
    return;
  }
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
  await AsyncStorage.setItem('token', token);
}

// load token from storage if exists (call once on app start)
export async function initAuthFromStorage() {
  try {
    const t = await AsyncStorage.getItem('token');
    if (t) {
      client.defaults.headers.common.Authorization = `Bearer ${t}`;
      return t;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default client;
