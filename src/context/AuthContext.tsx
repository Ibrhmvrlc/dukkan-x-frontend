import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import { initDB } from '../lib/db';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string, navigate?: (to: string) => void) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authenticated: false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const alreadyChecked = useRef(false);

  const logout = async () => {
    console.warn("LOGOUT ÇAĞRILDI");
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setAuthenticated(false);

    // ❌ IndexedDB'i silmiyoruz
    // const db = await initDB();
    // await db.delete('auth', 'token');
    // await db.clear('users');

    navigate('/signin', { replace: true });
  };

  useEffect(() => {
    const checkLogin = async () => {
      if (alreadyChecked.current) return;
      alreadyChecked.current = true;

      console.log("🧠 checkLogin() tetiklendi");

      const db = await initDB();
      const token = localStorage.getItem("token");

      // 1️⃣ Online kontrol
      if (token && token !== 'offline-token') {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const me = await axios.get('/me');

          setUser(me.data);
          setAuthenticated(true);
          await db.put('users', me.data);

          console.log("✅ Online oturum açıldı");
          setLoading(false);
          return;
        } catch (err) {
          console.warn("🌐 Online token ile me başarısız, offline denenecek");
          // devam et
        }
      }

      // 2️⃣ offline-token varsa ve IndexedDB'de kullanıcı varsa
      if (token === 'offline-token') {
        const offlineUser = await db.getAll('users');
        if (offlineUser?.[0]) {
          console.log("✅ Offline token ve kullanıcı bulundu, giriş yapılıyor");
          setUser(offlineUser[0]);
          setAuthenticated(true);
          axios.defaults.headers.common['Authorization'] = `Bearer offline-token`;
          setLoading(false);
          return;
        }
      }

      // 3️⃣ localStorage'ta token hiç yoksa (yani logout yapılmışsa): asla oturum açma
      console.warn("❌ Giriş yapılmamış. Oturum açılmayacak.");
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
    };

    checkLogin();
  }, []);


  const login = async (email: string, password: string, navigate?: (to: string) => void) => {
    try {
      const response = await axios.post('/login', { email, password });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const me = await axios.get('/me');

      const db = await initDB();
      await db.put('auth', token, 'token');
      await db.put('users', me.data);

      setUser(me.data);
      setAuthenticated(true);
      toast.success("Hoşgeldiniz!");

      setTimeout(() => {
        navigate?.('/');
      }, 200);
    } catch (error) {
      console.warn("🌐 Sunucuya ulaşılamıyor, offline giriş deneniyor...");
      const db = await initDB();
      const allUsers = await db.getAll('users');
      const matchingUser = allUsers.find(u => u.email === email);

      if (matchingUser) {
        setUser(matchingUser);
        setAuthenticated(true);
        localStorage.setItem("token", "offline-token");
        axios.defaults.headers.common['Authorization'] = `Bearer offline-token`;
        toast.info("Offline modda oturum açıldı.");
        setTimeout(() => {
          navigate?.('/');
        }, 200);
      } else {
        toast.error("Offline giriş başarısız. Daha önce bu kullanıcıyla giriş yapılmamış.");
        throw new Error("Offline giriş başarısız.");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);