import axios, { type InternalAxiosRequestConfig } from "axios";
import { AUTHENTICATION_STORAGE_KEY } from "../contexts/AuthContext";

const TOKEN_EXPIRED_MESSAGE = "Your token has expired. Please log in again.";
const AUTH_EXPIRED_EVENT = "auth:token-expired";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/**
 * Inject Bearer token for all environments.
 */
const injectToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = localStorage.getItem(AUTHENTICATION_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

/**
 * Global error handler for 401 Unauthorized / Token Expiration.
 */
const handleUnauthorized = (error: any): Promise<never> => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  const isExpiredToken = status === 401 && message === TOKEN_EXPIRED_MESSAGE;

  if (isExpiredToken) {
    localStorage.removeItem(AUTHENTICATION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  return Promise.reject(error);
};

apiClient.interceptors.request.use(injectToken);
apiClient.interceptors.response.use(undefined, handleUnauthorized);

export default apiClient;
