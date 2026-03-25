import axios from "axios";

const AUTH_EXPIRED_EVENT = "auth:token-expired";
const AUTH_TOKEN_KEY = "auth-token";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/**
 * Inject Bearer token from localStorage.
 */
const injectToken = (config: any) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

/**
 * Global error handler for 401 Unauthorized.
 */
const handleUnauthorized = (error: any): Promise<never> => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.dispatchEvent(
      new CustomEvent(AUTH_EXPIRED_EVENT, {
        detail: { status, message },
      }),
    );
  }

  return Promise.reject(error);
};

apiClient.interceptors.request.use(injectToken);
apiClient.interceptors.response.use((response) => response, handleUnauthorized);

export default apiClient;
