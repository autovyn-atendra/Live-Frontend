"use client";

import { useCurrentUser } from "@/app/hooks/use-current-user";
import DataTable from "@/components/Templates/servicetable";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapPin,
  Navigation,
  Route,
  Gauge,
  Clock,
  Car,
  CheckCircle2,
  Activity,
  ArrowLeft,
  Timer,
  List as ListIcon,
  RefreshCw,
  Loader2,
  X,
  BatteryCharging,
  Radio,
  Zap,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

/* ---------------------------- loaders ---------------------------- */

const LoaderBox = ({ text, height = "h-[480px]" }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 ${height} border border-borderColor dark:border-borderColor-dark rounded-lg bg-off dark:bg-black`}
  >
    <Loader2 size={36} className="animate-spin text-primary" />
    <span className="text-body-color dark:text-grey text-base">{text}</span>
  </div>
);

const OverlayLoader = ({ text }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/70 dark:bg-black/60">
    <Loader2 size={34} className="animate-spin text-primary" />
    {text && <span className="text-base font-semibold text-header dark:text-white">{text}</span>}
  </div>
);

const RouteMap = dynamic(() => import("./Routemapleaflet"), {
  ssr: false,
  loading: () => <LoaderBox text="Loading map..." />,
});

/* ------------------------------ helpers ------------------------------ */

const formatTime = (value) => {
  if (!value) return "-";
  const num = Number(value);
  const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
};

const formatDate = (value) => {
  if (!value) return "-";
  const num = Number(value);
  const d = !isNaN(num) && num > 0 ? new Date(num) : new Date(value);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
};

const gapText = (from, to) => {
  const ms = new Date(to) - new Date(from);
  if (isNaN(ms) || ms < 0) return null;
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};

const metersBetween = (a, b) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const formatMeters = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`);

const pointTitle = (i, n) => (i === 0 ? "Trip start" : i === n - 1 && n > 1 ? "Latest point" : `Point ${i + 1}`);

const pointAddress = (p) => p.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/* ---------------------------- small components ---------------------------- */

const PlateBadge = ({ children }) => (
  <span className="inline-block px-2.5 py-1 rounded border-2 border-header bg-white dark:bg-dark text-header dark:text-white font-bold tracking-wider text-sm whitespace-nowrap">
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  if (status === "Moving") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green/15 text-green border border-green/30">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
        </span>
        Moving
      </span>
    );
  }
  if (status === "Stopped") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow/15 text-yellow-700 dark:text-yellow border border-yellow/50">
        <CheckCircle2 size={13} /> Stopped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300">
      <Radio size={13} /> Offline
    </span>
  );
};

const SummaryCard = ({ icon, label, value, tone, active, onClick }) => {
  const tones = {
    total: { bar: "border-l-primary", icon: "bg-primary/10 text-primary", on: "border-primary bg-primary/5" },
    moving: { bar: "border-l-green", icon: "bg-green/15 text-green", on: "border-green bg-green/10" },
    stopped: { bar: "border-l-yellow", icon: "bg-yellow/15 text-yellow", on: "border-yellow bg-yellow/10" },
    offline: { bar: "border-l-header", icon: "bg-header/10 text-header dark:text-b300", on: "border-header bg-header/5" },
  };
  const t = tones[tone] || tones.total;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`col-span-6 md:col-span-3 w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-l-4 ${t.bar} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-signUp focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? `${t.on} shadow-signUp`
          : "border-borderColor dark:border-borderColor-dark bg-white dark:bg-black shadow-one"
      }`}
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-full shrink-0 ${t.icon}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl md:text-3xl font-bold leading-tight text-header dark:text-white">{value}</div>
        <div className="text-sm md:text-base text-header/70 dark:text-grey truncate">{label}</div>
      </div>
    </button>
  );
};

