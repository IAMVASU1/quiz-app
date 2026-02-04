// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { setAuthToken, initAuthFromStorage } from '../api/client';
import { apiLogin, apiRegister, apiGetProfile } from '../api/users.api';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => { },
  register: async () => { },
  logout: async () => { },
  refreshUser: async () => { },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // load token and profile on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await initAuthFromStorage();
        if (token) {
          // token is already applied by initAuthFromStorage to axios defaults
          await refreshUser();
        }
      } catch (e) {
        // console.warn('Auth init error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiGetProfile();
      // backend should return user object: { id, name, email, role, ... }
      setUser(data);
      return data;
    } catch (err) {
      // If unauthorized, remove token
      await setAuthToken(null);
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      // setLoading(true);
      const data = await apiLogin(email, password);
      // data expected to contain: { token, user }
      if (!data || !data.token) {
        throw new Error('Invalid credentials response from server.');
      }
      await setAuthToken(data.token);
      // if backend did not return user, fetch profile
      if (data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
      return { success: true };
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login error', msg);
      return { success: false, error: msg };
    } finally {
      // setLoading(false);
    }
  }, [refreshUser]);

  const register = useCallback(async ({ name, email, password, role = 'student' }) => {
    try {
      // setLoading(true);
      const data = await apiRegister({ name, email, password, role });
      if (!data || !data.token) {
        throw new Error('Invalid register response from server.');
      }
      await setAuthToken(data.token);
      if (data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
      return { success: true };
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Register error', msg);
      return { success: false, error: msg };
    } finally {
      // setLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await setAuthToken(null);
      setUser(null);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
