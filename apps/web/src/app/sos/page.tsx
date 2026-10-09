"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "@/config/api";

export type EmergencyType = "security" | "anti-ragging" | "medical" | "fire";

interface ActiveSOSAlert {
  _id: string;
  studentId?: {
    _id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  student?: {
    _id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  location: string;
  emergencyType?: EmergencyType;
  status: "active" | "resolved";
  createdAt?: string;
  timestamp?: string;
}

const EMERGENCY_CONTACTS: Record<
  EmergencyType,
  {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    badgeBg: string;
    borderActive: string;
    buttonBg: string;
    contacts: { role: string; name: string; phone: string; note: string }[];
  }
> = {
  security: {
    title: "Campus Security & Protection",
    subtitle: "Immediate guard dispatch for physical threats, harassment, or night transit.",
    icon: "🛡️",
    color: "#DC2626",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    borderActive: "border-red-500 bg-red-50/50",
    buttonBg: "bg-red-600 hover:bg-red-700 shadow-red-500/30",
    contacts: [
      { role: "Chief Security Officer (CSO)", name: "Col. R. K. Joshi", phone: "+91-9876543210", note: "24/7 Security Control Room" },
      { role: "Main Gate 1 & 2 Guard Post", name: "Duty Inspector Desk", phone: "+91-9876543215", note: "Campus Entrance Rapid Response" },
      { role: "National Police Control", name: "Dial 112", phone: "112", note: "Immediate Police & PCR Van" }
    ]
  },
  "anti-ragging": {
    title: "Anti-Ragging Squad & Committee",
    subtitle: "Confidential protection against senior harassment, bullying, or hostel coercion.",
    icon: "🚫",
    color: "#7C3AED",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    borderActive: "border-purple-500 bg-purple-50/50",
    buttonBg: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30",
    contacts: [
      { role: "Anti-Ragging Committee Head", name: "Dr. S. K. Bansal", phone: "+91-9876543220", note: "Strict Confidential Action Desk" },
      { role: "National Anti-Ragging Helpline", name: "UGC Toll-Free 24x7", phone: "18001805522", note: "Zero-Tolerance National Helpline" },
      { role: "Dean of Student Affairs (DSW)", name: "Prof. Anjali Mehta", phone: "+91-9876543222", note: "Campus Proctorial Authority" },
      { role: "Hostel Chief Warden", name: "Hostel Security Cell", phone: "+91-9876543225", note: "Resident Block Squad" }
    ]
  },
  medical: {
    title: "Medical Health Center & Ambulance",
    subtitle: "Immediate medical assistance for acute trauma, fainting, or health emergencies.",
    icon: "🚑",
    color: "#059669",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderActive: "border-emerald-500 bg-emerald-50/50",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30",
    contacts: [
      { role: "Campus Health Center", name: "Dr. Neha Verma (RMO)", phone: "+91-9876543230", note: "Campus Infirmary & Emergency Kit" },
      { role: "Emergency Ambulance", name: "Govt. Ambulance 108", phone: "108", note: "On-Call Campus Ambulance" },
      { role: "Nearest Trauma Hospital", name: "Indore City Hospital Desk", phone: "07312555555", note: "Emergency ICU & Casualty" }
    ]
  },
  fire: {
    title: "Disaster & Fire Safety Cell",
    subtitle: "Chemical lab hazard, electrical fire, or building evacuation protocol.",
    icon: "🔥",
    color: "#EA580C",
    badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
    borderActive: "border-orange-500 bg-orange-50/50",
    buttonBg: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/30",
    contacts: [
      { role: "Campus Fire Safety Officer", name: "Mr. Arvind Saxena", phone: "+91-9876543240", note: "Safety & Extinguisher Squad" },
      { role: "Fire Emergency Dispatch", name: "National Fire 101", phone: "101", note: "Indore Fire Brigade Station" }
    ]
  }
};

const COMMON_LOCATIONS = [
  "B.Tech Block B Entrance",
  "Vehicle Parking Area",
  "Architecture Building",
  "Gate No. 2 Main Entrance",
  "Central Library (4th Floor)",
  "Computer Lab 1 (1st Floor)",
  "Auditorium Foyer"
];

export default function SOSPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tabs: 'panic' | 'queue'
  const isAuthority = userRole === "admin" || userRole === "faculty" || userRole === "management";
  const [activeTab, setActiveTab] = useState<"panic" | "queue">("panic");

  // Emergency Form State
  const [selectedType, setSelectedType] = useState<EmergencyType>("security");
  const [location, setLocation] = useState("B.Tech Block B Entrance");

  // Countdown & Active Beacon State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeAlertDispatched, setActiveAlertDispatched] = useState(false);
  const [lastDispatchedTime, setLastDispatchedTime] = useState<string | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active Incidents Queue
  const [sosAlerts, setSosAlerts] = useState<ActiveSOSAlert[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [alertNotice, setAlertNotice] = useState<{ title: string; message: string; type: "success" | "error" | "danger" } | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      if (savedRole === "admin" || savedRole === "faculty" || savedRole === "management") {
        setActiveTab("queue");
      }
    }
  }, []);

  // Fetch Active SOS Alerts
  const fetchActiveSOS = async () => {
    if (!token) return;
    setLoadingQueue(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.alerts)) {
        setSosAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Failed to fetch active SOS alerts:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (token && (activeTab === "queue" || isAuthority)) {
      fetchActiveSOS();
    }
  }, [token, activeTab, isAuthority]);

  // Real-time Socket.IO Connection
  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(BACKEND_URL, { query: { token } });

    socket.on("sos:alert", (newAlert: ActiveSOSAlert) => {
      setSosAlerts((prev) => [newAlert, ...prev.filter((a) => a._id !== newAlert._id)]);
      setAlertNotice({
        title: "🚨 EMERGENCY ALERT BROADCAST RECEIVED",
        message: `Incident: ${(newAlert.emergencyType || "security").toUpperCase()} at ${newAlert.location}`,
        type: "danger"
      });
    });

    socket.on("sos:resolved", (resolvedAlert: ActiveSOSAlert) => {
      setSosAlerts((prev) => prev.filter((a) => a._id !== resolvedAlert._id));
    });

    return () => {
      socket.disconnect();
    };
  }, [BACKEND_URL, token]);

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Countdown timer logic (3 seconds)
  const handleStartPanicCountdown = () => {
    if (!location.trim()) {
      setAlertNotice({
        title: "Location Required",
        message: "Please specify your location on campus before triggering the alarm.",
        type: "error"
      });
      return;
    }

    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          dispatchEmergencySOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAbortCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  // Dispatch SOS Alert to backend
  const dispatchEmergencySOS = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          location: location.trim(),
          emergencyType: selectedType
        })
      });
      const data = await response.json();
      if (data.success) {
        setActiveAlertDispatched(true);
        setLastDispatchedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setAlertNotice({
          title: "🚨 EMERGENCY ALARM BROADCASTED",
          message: `Campus Security, Faculty proctors, and the ${EMERGENCY_CONTACTS[selectedType].title} have received your location: ${location}. Stay in a safe area.`,
          type: "danger"
        });
      } else {
        setAlertNotice({
          title: "Dispatch Failed",
          message: data.message || "Could not dispatch alert. Please dial the emergency numbers directly.",
          type: "error"
        });
      }
    } catch (err) {
      setAlertNotice({
        title: "Connection Error",
        message: "Failed to connect to security dispatch server. Please call emergency numbers directly.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Resolve Alert action for authorities
  const handleResolveSOS = async (sosId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sos/${sosId}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSosAlerts((prev) => prev.filter((a) => a._id !== sosId));
        setAlertNotice({
          title: "Incident Resolved",
          message: "Alert marked as resolved successfully.",
          type: "success"
        });
      } else {
        setAlertNotice({
          title: "Resolution Failed",
          message: data.message || "Failed to mark alert as resolved.",
          type: "error"
        });
      }
    } catch (err) {
      setAlertNotice({
        title: "Error",
        message: "Error resolving SOS alert.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = EMERGENCY_CONTACTS[selectedType];

  return (
    <DashboardLayout>
      <div className="space-y-6 text-zinc-950 font-sans max-w-5xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                🚨 Campus Safety Network
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                24/7 Security Active
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Emergency SOS Dispatch</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Immediate assistance, anti-ragging squad, and campus guard rapid response.
            </p>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200 self-start sm:self-center">
            <button
              onClick={() => setActiveTab("panic")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "panic"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              🚨 Panic SOS
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === "queue"
                  ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/30"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>📋 Live Queue</span>
              {sosAlerts.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
                  {sosAlerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Alert Notification Banner */}
        {alertNotice && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition-all ${
              alertNotice.type === "danger"
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : alertNotice.type === "error"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
            }`}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider">{alertNotice.title}</p>
              <p className="text-xs mt-0.5 font-medium">{alertNotice.message}</p>
            </div>
            <button
              onClick={() => setAlertNotice(null)}
              className="text-xs font-bold hover:opacity-70 px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= TAB 1: PANIC SOS TRIGGER ================= */}
        {activeTab === "panic" && (
          <div className="space-y-6">
            {/* Active Beacon Banner (If Alert was already fired) */}
            {activeAlertDispatched && (
              <div className="p-5 bg-gradient-to-r from-rose-700 via-rose-800 to-red-900 text-white rounded-3xl border-2 border-rose-500 shadow-xl shadow-rose-900/20 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-400"></span>
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-rose-200">
                        Emergency Beacon Broadcasted • {lastDispatchedTime}
                      </p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        Campus Security & Quick Response Squads alerted for:{" "}
                        <span className="underline decoration-rose-300 font-black">{location}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveAlertDispatched(false);
                      setAlertNotice({
                        title: "Beacon Reset",
                        message: "Your emergency beacon has been dismissed. Stay safe.",
                        type: "success"
                      });
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-xl backdrop-blur-sm transition-all border border-white/30 self-start sm:self-auto"
                  >
                    I Am Safe Now (Dismiss Beacon)
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Emergency Type Selection */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-zinc-900">1. What type of emergency is this?</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Categorizing ensures the right team (Campus Security, Anti-Ragging Committee, or Medical Center) responds immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: "security" as EmergencyType,
                    label: "Campus Security",
                    desc: "Harassment & Physical Threat",
                    icon: "🛡️",
                    border: "border-red-500",
                    bg: "bg-red-50/70 text-red-950"
                  },
                  {
                    id: "anti-ragging" as EmergencyType,
                    label: "Anti-Ragging Squad",
                    desc: "Bullying, Coercion & Intimidation",
                    icon: "🚫",
                    border: "border-purple-500",
                    bg: "bg-purple-50/70 text-purple-950"
                  },
                  {
                    id: "medical" as EmergencyType,
                    label: "Medical Emergency",
                    desc: "Acute Trauma, Fainting & Injury",
                    icon: "🚑",
                    border: "border-emerald-500",
                    bg: "bg-emerald-50/70 text-emerald-950"
                  },
                  {
                    id: "fire" as EmergencyType,
                    label: "Fire & Lab Hazard",
                    desc: "Chemical Hazard & Electrical Fire",
                    icon: "🔥",
                    border: "border-orange-500",
                    bg: "bg-orange-50/70 text-orange-950"
                  }
                ].map((item) => {
                  const isSelected = selectedType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedType(item.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? `${item.border} ${item.bg} shadow-md`
                          : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <p className={`text-xs font-black ${isSelected ? "text-zinc-900" : "text-zinc-800"}`}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Location Input & Big Panic Button */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-zinc-900">2. Transmit Live SOS Alarm</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Confirm your exact location on campus. Pressing the button will broadcast an immediate distress beacon to on-duty responders.
                </p>
              </div>

              {/* Location Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-700 uppercase tracking-wider">
                  Campus Location:
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter current block, room, floor, or landmark..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_LOCATIONS.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        location === loc
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200"
                      }`}
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Pulsating Panic Button / Countdown Trigger */}
              <div className="flex flex-col items-center justify-center py-6">
                {countdown !== null ? (
                  <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-200">
                    <div className="w-32 h-32 rounded-full bg-rose-600 text-white flex items-center justify-center text-5xl font-black shadow-2xl shadow-rose-600/50 animate-pulse border-4 border-rose-200">
                      {countdown}
                    </div>
                    <p className="text-sm font-black text-rose-600 uppercase tracking-widest animate-pulse">
                      DISPATCHING ALERT IN {countdown}s...
                    </p>
                    <button
                      onClick={handleAbortCountdown}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      ✕ Cancel Dispatch
                    </button>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center space-y-3 py-8">
                    <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-rose-700 uppercase tracking-wider">Broadcasting Alarm to Officers...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <button
                      onClick={handleStartPanicCountdown}
                      type="button"
                      className="relative group w-44 h-44 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: currentCategory.color,
                        boxShadow: `0 20px 35px -5px ${currentCategory.color}66`
                      }}
                    >
                      <span className="absolute -inset-3 rounded-full opacity-30 animate-ping" style={{ backgroundColor: currentCategory.color }} />
                      <span className="text-4xl font-black tracking-wider drop-shadow-md">SOS</span>
                      <span className="text-[10px] font-black tracking-widest text-white/90 uppercase mt-1">
                        Click for Help
                      </span>
                    </button>
                    <p className="text-xs text-zinc-500 font-semibold max-w-xs text-center">
                      Clicking initiates a 3-second safety window before emergency squads are dispatched.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Context-Aware Emergency Directory & Helplines */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-150">
                <span className="text-3xl">{currentCategory.icon}</span>
                <div>
                  <h4 className="text-base font-black text-zinc-900">{currentCategory.title} Helplines</h4>
                  <p className="text-xs text-zinc-500">{currentCategory.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {currentCategory.contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between hover:border-zinc-300 transition-all space-y-3"
                  >
                    <div>
                      <p className="text-xs font-black text-zinc-900">{contact.role}</p>
                      <p className="text-xs font-semibold text-zinc-700 mt-0.5">{contact.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{contact.note}</p>
                    </div>

                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-black text-white transition-all shadow-sm cursor-pointer"
                      style={{ backgroundColor: currentCategory.color }}
                    >
                      <span>📞</span>
                      <span>Call {contact.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE INCIDENTS QUEUE (SECURITY DESK) ================= */}
        {activeTab === "queue" && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Active Campus Incidents</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Real-time distress alarms broadcasted by students across campus blocks.
                </p>
              </div>
              <button
                onClick={fetchActiveSOS}
                disabled={loadingQueue}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold border border-zinc-200 flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer"
              >
                <span>🔄</span>
                <span>Refresh Live Queue</span>
              </button>
            </div>

            {loadingQueue && (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loadingQueue && sosAlerts.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <h4 className="text-base font-black text-zinc-800">All Clear on Campus</h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  There are no active SOS emergency distress alerts at this moment. The campus safety grid is secure.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sosAlerts.map((alertItem) => {
                  const type = alertItem.emergencyType || "security";
                  const meta = EMERGENCY_CONTACTS[type] || EMERGENCY_CONTACTS.security;
                  const studentName =
                    alertItem.student?.name ||
                    alertItem.studentId?.name ||
                    alertItem.student?.email ||
                    alertItem.studentId?.email ||
                    "Student User";

                  const timestamp = alertItem.createdAt || alertItem.timestamp || new Date().toISOString();

                  return (
                    <div
                      key={alertItem._id}
                      className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                            style={{ backgroundColor: meta.color }}
                          >
                            <span>{meta.icon}</span>
                            <span>{meta.title.toUpperCase()}</span>
                          </span>
                          <span className="text-[11px] font-bold text-zinc-400">
                            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-black text-zinc-900">
                            📍 Location: <span className="text-rose-600">{alertItem.location}</span>
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            Reported by: <span className="font-bold text-zinc-800">{studentName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveSOS(alertItem._id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all cursor-pointer"
                        >
                          ✓ Mark Resolved
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
