// ============================================
// api.js - Axios Instance with Interceptors
// ============================================
// Creates a single reusable Axios instance that:
//   1. Attaches JWT token to every outgoing request
//   2. Auto-redirects to /login on 401 responses
// Also exports all authAPI and chatAPI helper methods.
// ============================================

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with base URL and timeout
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s for AI responses
});

// ── Request Interceptor ──────────────────────────────────────
// Reads JWT from localStorage and attaches it as Bearer token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor ─────────────────────────────────────
// On 401: clear auth data and redirect to /login automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
};

// ── Chat API ─────────────────────────────────────────────────
export const chatAPI = {
  getAll:   ()    => api.get('/chats'),
  getById:  (id)  => api.get(`/chats/${id}`),
  create:   (data = {}) => api.post('/chats', data),
  delete:   (id)  => api.delete(`/chats/${id}`),
  getStats: ()    => api.get('/chats/stats'),

  // POST /chats/:chatId/text  with body { question, subject }
  askText: (chatId, question, subject) =>
    api.post(`/chats/${chatId}/text`, { question, subject }),

  // POST /chats/:chatId/image  with multipart/form-data
  askImage: (chatId, imageFile, question, subject) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (question) formData.append('question', question);
    if (subject)  formData.append('subject',  subject);
    return api.post(`/chats/${chatId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    });
  },

  // POST /chats/:chatId/voice  with multipart/form-data
  askVoice: (chatId, audioBlob, subject) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_recording.webm');
    if (subject) formData.append('subject', subject);
    return api.post(`/chats/${chatId}/voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    });
  },
};

export default api;
