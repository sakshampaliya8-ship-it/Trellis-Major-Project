"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BACKEND_URL } from "@/config/api";

interface LocationItem {
  _id: string;
  name: string;
  category: string;
  building: string;
  floor: number;
  roomNumber?: string;
  wing?: string;
  description?: string;
}

export default function FinderPage() {
  const [token, setToken] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Starting location states
  const [startQuery, setStartQuery] = useState("IPS Academy Gate No. 2");
  const [selectedStartId, setSelectedStartId] = useState("node-gate-2");
  const [showStartDropdown, setShowStartDropdown] = useState(false);

  // Destination states
  const [destQuery, setDestQuery] = useState("");
  const [selectedDestLocation, setSelectedDestLocation] = useState<LocationItem | null>(null);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // Route calculation states
  const [routeDirections, setRouteDirections] = useState<string[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Building Directory & Floor Plan Selector (Fix 1)
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [directoryActiveFloor, setDirectoryActiveFloor] = useState<number>(2);

  // Live Movement Tracking Navigation (Fix 2)
  const [isLiveNavigating, setIsLiveNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0); // 0 to 100%
  const [isNavPlaying, setIsNavPlaying] = useState(true);
  const [navSpeed, setNavSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [isGpsMode, setIsGpsMode] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const routeResultsRef = useRef<HTMLDivElement>(null);
  const liveNavRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setShowStartDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Movement Simulation Loop (Smooth animated marker movement)
  useEffect(() => {
    if (!isLiveNavigating || !isNavPlaying || isGpsMode) return;

    const interval = setInterval(() => {
      setNavProgress((prev) => {
        const step = 0.5 * navSpeed;
        if (prev + step >= 100) {
          setIsNavPlaying(false);
          return 100;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isLiveNavigating, isNavPlaying, navSpeed, isGpsMode]);

  // Update current step index based on progress
  useEffect(() => {
    if (routeDirections.length === 0) return;
    const stepCount = routeDirections.length;
    const index = Math.min(stepCount - 1, Math.floor((navProgress / 100) * stepCount));
    setCurrentStepIndex(index);
  }, [navProgress, routeDirections]);

  // Real Hardware GPS Tracking Mode
  useEffect(() => {
    if (isLiveNavigating && isGpsMode && "geolocation" in navigator) {
      setGpsError(null);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          // IPS Academy Gate 2 coordinates: 22.6455 N, 75.8360 E
          // B.Tech Block B Entrance: 22.6432 N, 75.8375 E
          const gateLat = 22.6455;
          const gateLng = 75.8360;
          const { latitude, longitude } = pos.coords;

          // Simple distance from gate in meters (Haversine approximation)
          const dLat = (latitude - gateLat) * 111320;
          const dLng = (longitude - gateLng) * 40075000 * Math.cos((gateLat * Math.PI) / 180) / 360;
          const distWalked = Math.sqrt(dLat * dLat + dLng * dLng);

          const totalDist = routeDistance || 300;
          const calculatedProgress = Math.min(100, Math.max(0, (distWalked / totalDist) * 100));
          setNavProgress(calculatedProgress);
        },
        (err) => {
          setGpsError(err.message || "GPS signal unavailable. Defaulting to Simulated Walk.");
          setIsGpsMode(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
      watchIdRef.current = id;
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isLiveNavigating, isGpsMode, routeDistance]);

  const fetchLocations = async () => {
    try {
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${BACKEND_URL}/api/locations`, { headers });
      const data = await response.json();
      if (data.success && Array.isArray(data.locations)) {
        setLocations(data.locations);
      } else if (Array.isArray(data)) {
        setLocations(data);
      }
    } catch (err) {
      console.warn("Notice: Locations fetch warning:", err);
    }
  };

  // Start location options
  const startOptions = [
    { id: "node-gate-2", name: "IPS Academy Gate No. 2", sub: "Main Entrance (0m)" },
    { id: "node-arch", name: "Architecture Building", sub: "130m along campus avenue" },
    { id: "node-parking", name: "Vehicle Parking Area", sub: "220m along campus avenue" },
    { id: "node-block-b-entrance", name: "B.Tech Building (Block B Entrance)", sub: "300m along campus avenue" },
    { id: "node-block-b-lobby", name: "Block B Ground Lobby", sub: "Inside ground floor" }
  ];

  const filteredStartOptions = startOptions.filter((opt) =>
    opt.name.toLowerCase().includes(startQuery.toLowerCase())
  );

  // Filter destination suggestions from locations
  const filteredDestOptions = locations.filter((loc) => {
    if (!destQuery.trim()) return true;
    const q = destQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      (loc.roomNumber && loc.roomNumber.toLowerCase().includes(q)) ||
      (loc.building && loc.building.toLowerCase().includes(q)) ||
      (loc.description && loc.description.toLowerCase().includes(q))
    );
  });

  const handleSelectStart = (opt: { id: string; name: string }) => {
    setSelectedStartId(opt.id);
    setStartQuery(opt.name);
    setShowStartDropdown(false);
  };

  const handleSelectDest = (loc: LocationItem) => {
    setSelectedDestLocation(loc);
    setDestQuery(loc.roomNumber ? `[${loc.roomNumber}] ${loc.name}` : loc.name);
    setShowDestDropdown(false);
  };

  const calculateRoute = async (destLoc?: LocationItem) => {
    const target = destLoc || selectedDestLocation;
    if (!target) {
      alert("Please select a destination from the suggestions dropdown.");
      return;
    }

    setLoadingRoute(true);
    setHasSearched(true);
    setIsLiveNavigating(false);
    setNavProgress(0);
    try {
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(
        `${BACKEND_URL}/api/route?from=${selectedStartId}&to=${target._id}`,
        { headers }
      );
      const data = await response.json();
      if (data.success) {
        setRouteDirections(data.directions || []);
        setRouteDistance(data.totalDistance || 0);
        setTimeout(() => {
          routeResultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        alert(data.message || "Route calculation failed.");
      }
    } catch (err) {
      alert("Could not reach pathfinding service. Ensure backend is running.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const startLiveNavigation = () => {
    setIsLiveNavigating(true);
    setNavProgress(0);
    setIsNavPlaying(true);
    setTimeout(() => {
      liveNavRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateRoute();
  };

  // Navigate directly from Building Directory to a specific room
  const handleNavigateFromDirectory = (room: LocationItem) => {
    handleSelectDest(room);
    calculateRoute(room);
  };

  // Rooms on active floor of selected building
  const directoryFloorRooms = locations.filter(
    (l) => l.building === selectedBuilding && l.floor === directoryActiveFloor
  );

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "classroom":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "lab":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "library":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "student-section":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "faculty-cabin":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "washroom":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  // Current real-time distance covered
  const walkedMeters = Math.round((navProgress / 100) * routeDistance);
  const remainingMeters = Math.max(0, routeDistance - walkedMeters);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 text-zinc-950 font-sans pb-16">
        {/* Form: Where do you want to go? */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Campus Navigator
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-1.5">
              Where do you want to go?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Enter your starting point and destination to calculate distances, start live movement tracking, and view building layouts.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Starting Location Field with Dropdown */}
              <div ref={startRef} className="relative">
                <label className="block text-xs font-bold text-zinc-600 mb-1.5 flex items-center gap-1.5">
                  <span className="text-emerald-600">🚩</span> Starting Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={startQuery}
                    onChange={(e) => {
                      setStartQuery(e.target.value);
                      setShowStartDropdown(true);
                    }}
                    onFocus={() => setShowStartDropdown(true)}
                    placeholder="Type starting location..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-3.5 text-zinc-400 text-xs">▼</span>
                </div>

                {/* Start Suggestions Dropdown */}
                {showStartDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto">
                    {filteredStartOptions.length === 0 ? (
                      <div className="p-3 text-xs text-zinc-400 text-center">No locations found</div>
                    ) : (
                      filteredStartOptions.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectStart(opt)}
                          className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-zinc-100 last:border-b-0 transition-colors"
                        >
                          <div className="text-xs font-bold text-zinc-900">{opt.name}</div>
                          <div className="text-[10px] text-zinc-500">{opt.sub}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 2. Destination Field with Dropdown */}
              <div ref={destRef} className="relative">
                <label className="block text-xs font-bold text-zinc-600 mb-1.5 flex items-center gap-1.5">
                  <span className="text-rose-600">🎯</span> Destination
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={destQuery}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    placeholder="Type destination, Room N-204, Library, Lab..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-3.5 text-zinc-400 text-xs">▼</span>
                </div>

                {/* Destination Suggestions Dropdown */}
                {showDestDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto">
                    {filteredDestOptions.length === 0 ? (
                      <div className="p-4 text-xs text-zinc-400 text-center">
                        No matching rooms or landmarks found. Try &ldquo;N204&rdquo; or &ldquo;Library&rdquo;.
                      </div>
                    ) : (
                      filteredDestOptions.map((loc) => (
                        <div
                          key={loc._id}
                          onClick={() => handleSelectDest(loc)}
                          className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-zinc-100 last:border-b-0 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              {loc.roomNumber && (
                                <span className="text-[10px] font-black bg-zinc-900 text-white px-1.5 py-0.2 rounded">
                                  {loc.roomNumber}
                                </span>
                              )}
                              <span className="text-xs font-bold text-zinc-900">{loc.name}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              {loc.building} &bull; {loc.floor === 0 ? "Ground Floor" : `Floor ${loc.floor}`} {loc.wing ? `(${loc.wing})` : ""}
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(loc.category)}`}>
                            {loc.category}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Destination Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 pt-1">
              <span className="text-[11px] font-semibold text-zinc-400">Popular:</span>
              {[
                "Room N-204 (CSE Lecture Hall)",
                "B.Tech Building (Block B Entrance)",
                "Central Library (Main Reading Hall)",
                "Student Section (Academic Affairs)",
                "Room N-104 (Computer Lab 1)",
                "Architecture Building"
              ].map((name) => {
                const match = locations.find((l) => l.name === name || l.name.includes(name));
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      if (match) handleSelectDest(match);
                    }}
                    className="px-2.5 py-1 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-[11px] font-medium text-zinc-700 transition-colors cursor-pointer"
                  >
                    {name.split("(")[0].trim()}
                  </button>
                );
              })}
            </div>

            {/* Submit & Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loadingRoute}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingRoute ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Calculating Route & Distance...</span>
                  </>
                ) : (
                  <>
                    <span>🧭</span>
                    <span>Get Route & Instructions</span>
                  </>
                )}
              </button>

              {hasSearched && (
                <button
                  type="button"
                  onClick={startLiveNavigation}
                  className="py-3.5 px-6 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="animate-pulse">▶️</span>
                  <span>Start Live Navigation</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* FIX 2: Live Movement Tracking View (Google Maps Style) */}
        {isLiveNavigating && (
          <div ref={liveNavRef} className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-zinc-800 animate-fadeIn">
            {/* Top Navigation Banner (Google Maps Turn Banner) */}
            <div className="bg-emerald-700 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                  {currentStepIndex === routeDirections.length - 1
                    ? "🎯"
                    : currentStepIndex >= 3
                    ? "🪜"
                    : "⬆️"}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                    {navProgress >= 100
                      ? "Arrived at Destination"
                      : `Step ${currentStepIndex + 1} of ${routeDirections.length}`}
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white leading-snug mt-0.5">
                    {routeDirections[currentStepIndex] || "Proceed along route"}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLiveNavigating(false)}
                className="py-1.5 px-3 bg-emerald-900/80 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/40 shrink-0 cursor-pointer"
              >
                ✕ Exit
              </button>
            </div>

            {/* Live Visual Campus Avenue & Marker Tracker */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-white uppercase text-[11px]">
                    {isGpsMode ? "Live Hardware GPS Tracking" : "Live Walking Simulation Tracker"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Walked: <strong className="text-white">{walkedMeters}m</strong></span>
                  <span>&bull;</span>
                  <span>Remaining: <strong className="text-emerald-400">{remainingMeters}m</strong></span>
                </div>
              </div>

              {/* Visual Avenue Track with Live Marker Puck */}
              <div className="relative py-8 px-4">
                {/* Background Track Line */}
                <div className="h-3 w-full bg-zinc-800 rounded-full relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-300 rounded-full"
                    style={{ width: `${navProgress}%` }}
                  />
                </div>

                {/* Glowing Live Navigation Puck / Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 z-10 flex flex-col items-center"
                  style={{ left: `${Math.min(96, Math.max(4, navProgress))}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-emerald-400/30 animate-ping absolute" />
                    <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">
                      ▲
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-zinc-900 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/50 mt-1 shadow-md whitespace-nowrap">
                    {walkedMeters}m
                  </span>
                </div>

                {/* Landmark Checkpoints along the avenue */}
                <div className="flex justify-between items-start text-[10px] font-semibold text-zinc-400 mt-6 pt-2">
                  <div className={`flex flex-col items-start ${navProgress >= 0 ? "text-emerald-400 font-bold" : ""}`}>
                    <span>🚩 Gate 2</span>
                    <span className="text-[9px] text-zinc-500">0m</span>
                  </div>
                  <div className={`flex flex-col items-center ${navProgress >= 34 ? "text-emerald-400 font-bold" : ""}`}>
                    <span>🏛️ Arch Bldg</span>
                    <span className="text-[9px] text-zinc-500">130m</span>
                  </div>
                  <div className={`flex flex-col items-center ${navProgress >= 57 ? "text-emerald-400 font-bold" : ""}`}>
                    <span>🅿️ Parking</span>
                    <span className="text-[9px] text-zinc-500">220m</span>
                  </div>
                  <div className={`flex flex-col items-center ${navProgress >= 78 ? "text-emerald-400 font-bold" : ""}`}>
                    <span>🏢 Block B</span>
                    <span className="text-[9px] text-zinc-500">300m</span>
                  </div>
                  <div className={`flex flex-col items-end ${navProgress >= 100 ? "text-emerald-400 font-bold" : ""}`}>
                    <span>🎯 {selectedDestLocation?.roomNumber || "Dest"}</span>
                    <span className="text-[9px] text-zinc-500">{routeDistance}m</span>
                  </div>
                </div>
              </div>

              {/* Milestone Alert Badge */}
              <div className="bg-zinc-800/80 rounded-xl p-3 border border-zinc-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {navProgress >= 100
                      ? "🎉"
                      : navProgress >= 78
                      ? "🏢"
                      : navProgress >= 57
                      ? "🅿️"
                      : navProgress >= 34
                      ? "🏛️"
                      : "🚶"}
                  </span>
                  <span className="text-zinc-200 font-medium">
                    {navProgress >= 100
                      ? `Arrived at destination: ${selectedDestLocation?.name}!`
                      : navProgress >= 78
                      ? "Inside B.Tech Block B: Walk 10m straight in lobby, then turn right to the stairs."
                      : navProgress >= 57
                      ? "Passing Vehicle Parking Area on your right (220m mark)."
                      : navProgress >= 34
                      ? "Passing Architecture Building on your left (130m mark)."
                      : "Walking along campus avenue towards B.Tech Building Block B."}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">
                  {Math.round(navProgress)}% Completed
                </span>
              </div>
            </div>

            {/* Live Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-zinc-800">
              {/* Play / Pause & Speed */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsNavPlaying(!isNavPlaying)}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isNavPlaying ? "⏸️ Pause" : "▶️ Resume"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNavProgress(0);
                    setIsNavPlaying(true);
                  }}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Restart Walk"
                >
                  🔄 Restart
                </button>

                {/* Speed Toggles for Evaluation Demos */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  {[
                    { label: "1x", val: 1 },
                    { label: "2x", val: 2 },
                    { label: "5x Demo", val: 5 }
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setNavSpeed(s.val)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        navSpeed === s.val ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Device GPS Toggle */}
              <div className="flex items-center gap-3">
                {gpsError && (
                  <span className="text-[10px] text-rose-400 font-semibold">{gpsError}</span>
                )}
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGpsMode}
                    onChange={(e) => setIsGpsMode(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold">📡 Use Real Phone GPS</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Route Instructions & Distance Display (Only shown after searching) */}
        {hasSearched && (
          <div ref={routeResultsRef} className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header: Distance & Time Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Route Summary
                </span>
                <h4 className="text-lg font-black text-zinc-950 mt-1">
                  {startQuery} ➜ {destQuery || selectedDestLocation?.name}
                </h4>
                {selectedDestLocation && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Destination: {selectedDestLocation.building} &bull; {selectedDestLocation.floor === 0 ? "Ground Floor" : `Floor ${selectedDestLocation.floor}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 self-start sm:self-auto">
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Walking Distance</div>
                  <div className="text-lg font-black text-emerald-950">{routeDistance} meters</div>
                </div>
                <div className="h-8 w-px bg-emerald-200" />
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Estimated Time</div>
                  <div className="text-lg font-black text-emerald-950">~{Math.max(1, Math.round(routeDistance / 75))} mins</div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Step-by-Step Directions
                </h5>
                <button
                  type="button"
                  onClick={startLiveNavigation}
                  className="py-1 px-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>▶️ Track Live on Map</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {routeDirections.map((step, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === routeDirections.length - 1;
                  const isIndoorNotice = step.includes("10 meters") || step.includes("turn right") || step.includes("Central Staircase");
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 text-xs leading-relaxed ${
                        isFirst
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                          : isLast
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : isIndoorNotice
                          ? "bg-amber-50 border-amber-200 text-amber-950 font-medium"
                          : "bg-zinc-50 border-zinc-200 text-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                          isLast
                            ? "bg-white text-emerald-800"
                            : isFirst
                            ? "bg-emerald-700 text-white"
                            : isIndoorNotice
                            ? "bg-amber-600 text-white"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={isLast ? "font-bold text-white" : "font-medium"}>{step}</p>
                        {isIndoorNotice && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800">
                            💡 Indoor Entrance: Walk 10m straight in lobby, then turn right to access stairs.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Building Directory & Floor Plan Selector (Fix 1: On-demand form) */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <h4 className="text-lg font-black text-zinc-950">
                  Building Directory & Floor Plans
                </h4>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Want to browse rooms inside a specific building? Choose a building below to view its floor layout and navigate.
              </p>
            </div>
          </div>

          {/* Simple Form: "Which building directory or plan do you want to see?" */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1.5">
                Which building directory or floor plan do you want to see?
              </label>
              <select
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  if (e.target.value === "B.Tech Building (Block B)") {
                    setDirectoryActiveFloor(2); // default to Floor 2 for B.Tech
                  } else {
                    setDirectoryActiveFloor(0);
                  }
                }}
                className="w-full sm:w-96 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Select a Building --</option>
                <option value="B.Tech Block B">🏢 B.Tech Building (Block B) &bull; Ground + 4 Floors</option>
                <option value="Campus Grounds">🏛️ Campus Landmarks (Gate No. 2, Architecture, Parking)</option>
              </select>
            </div>

            {/* When a building is selected, show its floors and room numbers */}
            {selectedBuilding === "B.Tech Block B" && (
              <div className="pt-4 border-t border-zinc-100 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h5 className="text-sm font-black text-zinc-900">
                    B.Tech Building (Block B) &bull; Select Floor
                  </h5>
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    Floor {directoryActiveFloor === 0 ? "Ground" : directoryActiveFloor}
                  </span>
                </div>

                {/* Floor Switcher Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { floor: 0, label: "Ground Floor", note: "Auditorium & Admin" },
                    { floor: 1, label: "1st Floor", note: "Rooms N-101 to N-109" },
                    { floor: 2, label: "2nd Floor", note: "Rooms N-201 to N-209" },
                    { floor: 3, label: "3rd Floor", note: "Rooms N-301 to N-309" },
                    { floor: 4, label: "4th Floor", note: "Library & Student Sec" }
                  ].map((fl) => (
                    <button
                      key={fl.floor}
                      type="button"
                      onClick={() => setDirectoryActiveFloor(fl.floor)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        directoryActiveFloor === fl.floor
                          ? "bg-emerald-700 border-emerald-700 text-white shadow-md scale-102"
                          : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="text-xs font-black">{fl.label}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${directoryActiveFloor === fl.floor ? "text-emerald-100 font-semibold" : "text-zinc-500"}`}>
                        {fl.note}
                      </div>
                    </button>
                  ))}
                </div>

                {/* List of rooms on the selected floor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-1">
                    <span>
                      Rooms on {directoryActiveFloor === 0 ? "Ground Floor" : `Floor ${directoryActiveFloor}`} ({directoryFloorRooms.length} rooms)
                    </span>
                    <span>Click &ldquo;Navigate Here&rdquo; to set as destination</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {directoryFloorRooms.map((room) => {
                      const isSelected = selectedDestLocation?._id === room._id;
                      return (
                        <div
                          key={room._id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300 shadow-sm"
                              : "bg-zinc-50/60 border-zinc-200 hover:border-emerald-300 hover:bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {room.roomNumber && (
                                  <span className="text-xs font-black bg-zinc-900 text-white px-2 py-0.5 rounded-md">
                                    {room.roomNumber}
                                  </span>
                                )}
                                <h6 className="text-xs font-extrabold text-zinc-900">{room.name}</h6>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(room.category)}`}>
                                {room.category}
                              </span>
                            </div>

                            {room.wing && (
                              <div className="text-[11px] font-semibold text-emerald-800">
                                📍 {room.wing}
                              </div>
                            )}
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                              {room.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-zinc-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400">Floor {room.floor}</span>

                            <button
                              type="button"
                              onClick={() => handleNavigateFromDirectory(room)}
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <span>🧭</span>
                              <span>Navigate Here</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedBuilding === "Campus Grounds" && (
              <div className="pt-4 border-t border-zinc-100 space-y-3 animate-fadeIn">
                <p className="text-xs text-zinc-500">Outdoor campus landmarks along the central avenue:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {locations
                    .filter((l) => l.building === "Campus Grounds")
                    .map((item) => (
                      <div key={item._id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-extrabold text-zinc-900">{item.name}</span>
                          <p className="text-[11px] text-zinc-500 mt-1">{item.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavigateFromDirectory(item)}
                          className="mt-3 py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all text-center cursor-pointer"
                        >
                          Navigate Here ➔
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