const InfoItem = ({ icon, label, value, accent, tint }) => (
  <div className={`flex items-start gap-3 p-4 rounded-xl border ${tint}`}>
    <div className={`mt-0.5 ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <div className="text-xs md:text-sm text-header/70 dark:text-grey">{label}</div>
      <div className="text-sm md:text-base font-bold text-header dark:text-white break-words">{value}</div>
    </div>
  </div>
);

const LocationItem = ({ label, point, dotClass, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left flex items-start gap-3 p-4 rounded-xl border border-borderColor dark:border-borderColor-dark bg-white dark:bg-black hover:bg-primary/5 transition-colors"
  >
    <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
    <div className="min-w-0">
      <div className="text-xs md:text-sm text-header/70 dark:text-grey">
        {label} · {formatTime(point.time)}
      </div>
      <div className="text-sm md:text-base font-semibold text-header dark:text-white break-words">{pointAddress(point)}</div>
    </div>
  </button>
);

/* -------------------------------- Main Page -------------------------------- */

const VehicleGpsTracking = () => {
  const user = useCurrentUser();

  const [activeTab, setActiveTab] = useState("list"); // "list" | "map"
  const [filters, setFilters] = useState({
    date_from: getDateDaysAgo(3),
    date_to: new Date().toISOString().split("T")[0],
    device_id: "",
  });

  const [vehicleList, setVehicleList] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [activePoint, setActivePoint] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [cardFilter, setCardFilter] = useState("all"); // all | moving | stopped | offline
  const [searchQuery, setSearchQuery] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [focusTick, setFocusTick] = useState(0);
  const [autoOpenPopup, setAutoOpenPopup] = useState(true);

  const mapBoxRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Fetch GalaGPS Live Data (Devices + Last Positions) without DB Table
   */
  const fetchGalaGpsData = async () => {
    setLoadingList(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
      const headers = { compcode: user?.Comp_Code || "DBCON", name: user?.name || "admin" };

      // 1. Fetch all devices
      const devicesRes = await axios.post(`${baseUrl}/galagps/devices`, {}, { headers });
      const rawDevices = devicesRes?.data?.devices || [];

      // 2. Fetch real-time last positions
      const posRes = await axios.post(`${baseUrl}/galagps/lastPosition`, { deviceids: [] }, { headers });
      const posRecords = posRes?.data?.records || [];

      // Create quick lookup map for positions by deviceid
      const posMap = new Map();
      posRecords.forEach((pos) => {
        if (pos.deviceid) {
          posMap.set(String(pos.deviceid), pos);
        }
      });

      // 3. Merge devices with real-time location and status
      const merged = rawDevices.map((dev, idx) => {
        const idStr = String(dev.deviceid);
        const pos = posMap.get(idStr);

        const lat = pos?.callat ? Number(pos.callat) : null;
        const lng = pos?.callon ? Number(pos.callon) : null;
        const speed = pos?.speed != null ? Number(pos.speed) : 0;
        const isMoving = pos?.moving === 1 || speed > 0;
        const hasGps = lat != null && lng != null && (lat !== 0 || lng !== 0);

        let status = "Offline";
        if (isMoving) {
          status = "Moving";
        } else if (hasGps) {
          status = "Stopped";
        }

        const rawVoltage = pos?.exvoltage ? Number(pos.exvoltage) : 0;
        const voltageStr = rawVoltage > 0 ? (rawVoltage / 100).toFixed(1) + " V" : "-";
        const totalKm = pos?.totaldistance ? (Number(pos.totaldistance) / 1000).toFixed(1) : "0.0";

        return {
          id: idx + 1,
          deviceid: idStr,
          devicename: dev.devicename || idStr,
          groupname: dev.groupname || "Default",
          simiccid: dev.simiccid || "-",
          status: status,
          speed: speed,
          lat: lat,
          lng: lng,
          moving: isMoving,
          ignitionStr: pos?.strstatusen || (pos?.moving === 1 ? "ACC ON" : "ACC OFF"),
          voltage: voltageStr,
          totalKm: totalKm,
          lastActive: pos?.updatetime || dev.lastactivetime || pos?.validpoistiontime || null,
          rawPos: pos,
          rawDev: dev,
        };
      });

      setVehicleList(merged);
      setVehicleOptions(
        merged.map((v) => ({
          value: v.deviceid,
          label: `${v.devicename} (${v.deviceid})`,
        }))
      );
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching GalaGPS data:", error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchGalaGpsData();
  }, []);

  /**
   * Fetch Historical Track Playback for selected vehicle
   */
  const fetchRoutePlayback = useCallback(
    async (vehicle) => {
      if (!vehicle?.deviceid) return;
      setSelectedVehicle(vehicle);
      setActiveTab("map");
      setActivePoint(null);
      setRefreshMsg("");
      setLoadingRoute(true);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
        const begintime = `${filters.date_from} 00:00:00`;
        const endtime = `${filters.date_to} 23:59:59`;

        const headers = { compcode: user?.Comp_Code || "DBCON", name: user?.name || "admin" };
        const res = await axios.post(`${baseUrl}/galagps/trackPlayback`, {
          deviceid: vehicle.deviceid,
          begintime,
          endtime,
        }, { headers });

        const records = res?.data?.records || [];
        if (records.length > 0) {
          const pts = records
            .filter((r) => r.callat && r.callon)
            .map((r) => ({
              lat: Number(r.callat),
              lng: Number(r.callon),
              speed: r.speed != null ? Number(r.speed) : 0,
              time: r.starttime || r.arrivedtime || null,
              address: r.strstatusen || "",
            }));
          setRoutePoints(pts);
          setRefreshMsg(`${pts.length} route points loaded`);
        } else if (vehicle.lat && vehicle.lng) {
          // Fallback: If no track points in selected range, show vehicle's current location pin
          setRoutePoints([
            {
              lat: vehicle.lat,
              lng: vehicle.lng,
              speed: vehicle.speed,
              time: vehicle.lastActive,
              address: `Current Location: ${vehicle.devicename}`,
            },
          ]);
          setRefreshMsg("No historical motion in this range, showing current position");
        } else {
          setRoutePoints([]);
          setRefreshMsg("No GPS points found for this device");
        }
      } catch (error) {
        console.error("Error loading route playback:", error);
        setRefreshMsg("Failed to load playback");
      } finally {
        setLoadingRoute(false);
      }
    },
    [filters.date_from, filters.date_to]
  );

  // Summary Metrics
  const summary = useMemo(() => {
    const total = vehicleList.length;
    const moving = vehicleList.filter((v) => v.status === "Moving").length;
    const stopped = vehicleList.filter((v) => v.status === "Stopped").length;
    const offline = vehicleList.filter((v) => v.status === "Offline").length;
    return { total, moving, stopped, offline };
  }, [vehicleList]);

  // Filtered List
  const filteredVehicles = useMemo(() => {
    let list = vehicleList;

    if (cardFilter === "moving") list = list.filter((v) => v.status === "Moving");
    if (cardFilter === "stopped") list = list.filter((v) => v.status === "Stopped");
    if (cardFilter === "offline") list = list.filter((v) => v.status === "Offline");

    if (filters.device_id) {
      list = list.filter((v) => v.deviceid === filters.device_id);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.deviceid.toLowerCase().includes(q) ||
          v.devicename.toLowerCase().includes(q) ||
          v.groupname.toLowerCase().includes(q)
      );
    }

    return list;
  }, [vehicleList, cardFilter, filters.device_id, searchQuery]);

  const selectPoint = useCallback((i, fromMap = false) => {
    setActivePoint(i);
    setAutoOpenPopup(!fromMap);
    if (!fromMap) {
      setFocusTick((t) => t + 1);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        mapBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Device ID",
        accessor: "deviceid",
        Cell: ({ value }) => <PlateBadge>{value}</PlateBadge>,
      },
      {
        Header: "Vehicle / Device Name",
        accessor: "devicename",
        Cell: ({ value }) => <span className="font-semibold text-header dark:text-white">{value}</span>,
      },
      { Header: "Group", accessor: "groupname" },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => <StatusBadge status={value} />,
      },
      {
        Header: "Speed",
        accessor: "speed",
        Cell: ({ value }) => (
          <span className={`font-semibold ${Number(value) > 0 ? "text-green" : "text-gray-500"}`}>
            {value} km/h
          </span>
        ),
      },
      {
        Header: "Ignition / Status",
        accessor: "ignitionStr",
        Cell: ({ value }) => <span className="text-xs text-header/80 dark:text-grey">{value || "-"}</span>,
      },
      {
        Header: "Voltage",
        accessor: "voltage",
        Cell: ({ value }) => <span className="text-sm font-medium">{value}</span>,
      },
      {
        Header: "Total (KM)",
        accessor: "totalKm",
        Cell: ({ value }) => <span className="font-medium">{value} km</span>,
      },
      {
        Header: "Last Seen",
        accessor: "lastActive",
        Cell: ({ value }) => <span className="text-xs text-gray-500">{formatTime(value)}</span>,
      },
      {
        Header: "Map",
        id: "actions",
        accessor: "deviceid",
        Cell: ({ row }) => (
          <Button
            onClick={() => fetchRoutePlayback(row.original)}
            title="View route and track on map"
            className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold"
          >
            <Route size={15} />
            Track
          </Button>
        ),
      },
    ],
    [fetchRoutePlayback]
  );

  const activePointData = activePoint != null ? routePoints[activePoint] : null;

  return (
    <div>
      {/* ===================== HEADER ===================== */}
      <div className="rounded-t bg-header px-4 md:px-6 py-3 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg md:text-2xl text-white flex items-center gap-x-3 uppercase">
          <Navigation size={28} className="text-primary" />
          Vehicle GPS Live Tracking
        </h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchGalaGpsData}
            disabled={loadingList}
            className="bg-primary hover:bg-primary/90 text-white text-sm px-3 py-1.5 rounded flex items-center gap-1.5"
          >
            <RefreshCw size={15} className={loadingList ? "animate-spin" : ""} />
            {loadingList ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={() => window.history.back()} variant="print">
            Back
          </Button>
        </div>
      </div>

      {/* ===================== SUMMARY CARDS ===================== */}
      <div className="grid grid-cols-12 gap-3 mt-4">
        <SummaryCard
          icon={<Car size={22} />}
          label="Total Vehicles"
          value={summary.total}
          tone="total"
          active={cardFilter === "all"}
          onClick={() => setCardFilter("all")}
        />
        <SummaryCard
          icon={<Activity size={22} />}
          label="Moving Now"
          value={summary.moving}
          tone="moving"
          active={cardFilter === "moving"}
          onClick={() => setCardFilter("moving")}
        />
        <SummaryCard
          icon={<CheckCircle2 size={22} />}
          label="Stopped / Idle"
          value={summary.stopped}
          tone="stopped"
          active={cardFilter === "stopped"}
          onClick={() => setCardFilter("stopped")}
        />
        <SummaryCard
          icon={<Radio size={22} />}
          label="Offline Devices"
          value={summary.offline}
          tone="offline"
          active={cardFilter === "offline"}
          onClick={() => setCardFilter("offline")}
        />
      </div>

      {/* ===================== FILTERS & SEARCH ===================== */}
      <div className="grid grid-cols-12 items-end gap-3 mt-4 p-3 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark rounded-lg shadow-one">
        <div className="col-span-12 md:col-span-3">
          <Ainput
            type="text"
            title="Search Vehicle / Device / Group"
            name="search"
            value={searchQuery}
            handleInputChange={(_, val) => setSearchQuery(val)}
            className="!h-[38px] !text-sm"
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <SelectSearch
            title="Filter by Vehicle"
            selectedValue={filters.device_id}
            name="device_id"
            options={[{ value: "", label: "All Vehicles" }, ...vehicleOptions]}
            handleInputChange={handleFilterChange}
            className="!h-[38px] !text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <Ainput
            type="date"
            title="Playback From"
            name="date_from"
            value={filters.date_from}
            handleInputChange={handleFilterChange}
            className="!h-[38px] !text-sm"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <Ainput
            type="date"
            title="Playback To"
            name="date_to"
            value={filters.date_to}
            handleInputChange={handleFilterChange}
            className="!h-[38px] !text-sm"
          />
        </div>
        <div className="col-span-12 md:col-span-2">
          <Button
            onClick={() => {
              if (selectedVehicle) {
                fetchRoutePlayback(selectedVehicle);
              } else {
                fetchGalaGpsData();
              }
            }}
            disabled={loadingList || loadingRoute}
            className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold h-[38px] rounded-md flex items-center justify-center gap-2"
          >
            {loadingList ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Load Data
          </Button>
        </div>
      </div>

      {/* ===================== TABS + CONTENT ===================== */}
      <div className="mt-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark rounded-lg shadow-one overflow-hidden">
        <div className="flex border-b border-borderColor dark:border-borderColor-dark">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-6 py-3.5 text-base md:text-lg font-semibold transition-colors border-b-2 ${
              activeTab === "list"
                ? "bg-primary text-white border-primary"
                : "bg-off dark:bg-dark/30 text-body-color dark:text-grey border-transparent hover:text-primary hover:bg-primary/5"
            }`}
          >
            <ListIcon size={18} />
            Live Fleet List
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "list" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {filteredVehicles.length}
            </span>
          </button>

          <button
            onClick={() => selectedVehicle && setActiveTab("map")}
            disabled={!selectedVehicle}
            className={`flex items-center gap-2 px-6 py-3.5 text-base md:text-lg font-semibold transition-colors border-b-2 ${
              activeTab === "map"
                ? "bg-green text-white border-green"
                : "bg-off dark:bg-dark/30 text-body-color dark:text-grey border-transparent hover:text-green hover:bg-green/5"
            } ${!selectedVehicle ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <Route size={18} />
            Map & Playback
            {selectedVehicle && <span className="ml-1 text-xs font-normal">({selectedVehicle.devicename})</span>}
          </button>
        </div>

        <div className="p-3 md:p-5">
          {/* ---------- TAB 1: FLEET LIST ---------- */}
          {activeTab === "list" && (
            <div className="text-base">
              {loadingList && filteredVehicles.length === 0 ? (
                <LoaderBox text="Loading vehicles from GalaGPS..." height="h-64" />
              ) : filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Car size={44} className="text-body-color/40 dark:text-grey/40" />
                  <div className="text-xl font-semibold text-header dark:text-white">No vehicles found</div>
                  <div className="text-sm text-body-color dark:text-grey">
                    Check your search query or clear the card filter.
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {loadingList && <OverlayLoader text="Updating positions..." />}
                  <DataTable
                    selectValue="deviceid"
                    columns={columns}
                    data={filteredVehicles}
                    filterPosition="FilterData"
                    numericFilterColumns={["speed", "totalKm"]}
                  />
                </div>
              )}
            </div>
          )}

          {/* ---------- TAB 2: MAP VIEW ---------- */}
          {activeTab === "map" && selectedVehicle && (
            <div>
              {/* Vehicle info bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-4 rounded-lg bg-off dark:bg-dark/40 border border-borderColor dark:border-borderColor-dark">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => setActiveTab("list")}
                    className="bg-white dark:bg-black text-header dark:text-white border border-borderColor dark:border-borderColor-dark hover:bg-primary/5 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <ArrowLeft size={16} /> Back to List
                  </Button>
                  <PlateBadge>{selectedVehicle.devicename}</PlateBadge>
                  <StatusBadge status={selectedVehicle.status} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-base md:text-lg text-header dark:text-white font-medium">
                    ID: {selectedVehicle.deviceid} · Group: {selectedVehicle.groupname}
                  </div>

                  <Button
                    onClick={() => fetchRoutePlayback(selectedVehicle)}
                    disabled={loadingRoute}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <RefreshCw size={16} className={loadingRoute ? "animate-spin" : ""} />
                    {loadingRoute ? "Loading Route..." : "Refresh Playback"}
                  </Button>
                </div>

                {refreshMsg && (
                  <div className="w-full flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 rounded-md bg-primary/10 text-primary font-medium">
                      {refreshMsg}
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <InfoItem
                  icon={<Gauge size={18} />}
                  label="Current Speed"
                  value={`${selectedVehicle.speed} km/h`}
                  accent="text-primary"
                  tint="bg-primary/10 border-primary/30"
                />
                <InfoItem
                  icon={<Zap size={18} />}
                  label="Ignition / ACC"
                  value={selectedVehicle.ignitionStr || "ACC OFF"}
                  accent="text-yellow-600"
                  tint="bg-yellow/15 border-yellow/40"
                />
                <InfoItem
                  icon={<BatteryCharging size={18} />}
                  label="Battery Voltage"
                  value={selectedVehicle.voltage || "-"}
                  accent="text-green"
                  tint="bg-green/15 border-green/40"
                />
                <InfoItem
                  icon={<Clock size={18} />}
                  label="Last Seen"
                  value={formatTime(selectedVehicle.lastActive)}
                  accent="text-blue-500"
                  tint="bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                />
              </div>

              {/* Trip start and latest point chips */}
              {!loadingRoute && routePoints.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <LocationItem
                    label="Route start"
                    point={routePoints[0]}
                    dotClass="bg-green"
                    onClick={() => selectPoint(0)}
                  />
                  {routePoints.length > 1 && (
                    <LocationItem
                      label="Latest point"
                      point={routePoints[routePoints.length - 1]}
                      dotClass="bg-red-500"
                      onClick={() => selectPoint(routePoints.length - 1)}
                    />
                  )}
                </div>
              )}

              {loadingRoute ? (
                <LoaderBox text="Loading route points from GalaGPS..." />
              ) : routePoints.length === 0 ? (
                <div className="relative flex flex-col items-center justify-center h-[480px] border border-borderColor dark:border-borderColor-dark rounded-lg bg-off dark:bg-black gap-3 text-center px-4">
                  <MapPin size={40} className="text-body-color/50 dark:text-grey/50" />
                  <div className="text-xl font-semibold text-header dark:text-white">
                    No GPS points in this date range
                  </div>
                  <div className="text-sm text-body-color dark:text-grey max-w-md">
                    Change the date range above and click &quot;Refresh Playback&quot;.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-8" ref={mapBoxRef}>
                    {activePointData && (
                      <div className="flex items-start justify-between gap-3 mb-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30">
                        <div className="flex items-start gap-2 min-w-0">
                          <MapPin size={18} className="mt-0.5 text-primary shrink-0" />
                          <div className="text-sm md:text-base text-header dark:text-white">
                            <b>{pointTitle(activePoint, routePoints.length)}</b>: vehicle was here at{" "}
                            <b>{formatTime(activePointData.time)}</b>
                            <div className="text-header/70 dark:text-grey break-words">
                              {pointAddress(activePointData)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActivePoint(null)}
                          aria-label="Clear highlight"
                          className="shrink-0 p-1 rounded hover:bg-primary/10 text-header dark:text-white"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}

                    <div className="relative">
                      <RouteMap
                        points={routePoints}
                        activeIndex={activePoint}
                        focusTick={focusTick}
                        autoOpenPopup={autoOpenPopup}
                        onPointSelect={(i) => selectPoint(i, true)}
                      />
                    </div>
                  </div>

                  {/* Point timeline */}
                  <div className="col-span-12 lg:col-span-4 border border-borderColor dark:border-borderColor-dark rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-off dark:bg-dark/40 border-b border-borderColor dark:border-borderColor-dark flex items-center justify-between">
                      <span className="font-bold text-lg text-header dark:text-white">Route Waypoints</span>
                      <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {routePoints.length}
                      </span>
                    </div>
                    <ul
                      ref={listRef}
                      className="relative max-h-[480px] overflow-y-auto divide-y divide-borderColor dark:divide-borderColor-dark"
                    >
                      {routePoints.map((p, i) => {
                        const isFirst = i === 0;
                        const isLast = i === routePoints.length - 1 && routePoints.length > 1;
                        const dot = isFirst ? "bg-green" : isLast ? "bg-red-500" : "bg-yellow";
                        const prev = i > 0 ? routePoints[i - 1] : null;
                        const gap = prev ? gapText(prev.time, p.time) : null;
                        const moved = prev ? metersBetween(prev, p) : null;
                        const speedNum = p.speed != null ? Number(p.speed) : null;
                        const hasSpeed = speedNum != null && !isNaN(speedNum);

                        return (
                          <li
                            key={i}
                            ref={(el) => {
                              itemRefs.current[i] = el;
                            }}
                          >
                            <button
                              onClick={() => selectPoint(i)}
                              className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-primary/5 ${
                                activePoint === i ? "bg-primary/10" : ""
                              }`}
                            >
                              <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${dot}`} />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-header dark:text-white">
                                    {pointTitle(i, routePoints.length)}
                                  </span>
                                  {hasSpeed && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        speedNum === 0
                                          ? "bg-yellow/15 text-header dark:text-yellow"
                                          : "bg-green/10 text-green"
                                      }`}
                                    >
                                      {speedNum === 0 ? "Stopped" : "Moving"}
                                    </span>
                                  )}
                                </span>
                                <span className="block text-xs text-header/70 dark:text-grey">
                                  {formatTime(p.time)}
                                  {p.speed != null ? ` · ${p.speed} km/h` : ""}
                                </span>
                                <span className="block text-xs text-header/70 dark:text-grey mt-0.5 break-words">
                                  {pointAddress(p)}
                                </span>
                                {prev && (
                                  <span className="block text-xs text-header/60 dark:text-grey mt-1">
                                    {gap ? `+${gap} · ` : ""}
                                    {formatMeters(moved)}
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleGpsTracking;