/* ============================================================
   GitPro — API Client
   
   Axios singleton with HttpOnly cookie auth, automatic
   envelope unwrapping, and 401 redirect.
   ============================================================ */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/* Response interceptor: unwrap { success, message, data } envelope */
api.interceptors.response.use(
  (response) => {
    const body = response.data;

    /* If the backend returns the standard ApiResponse envelope, unwrap it */
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return body.data;
    }

    /* Non-envelope responses (e.g., binary blobs for PDF) pass through */
    return response.data;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      /* 401 Unauthorized → redirect to login */
      if (status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred';

      return Promise.reject(new Error(message));
    }

    return Promise.reject(error);
  },
);

/* Raw axios instance for blob downloads (no envelope unwrapping) */
export const apiRaw = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
});
