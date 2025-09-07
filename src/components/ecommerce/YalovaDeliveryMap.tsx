// YalovaDeliveryMap.tsx
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { latLngBounds, type LatLngExpression } from "leaflet";

export type DeliveryPoint = {
  id: number | string;
  baslik?: string;
  ilce?: string;
  il?: string;
  adres?: string;
  lat: number;
  lng: number;
  shipments_count: number;
};

function FitBounds({ points }: { points: DeliveryPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.25));
      map.setMaxBounds(bounds.pad(0.6));
    } else {
      map.setView([40.6549, 29.2842], 10);
    }
  }, [points, map]);
  return null;
}

// Container genişliği değişince haritayı tazele (opsiyonel ama iyi olur)
function UseResizeInvalidate() {
  const map = useMap();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    ref.current = container as HTMLDivElement;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);
    // ilk mount’ta da küçük bir gecikmeyle tazele
    setTimeout(() => map.invalidateSize(), 50);
    return () => ro.disconnect();
  }, [map]);

  return null;
}

export default function YalovaDeliveryMap({
  points,
  className = "",
}: {
  points: DeliveryPoint[];
  className?: string; // dışarıdan boyut sınıfı al
}) {
  const yalovaCenter: LatLngExpression = [40.6549, 29.2842];

  const total = points.reduce((s, p) => s + p.shipments_count, 0);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const radius = (n: number) => {
    const p = pct(n);
    return Math.max(6, Math.min(18, (p / 100) * 18 + 6));
  };

  return (
    <MapContainer
      center={yalovaCenter}
      zoom={10}
      scrollWheelZoom={false}
      className={`w-full h-[280px] md:h-[360px] lg:h-[420px] rounded-xl ${className}`}
      style={{ outline: "none" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap katkıda bulunanlar"
      />
      <UseResizeInvalidate />
      <FitBounds points={points} />
      {points.map((p) => {
        const title = p.baslik ?? p.ilce ?? p.il ?? "Nokta";
        const address = p.adres ?? "-";
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng] as LatLngExpression}
            radius={radius(p.shipments_count)}
            pathOptions={{ color: "#10B981", fillColor: "#10B981", fillOpacity: 0.65 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{title}</div>
                <div className="text-gray-600">{address}</div>
                <div>{p.shipments_count.toLocaleString("tr-TR")} sevkiyat</div>
                {total > 0 && <div className="text-gray-500">%{pct(p.shipments_count).toFixed(1)}</div>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}