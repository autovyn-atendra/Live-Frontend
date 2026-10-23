"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = (color: string, label: string) =>
  L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px system-ui,sans-serif">${label}</div>`,
  });

const startIcon = pinIcon("#16a34a", "S");
const endIcon = pinIcon("#dc2626", "E");

const activeIcon = (label: string | number) =>
  L.divIcon({
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -26],
    html: `<div class="gps-active-pin"><span class="gps-active-pulse"></span><span class="gps-active-core">${label}</span></div>`,
  });

const ACTIVE_CSS = `
.gps-active-pin{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center}
.gps-active-pulse{position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,.35);animation:gpsPulse 1.6s ease-out infinite}
.gps-active-core{position:relative;width:32px;height:32px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.45);color:#fff;font:700 12px system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
@keyframes gpsPulse{0%{transform:scale(.45);opacity:.95}100%{transform:scale(1.35);opacity:0}}
`;

const formatTime = (value: any) => {
  if (!value) return "-";
  const num = Number(value);
  const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
};

const displayAddress = (p: any) => {
  if (p.address && p.address.trim() && !/^point\s*\d*$/i.test(p.address)) return p.address;
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
};

const gmapsLink = (p: any) => `https://www.google.com/maps?q=${p.lat},${p.lng}`;

const titleFor = (i: number, n: number) =>
  i === 0 ? "Trip start" : i === n - 1 && n > 1 ? "Latest point" : `Point ${i + 1}`;

const createPopupContent = (title: string, p: any) => `
  <div style="min-width:200px;max-width:260px;font-family:system-ui,sans-serif;color:#1e293b;">
    <div style="font-weight:700;font-size:15px;margin-bottom:4px;color:#0f172a;">${title}</div>
    <div style="font-size:13px;color:#64748b;margin-bottom:4px;">
      ${formatTime(p.time)} ${p.speed != null ? `· <b>${p.speed} km/h</b>` : ""}
    </div>
    <div style="font-size:13px;margin-bottom:6px;word-break:break-word;color:#334155;">
      ${displayAddress(p)}
    </div>
    <a href="${gmapsLink(p)}" target="_blank" rel="noopener noreferrer" style="font-size:13px;color:#2563eb;text-decoration:underline;">
      Open in Google Maps &rarr;
    </a>
  </div>
`;

interface Point {
  lat: number;
  lng: number;
  speed?: number;
  address?: string;
  time?: any;
}

interface RouteMapLeafletProps {
  points: Point[];
  activeIndex?: number | null;
  focusTick?: number;
  autoOpenPopup?: boolean;
  onPointSelect?: (index: number) => void;
}

export default function RouteMapLeaflet({
  points,
  activeIndex = null,
  focusTick = 0,
  autoOpenPopup = true,
  onPointSelect,
}: RouteMapLeafletProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // 1. Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layersRef.current = layersGroup;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []);

  // 2. Draw Route and Markers whenever points change
  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    markersRef.current = [];

    if (!points || points.length === 0) return;

    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);

    if (points.length > 1) {
      // White outline casing
      L.polyline(latLngs, { color: "#ffffff", weight: 8, opacity: 0.9 }).addTo(layers);
      // Main blue path line
      L.polyline(latLngs, { color: "#2563eb", weight: 4, opacity: 1 }).addTo(layers);
    }

    // Intermediate Circle Markers
    points.slice(1, -1).forEach((p, idx) => {
      const actualIdx = idx + 1;
      const circle = L.circleMarker([p.lat, p.lng], {
        radius: 6,
        color: "#ffffff",
        fillColor: "#f59e0b",
        fillOpacity: 1,
        weight: 2,
      });

      circle.bindPopup(createPopupContent(`Point ${actualIdx + 1}`, p));
      circle.on("click", () => {
        onPointSelect && onPointSelect(actualIdx);
      });
      circle.addTo(layers);
    });

    // Start Marker (S)
    const start = points[0];
    const startM = L.marker([start.lat, start.lng], { icon: startIcon });
    startM.bindPopup(createPopupContent("Trip start", start));
    startM.on("click", () => {
      onPointSelect && onPointSelect(0);
    });
    startM.addTo(layers);
    markersRef.current[0] = startM;

    // End Marker (E)
    if (points.length > 1) {
      const end = points[points.length - 1];
      const endM = L.marker([end.lat, end.lng], { icon: endIcon });
      endM.bindPopup(createPopupContent("Latest point", end));
      endM.on("click", () => {
        onPointSelect && onPointSelect(points.length - 1);
      });
      endM.addTo(layers);
      markersRef.current[points.length - 1] = endM;
    }

    // Fit Bounds
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 16);
    } else {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    }
  }, [points, onPointSelect]);

  // 3. Highlight & Fly to Active Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !points || points.length === 0) return;

    if (activeIndex != null && points[activeIndex]) {
      const p = points[activeIndex];
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });

      if (autoOpenPopup) {
        const timer = setTimeout(() => {
          const m = markersRef.current[activeIndex];
          if (m) {
            m.openPopup();
          } else {
            L.popup()
              .setLatLng([p.lat, p.lng])
              .setContent(createPopupContent(titleFor(activeIndex, points.length), p))
              .openOn(map);
          }
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, focusTick, points, autoOpenPopup]);

  return (
    <>
      <style>{ACTIVE_CSS}</style>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "480px",
          borderRadius: "8px",
          zIndex: 0,
        }}
        className="border border-borderColor dark:border-borderColor-dark shadow-sm"
      />
    </>
  );
}