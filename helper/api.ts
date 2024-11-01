import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userTokenLogin } from './my-lib';

export const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";
export const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "";

const api = axios.create({
  baseURL: apiUrl,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(userTokenLogin);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api