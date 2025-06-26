import axios from "axios";
import { saveRequest } from "../lib/offlineQueue";

const instance = axios.create({
  baseURL: "http://localhost:8000/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("[Axios Request] Token from localStorage:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("[Axios Request] No token found in localStorage");
  }

  config.headers.Accept = "application/json";

  console.log("[Axios Request] Final request config headers:", config.headers);
  if (!navigator.onLine) {
    saveRequest({
      url: config.url || '',
      method: config.method || 'get',
      data: config.data,
      headers: config.headers,
    });
    return Promise.reject(new axios.Cancel('offline'));
  }
  return config;
});

// ✅ Response interceptor (refresh token support)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!navigator.onLine || error.message === 'Network Error') {
      saveRequest({
        url: originalRequest.url || '',
        method: originalRequest.method || 'get',
        data: originalRequest.data,
        headers: originalRequest.headers,
      });
      return Promise.resolve({ data: null });
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post("http://localhost:8000/api/refresh", null, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        });

        const newToken = refreshResponse.data.access_token; // ✅ doğru key
        localStorage.setItem("token", newToken);

        // Güncellenmiş token'ı eski isteğe ekle
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return instance(originalRequest); // ✅ isteği yeniden dene
      } catch (refreshError) {
        localStorage.removeItem("token");
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;