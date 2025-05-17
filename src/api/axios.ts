import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Request interceptor (zaten vardı)
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers.Accept = 'application/json';
  return config;
});

// ✅ Response interceptor (YENİ EKLENECEK)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Eğer token süresi dolmuşsa ve daha önce retry edilmemişse
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post("http://localhost:8000/api/refresh", null, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json", // 👈 BU ÇOK KRİTİK
          },
        });

        const newToken = refreshResponse.data.token;
        localStorage.setItem("token", newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return instance(originalRequest);
      } catch (refreshError) {
        // Eğer yenileme başarısızsa logout işlemi yapılabilir
        localStorage.removeItem("token");
        window.location.href = "/signin"; // veya navigate('/signin')
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;