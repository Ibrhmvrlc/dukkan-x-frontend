// src/pages/Siparisler/SiparisDetay.tsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from '../../api/axios';
import Button from '../../components/ui/button/Button';

type SiparisUrun = {
  urun_id?: number;
  adet?: number | string | null;
  birim_fiyat?: number | string | null;
  iskonto_orani?: number | string | null;
  kdv_orani?: number | string | null;
  urun?: { isim?: string | null };
};

type Siparis = {
  id: number;
  musteri_id?: number;
  tarih?: string | null;
  fatura_no?: string | number | null;
  durum?: string | null;
  not?: string | null;
  yetkili?: { isim?: string | null; telefon?: string | null; pozisyon?: string | null };
  teslimat_adresi?: { baslik?: string | null; adres?: string | null; ilce?: string | null; il?: string | null; posta_kodu?: string | null };
  musteri?: { id: number; unvan: string };
  urunler: SiparisUrun[];
};

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/\s/g, ''));
  return isNaN(n) ? 0 : n;
};

const money = (n: unknown) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(toNum(n)) + ' ₺';

export default function SiparisDetay() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [siparis, setSiparis] = useState<Siparis | null>(null);

  const showSuccess = searchParams.get('created') === '1';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get(`/v1/siparisler/${id}`)
      .then(res => {
        if (!mounted) return;
        const data = res?.data?.data ?? res?.data;
        setSiparis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Sipariş getirilemedi:', err?.response?.data ?? err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  const totals = useMemo(() => {
    if (!siparis) return { ara: 0, net: 0, gruplar: {} as Record<string, number>, toplamKdv: 0, genel: 0 };
    let ara = 0;
    let net = 0;
    const gruplar: Record<string, number> = {};
    (siparis.urunler || []).forEach(u => {
      const adet = toNum(u.adet);
      const fiyat = toNum(u.birim_fiyat);
      const isk = toNum(u.iskonto_orani);
      const satirBrut = adet * fiyat;
      const satirNet = satirBrut * (1 - (isk / 100 || 0));
      const kdv = toNum(u.kdv_orani);
      const kdvTutar = satirNet * (kdv / 100);
      ara += satirBrut;
      net += satirNet;
      const key = String(kdv);
      gruplar[key] = (gruplar[key] ?? 0) + kdvTutar;
    });
    const toplamKdv = Object.values(gruplar).reduce((a, b) => a + b, 0);
    const genel = net + toplamKdv;
    return { ara, net, gruplar, toplamKdv, genel };
  }, [siparis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="text-gray-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!siparis) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500">Sipariş bulunamadı.</p>
        <Button className="mt-3" onClick={() => navigate(-1)}>Geri</Button>
      </div>
    );
  }

  const tarihStr = siparis.tarih ? new Date(siparis.tarih).toLocaleDateString('tr-TR') : 'Tarih yok';

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-b-xl p-4 space-y-3 rounded-xl dark:text-gray-100">
      {/* Yazdırma için güçlü, kompakt stiller */}
      <style>
        {`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body { background: white !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-border { border: 1px solid #ddd !important; }
          .compact * { font-size: 11px !important; line-height: 1.15 !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { padding: 4px 6px !important; font-size: 10.5px !important; }
          td.num, th.num { white-space: nowrap; text-align: right; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr, td, th { page-break-inside: avoid; break-inside: avoid; }
          .header-strip { display: grid; grid-template-columns: 1fr; gap: 4px; }
        }
        `}
      </style>

      {/* Üst başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sipariş #{siparis.id}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {siparis.musteri?.unvan ?? 'Müşteri'} • {tarihStr}
            {siparis.fatura_no ? ` • Fatura No: ${siparis.fatura_no}` : ''}
          </p>
        </div>
        <div className="no-print flex items-center gap-2">
          {siparis.musteri_id && (
            <Link
              to={`/musteriler/${siparis.musteri_id}?tab=siparisler`}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.06]"
            >
              Müşteri Siparişlerine Dön
            </Link>
          )}
          <Button onClick={() => window.print()}>Yazdır</Button>
        </div>
      </div>

      {/* Üst bilgiler — tek satırda 3 baloncuk */}
    <div className="flex flex-wrap gap-2 compact">
        <div className="print-border border rounded-md px-2 py-1 dark:border-gray-700 flex-1 min-w-[120px]">
            <span className="text-[12px] font-medium">YETKİLİ</span> <br />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{siparis.yetkili?.isim ?? '-'}</span>
            {siparis.yetkili?.telefon && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400"> / {siparis.yetkili.telefon}</span>
            )}
            {siparis.yetkili?.pozisyon && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400"> / {siparis.yetkili.pozisyon}</span>
            )}
        </div>

        <div className="print-border border rounded-md px-2 py-1 dark:border-gray-700 flex-1 min-w-[160px]">
            <span className="text-[12px] font-medium">TESLİMAT ADRESİ</span> <br />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {siparis.teslimat_adresi?.baslik ?? '-'}
            </span>
            {siparis.teslimat_adresi?.adres && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {' • '}{siparis.teslimat_adresi.adres}
            </span>
            )}
            {(siparis.teslimat_adresi?.ilce || siparis.teslimat_adresi?.il) && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {' • '}
                {[siparis.teslimat_adresi.ilce, siparis.teslimat_adresi.il].filter(Boolean).join(', ')}
                {siparis.teslimat_adresi?.posta_kodu ? ` (${siparis.teslimat_adresi.posta_kodu})` : ''}
            </span>
            )}
        </div>

        <div className="print-border border rounded-md px-2 py-1 dark:border-gray-700 flex-1 min-w-[120px]">
            <span className="text-[12px] font-medium">NOT</span> <br />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{siparis.not || '-'}</span>
        </div>
    </div>


      {/* Ürünler — ana alan */}
      <div className="print-border border rounded-md dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-white/[0.04]">
            <tr>
              <th className="text-left p-2">Ürün</th>
              <th className="text-center num p-2">Adet</th>
              <th className="text-center num p-2">Birim Fiyat</th>
              <th className="text-center num p-2">İsk %</th>
              <th className="text-center num p-2">KDV %</th>
              <th className=" num p-2">Tutar (KDV H.)</th>
            </tr>
          </thead>
          <tbody>
            {(siparis.urunler || []).map((u, i) => {
              const adet = toNum(u.adet);
              const fiyat = toNum(u.birim_fiyat);
              const isk = toNum(u.iskonto_orani);
              const net = adet * fiyat * (1 - (isk / 100 || 0));
              return (
                <tr key={i} className="border-t dark:border-gray-700">
                  <td className="p-2 break-words text-left">{u.urun?.isim ?? '-'}</td>
                  <td className="text-center num p-2">{adet}</td>
                  <td className="text-center num p-2">{money(fiyat)}</td>
                  <td className="text-center num p-2">{(isk || 0).toFixed(2)}</td>
                  <td className="text-center num p-2">{toNum(u.kdv_orani).toFixed(2)}</td>
                  <td className="text-center num p-2">{money(net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Kompakt özet toplamlar — altta, küçük kutu */}
      <div className="ml-auto w-full md:w-[420px] print-border border rounded-md p-2 dark:border-gray-700 space-y-1 compact">
        <div className="flex justify-between">
          <span>Ara Toplam (iskontosuz)</span>
          <span className="font-medium">{money(totals.ara)}</span>
        </div>
        <div className="flex justify-between">
          <span>Net Toplam (iskontolu, KDV hariç)</span>
          <span className="font-medium">{money(totals.net)}</span>
        </div>
        {Object.entries(totals.gruplar)
          .sort(([a],[b]) => toNum(a) - toNum(b))
          .map(([oran, tutar]) => (
            <div key={oran} className="flex justify-between">
              <span>KDV (%{oran})</span>
              <span className="font-medium">{money(tutar)}</span>
            </div>
          ))
        }
        <div className="flex justify-between pt-1">
          <span className="font-medium">Toplam KDV</span>
          <span className="font-semibold">{money(totals.toplamKdv)}</span>
        </div>
        <div className="flex justify-between text-base pt-1">
          <span className="font-semibold">Genel Toplam</span>
          <span className="font-bold">{money(totals.genel)}</span>
        </div>
      </div>

      {/* Alt aksiyonlar — ekranda var, baskıda yok */}
      <div className="no-print flex flex-wrap gap-2">
        {siparis.musteri_id && (
          <Link
            to={`/musteriler/${siparis.musteri_id}?tab=siparisler`}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/[0.08]"
          >
            Müşterinin Siparişleri
          </Link>
        )}
        {siparis.musteri_id && (
          <Link
            to={`/siparis-olustur/${siparis.musteri_id}`}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Aynı Müşteriye Yeni Sipariş
          </Link>
        )}
      </div>
    </div>
  );
}