import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom'; // 👈 Link buradan olmalı
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false); // 👈 eklendi
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);               // 👈 loading başlat
      await login(email, password, navigate);
    } catch (error: any) {
      alert("Giriş başarısız: " + (error?.response?.data?.error || "Sunucu hatası"));
    } finally {
      setSubmitting(false);              // 👈 loading kapat
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h3 className="text-xl mb-2 font-bold text-gray-900 dark:text-white">Giriş yapın</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kullanıcı adı ve şifreniz ile sisteme giriş yapabilirsiniz.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              <div>
                <Label>
                  Kullancı Adı <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>
                  Şifre <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Şifrenizi giriniz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Beni Hatırla
                  </span>
                </label>
                <Link to="" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Şifremi Unuttum
                </Link>
              </div>

              <div>
                <Button
                  className="w-full"
                  size="sm"
                  type="submit"          // 👈 kritik
                  loading={submitting}   // 👈 spinner + disable
                  disabled={submitting}  // (opsiyonel, loading zaten disable ediyor)
                >
                  Giriş Yap
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Hesabınız yok mu?{" "}
              <Link to="" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Firma Yetkiliniz ile görüşün.
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}