"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [studentBranch, setStudentBranch] = useState("");
  const [studentYear, setStudentYear] = useState(1);
  const [studentSemester, setStudentSemester] = useState(1);
  const [facultyDepartment, setFacultyDepartment] = useState("");

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [lostFoundCounts, setLostFoundCounts] = useState<{
    notFoundCount: number;
    foundUnclaimedCount: number;
    claimedCount: number;
    myLostFoundReady: number;
    hasUrgentFoundAlert: boolean;
  }>({
    notFoundCount: 0,
    foundUnclaimedCount: 0,
    claimedCount: 0,
    myLostFoundReady: 0,
    hasUrgentFoundAlert: false
  });

  useEffect(() => {
    setMounted(true);
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");

    if (!savedToken) {
      if (pathname !== "/finder") {
        router.push("/");
      }
    } else {
      if (savedRole === "management" && pathname !== "/" && pathname !== "/lostfound" && pathname !== "/complaints") {
        router.push("/lostfound");
        return;
      }
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
      
      const initialBranch = localStorage.getItem("trellis_student_branch") || "";
      const initialYear = parseInt(localStorage.getItem("trellis_student_year") || "1");
      const initialSemester = parseInt(localStorage.getItem("trellis_student_semester") || "1");
      const initialDept = localStorage.getItem("trellis_faculty_dept") || "";
      
      setStudentBranch(initialBranch);
      setStudentYear(initialYear);
      setStudentSemester(initialSemester);
      setFacultyDepartment(initialDept);

      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.user.role === "student" && data.profile) {
              localStorage.setItem("trellis_student_branch", data.profile.branch || "");
              localStorage.setItem("trellis_student_year", (data.profile.year || 1).toString());
              localStorage.setItem("trellis_student_semester", (data.profile.semester || 1).toString());
              
              setStudentBranch(data.profile.branch || "");
              setStudentYear(data.profile.year || 1);
              setStudentSemester(data.profile.semester || 1);
            } else if (data.user.role === "faculty" && data.profile) {
              localStorage.setItem("trellis_faculty_dept", data.profile.department || "");
              setFacultyDepartment(data.profile.department || "");
            }
          }
        })
        .catch((err) => {
          // Gracefully handle server offline or network blip
          console.warn("Notice: Backend not reachable yet for profile sync:", err?.message || err);
        });

      // Fetch unread notifications
      fetch(`${BACKEND_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setUnreadNotifCount(data.count || 0);
        })
        .catch(() => {});

      // Fetch Lost & Found notification status counts (Student & Faculty)
      fetch(`${BACKEND_URL}/api/lostfound/summary`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.summary) {
            setLostFoundCounts({
              notFoundCount: data.summary.notFoundCount || 0,
              foundUnclaimedCount: data.summary.foundUnclaimedCount || 0,
              claimedCount: data.summary.claimedCount || 0,
              myLostFoundReady: data.summary.myLostFoundReady || 0,
              hasUrgentFoundAlert: Boolean(data.summary.hasUrgentFoundAlert)
            });
          }
        })
        .catch(() => {});
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("trellis_token");
    localStorage.removeItem("trellis_role");
    localStorage.removeItem("trellis_email");
    localStorage.removeItem("trellis_student_branch");
    localStorage.removeItem("trellis_student_year");
    localStorage.removeItem("trellis_student_semester");
    router.push("/");
  };

  if (!mounted || (!token && pathname !== "/finder")) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const careerMenuTitle = userRole === "faculty" || userRole === "admin"
    ? "🎓 Student Records & Verifications"
    : "👥 Career Hub";

  const eventsMenuTitle = userRole === "student"
    ? "📢 Notices and Events"
    : "📢 Notices and Event Management";

  const menuItems = [
    { name: "🏠 OS Desktop", path: "/#desktop" },
    { name: "📍 Campus Finder", path: "/finder" },
    { name: "💼 Placements Board", path: "/placements" },
    { name: careerMenuTitle, path: "/career" },
    { name: "🔬 Sensor Renting", path: "/sensors" },
    { name: eventsMenuTitle, path: "/events" },
    { name: "🔧 Service Complaints", path: "/complaints" },
    { name: "📦 Lost & Found", path: "/lostfound" },
    { name: "🚨 SOS Security", path: "/sos" },
  ];

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col md:flex-row font-sans text-zinc-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-emerald-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-emerald-100 flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <span className="text-lg font-black text-emerald-800 tracking-tight">Trellis</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems
            .filter((item) => {
              if (userRole === "placement_head") {
                return item.path === "/placements";
              }
              if (userRole === "management") {
                return item.path === "/#desktop" || item.path === "/complaints" || item.path === "/lostfound";
              }
              if (userRole === "student") {
                if (item.path === "/placements") {
                  const isAllowed = studentYear >= 3 || studentSemester >= 6;
                  if (!isAllowed) return false;
                }
              } else if (userRole === "faculty") {
                if (item.path === "/complaints") {
                  return false;
                }
                if (item.path === "/sensors") {
                  const deptLower = (facultyDepartment || "").toLowerCase();
                  const isDeptAllowed =
                    deptLower.includes("iot") ||
                    deptLower.includes("electronics") ||
                    deptLower.includes("electrical") ||
                    deptLower.includes("ece") ||
                    deptLower.includes("eee");
                  if (!isDeptAllowed) return false;
                }
              }
              return true;
            })
            .map((item) => {
              const isGated = item.path !== "/#desktop" && item.path !== "/finder";
              const isActive = pathname === item.path || (item.path === "/#desktop" && pathname === "/");
              const hasBadge = item.path === "/placements" && unreadNotifCount > 0;
            return (
              <Link
                key={item.name}
                href={isGated && !token ? "/" : item.path}
                onClick={(e: React.MouseEvent) => {
                  if (isGated && !token) {
                    e.preventDefault();
                    alert("Please login first to access this feature");
                    router.push("/");
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600"
                    : "text-zinc-600 hover:bg-emerald-50/50 hover:text-emerald-800"
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2">
                    <span>{item.name}</span>
                    {hasBadge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-600 text-white rounded-full">
                        {unreadNotifCount}
                      </span>
                    )}
                  </div>

                  {/* Lost & Found Notification Indicators (Student & Faculty) */}
                  {item.path === "/lostfound" && (
                    <div className="flex items-center gap-1 shrink-0">
                      {lostFoundCounts.hasUrgentFoundAlert && (
                        <span
                          title="Your reported lost item has been FOUND! Ready for pickup at management."
                          className="px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-amber-950 rounded-md animate-pulse shadow-sm"
                        >
                          🎉 Found!
                        </span>
                      )}
                      {lostFoundCounts.notFoundCount > 0 && (
                        <span
                          title={`${lostFoundCounts.notFoundCount} items still lost (not found yet)`}
                          className="px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-md shadow-xs"
                        >
                          🔴 {lostFoundCounts.notFoundCount}
                        </span>
                      )}
                      {lostFoundCounts.foundUnclaimedCount > 0 && (
                        <span
                          title={`${lostFoundCounts.foundUnclaimedCount} items found awaiting claim/pickup`}
                          className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-md shadow-xs"
                        >
                          🟡 {lostFoundCounts.foundUnclaimedCount}
                        </span>
                      )}
                      {lostFoundCounts.claimedCount > 0 && (
                        <span
                          title={`${lostFoundCounts.claimedCount} items successfully claimed`}
                          className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-600 text-white rounded-md shadow-xs"
                        >
                          🟢 {lostFoundCounts.claimedCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isGated && !token && <span className="text-xs">🔒</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-emerald-100 bg-emerald-50/20">
          {token ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 uppercase">
                  {userEmail ? userEmail[0] : "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-emerald-800 truncate">{userEmail}</p>
                  <p className="text-[9px] uppercase font-bold text-emerald-600">
                    {userRole === "placement_head" ? "Placement Head" : userRole}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-100"
              >
                Log Out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all text-center"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          {userRole === "placement_head" && pathname !== "/placements" ? (
            <div className="bg-white border border-rose-100 rounded-3xl p-8 text-center max-w-lg mx-auto mt-12 shadow-sm space-y-4">
              <span className="text-4xl">💼</span>
              <h2 className="text-lg font-black text-rose-800">Access Restricted</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                As Placement Head, your account has dedicated access exclusively to the Placement Board. Other campus modules are restricted.
              </p>
              <button
                onClick={() => router.push("/placements")}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Go to Placement Board ➔
              </button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
