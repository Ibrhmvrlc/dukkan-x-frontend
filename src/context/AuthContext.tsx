import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../api/axios';

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization']; // 🚨 tokenı axios'tan da temizle
    setUser(null);
    window.location.href = '/signin';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // 🚨 token'ı axios'a ekle

    axios.get('/me')
      .then(res => setUser(res.data))
      .catch(error => {
        setUser(null);
        if (error.response?.status === 401) {
          logout(); // ✔️ hem token silinir hem yönlendirme yapılır
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post('/login', { email, password });
    const token = response.data.token;

    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // ✔️ axios’a token’ı elle ekle

    const me = await axios.get('/me');
    setUser(me.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);