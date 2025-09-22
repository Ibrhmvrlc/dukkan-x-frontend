import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, ""); // sondaki /'ları temizle

const instance = axios.create({
  baseURL: `${API_BASE}/api`, //baseURL: `http://localhost:8000/api`,
  withCredentials: false, // gerekiyorsa kalsın
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers.Accept = "application/json";
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // refresh URL’yi de aynı base’ten üret
        const refresh = await instance.post("/refresh", null);
        const newToken = refresh.data.access_token;
        localStorage.setItem("token", newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (e) {
        localStorage.removeItem("token");
        window.location.href = "/signin";
        throw e;
      }
    }

    throw error;
  }
);

export default instance;