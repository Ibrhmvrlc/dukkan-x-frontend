// src/App.tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import RoleRoute from "./components/auth/RoleRoute";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Unauthorized from "./pages/OtherPage/Unauthorized";
import { useAuth } from "./context/AuthContext";
import MusteriCreate from "./pages/Musteriler/MusteriCreate.tsx";
import TedarikciCreate from "./pages/Tedarikciler/TedarikciCreate.tsx";
import MusteriEdit from "./pages/Musteriler/MusteriEdit.tsx";
import MusteriList from "./pages/Musteriler/MusteriList.tsx";
import UrunList from "./pages/Urunler/UrunList.tsx";
import UrunEdit from "./pages/Urunler/UrunEdit.tsx";
import YeniUrun from "./pages/Urunler/YeniUrun.tsx";
import UrunFiyatGuncelleme from "./pages/Urunler/UrunFiyatGuncelleme.tsx";
import SiparisOlustur from "./pages/Siparisler/SiparisOlustur.tsx";
import TedarikciList from "./pages/Tedarikciler/TedarikciList.tsx";
import TedarikciEdit from "./pages/Tedarikciler/TedarikciEdit.tsx";
import SiparisDetay from "./pages/Siparisler/SiparisDetay.tsx";
import TahsilatEklePage from "./pages/Tahsilatlar/TahsilatEklePage.tsx";

// Support sayfaları
import SupportChat from "./pages/Support/SupportChat";
import AdminSupportInbox from "./pages/Support/AdminSupportInbox";
// import AdminSupportChat from "./pages/Support/AdminSupportChat";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="text-gray-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} pauseOnHover theme="light" style={{ zIndex: 9999999 }} />
      <ScrollToTop />

      <Routes>
        {/* 🔓 Public */}
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🔒 Protected + Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Root/Home */}
          <Route index element={<Home />} />

          {/* Firmalar */}
          <Route path="musteriler">
            <Route index element={<MusteriList />} />
            <Route path="yeni" element={<MusteriCreate />} />
            <Route path=":id/duzenle" element={<MusteriEdit />} />
          </Route>

          <Route path="tedarikciler">
            <Route index element={<TedarikciList />} />
            <Route path="yeni" element={<TedarikciCreate />} />
            <Route path=":id/duzenle" element={<TedarikciEdit />} />
          </Route>

          {/* Ürünler */}
          <Route path="urunler">
            <Route index element={<UrunList />} />
            <Route path="yeni" element={<YeniUrun />} />
            <Route path=":id" element={<UrunEdit />} />
          </Route>
          <Route path="fiyat-guncelle" element={<UrunFiyatGuncelleme />} />

          {/* Tahsilat */}
          <Route path="tahsilat-ekle" element={<TahsilatEklePage />} />

          {/* Siparişler */}
          <Route path="siparisler">
            <Route path="olustur/:musteriId" element={<SiparisOlustur />} />
            <Route path=":id" element={<SiparisDetay />} />
          </Route>

          {/* Support */}
          <Route path="support" element={<SupportChat />} />
          <Route path="admin">
            <Route
              path="support"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminSupportInbox />
                </RoleRoute>
              }
            />
            {/* Support
            <Route
              path="support/threads/:id"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminSupportChat />
                </RoleRoute>
              }
            />
             */}
          </Route>

          {/* Diğer örnek sayfalar */}
          <Route
            path="calendar"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <Calendar />
              </RoleRoute>
            }
          />
          <Route
            path="blank"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <Blank />
              </RoleRoute>
            }
          />
          <Route
            path="form-elements"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <FormElements />
              </RoleRoute>
            }
          />
          <Route path="basic-tables" element={<BasicTables />} />

          {/* UI Elements */}
          <Route path="alerts" element={<Alerts />} />
          <Route path="avatars" element={<Avatars />} />
          <Route path="badge" element={<Badges />} />
          <Route path="buttons" element={<Buttons />} />
          <Route path="images" element={<Images />} />
          <Route path="videos" element={<Videos />} />

          {/* Charts */}
          <Route path="line-chart" element={<LineChart />} />
          <Route path="bar-chart" element={<BarChart />} />
        </Route>

        {/* 404 en sonda */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}