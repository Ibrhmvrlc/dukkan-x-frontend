// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import { initDB } from '../lib/db';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

/* -------------------- Tipler -------------------- */
export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[]; // pivot -> string[] (örn: ["admin","user"])
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

/* -------------------- küçük yardımcılar -------------------- */
const USER_CACHE_KEY = 'user';

const setUserCache = (u: User) => {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
  } catch {}
};

const getUserCache = (): User | null => {
  const raw = localStorage.getItem(USER_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearUserCache = () => {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
};

/** roles alanını hep string[]’e normalize et (backend /me roles göndermese bile kırılmasın) */
const normalizeUser = (u: any): User => ({
  id: Number(u?.id),
  name: String(u?.name ?? ''),
  email: String(u?.email ?? ''),
  roles: Array.isArray(u?.roles) ? u.roles.map(String) : [],
});
/* ----------------------------------------------------------- */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const alreadyChecked = useRef(false);

  const logout = async () => {
    console.warn("LOGOUT ÇAĞRILDI");
    localStorage.removeItem('token');
    clearUserCache();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setAuthenticated(false);
    navigate('/signin', { replace: true });
  };

  useEffect(() => {
    const checkLogin = async () => {
      if (alreadyChecked.current) return;
      alreadyChecked.current = true;

      console.log("🧠 checkLogin() tetiklendi");

      const db = await initDB();
      const token = localStorage.getItem("token");

      // 0️⃣ Hızlı UI: token + önbellek varsa ekrana al
      const cached = getUserCache();
      if (cached && token) {
        setUser(normalizeUser(cached));
        setAuthenticated(true);
      }

      // 1️⃣ Online doğrulama (/me)
      if (token && token !== 'offline-token') {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Not: Senin projende /me. Eğer API'n /v1/me ise burayı değiştir.
          const meResp = await axios.get('/me');
          const me = normalizeUser(meResp.data);

          setUser(me);
          setAuthenticated(true);
          setUserCache(me);
          await db.put('users', me);

          console.log("✅ Online oturum açıldı");
          setLoading(false);
          return;
        } catch (err) {
          console.warn("🌐 Online token ile /me başarısız, offline denenecek");
        }
      }

      // 2️⃣ Offline: offline-token + IndexedDB
      if (token === 'offline-token') {
        const offlineUser = await db.getAll('users');
        if (offlineUser?.[0]) {
          const me = normalizeUser(offlineUser[0]);
          console.log("✅ Offline token ve kullanıcı bulundu, giriş yapılıyor");
          setUser(me);
          setAuthenticated(true);
          setUserCache(me);
          axios.defaults.headers.common['Authorization'] = `Bearer offline-token`;
          setLoading(false);
          return;
        }
      }

      // 3️⃣ Giriş yok
      console.warn("❌ Giriş yapılmamış. Oturum açılmayacak.");
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
    };

    checkLogin();

    // (opsiyonel) ağ durumu logları
    const onOnline = () => console.log("🔌 Online");
    const onOffline = () => console.log("📴 Offline");
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const login = async (email: string, password: string, nav?: (to: string) => void) => {
    try {
      const response = await axios.post('/login', { email, password });
      const token = response.data.access_token;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Giriş sonrası kullanıcıyı getir
      const meResp = await axios.get('/me');
      const me = normalizeUser(meResp.data);

      const db = await initDB();
      await db.put('auth', token, 'token');
      await db.put('users', me);

      setUser(me);
      setAuthenticated(true);
      setUserCache(me);

      toast.success("Hoşgeldiniz!");

      setTimeout(() => {
        nav?.('/') ?? navigate('/', { replace: true });
      }, 200);
    } catch (error) {
      // Offline fallback
      console.warn("🌐 Sunucuya ulaşılamıyor, offline giriş deneniyor...");
      const db = await initDB();
      const allUsers = await db.getAll('users');
      const matchingUser = allUsers.find((u: any) => String(u?.email) === email);

      if (matchingUser) {
        const me = normalizeUser(matchingUser);
        setUser(me);
        setAuthenticated(true);
        setUserCache(me);
        localStorage.setItem("token", "offline-token");
        axios.defaults.headers.common['Authorization'] = `Bearer offline-token`;
        toast.info("Offline modda oturum açıldı.");
        setTimeout(() => {
          nav?.('/') ?? navigate('/', { replace: true });
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