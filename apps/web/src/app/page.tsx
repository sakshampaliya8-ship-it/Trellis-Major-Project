"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { BACKEND_URL } from "@/config/api";

export default function Home() {
  const router = useRouter();

  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [registerRole, setRegisterRole] = useState<"student" | "faculty" | "management">("student");
  const [fullName, setFullName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [post, setPost] = useState("");
  const [year, setYear] = useState("1");
  const [semester, setSemester] = useState("1");
  const [yoa, setYoa] = useState("2023");
  const [yop, setYop] = useState("2027");
  const [facultyDept, setFacultyDept] = useState("Internet of Things (IoT)");
  const [employeeId, setEmployeeId] = useState("");
  const [mgmtDept, setMgmtDept] = useState("Campus Facilities & Operations");
  const [mgmtPhone, setMgmtPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("Central Admin Office");

  const [studentBranch, setStudentBranch] = useState("");
  const [studentYear, setStudentYear] = useState(1);
  const [studentSemester, setStudentSemester] = useState(1);
  const [facultyDepartment, setFacultyDepartment] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStudentBranch(localStorage.getItem("trellis_student_branch") || "");
      setStudentYear(parseInt(localStorage.getItem("trellis_student_year") || "1"));
      setStudentSemester(parseInt(localStorage.getItem("trellis_student_semester") || "1"));
      setFacultyDepartment(localStorage.getItem("trellis_faculty_dept") || "");
    }
  }, [token]);

  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [lostFoundSummary, setLostFoundSummary] = useState<{
    notFoundCount: number;
    foundUnclaimedCount: number;
    claimedCount: number;
    hasUrgentFoundAlert: boolean;
  } | null>(null);

  const carouselSlides = [
    {
      title: "Smart Campus OS Pathfinder",
      desc: "Instant floor plans, indoor location searches, and Dijkstra shortest path routing.",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600"
    },
    {
      title: "Placement Drives & Matching",
      desc: "Rule-based automated matchmaking, student CV qualification logs, and drive reports.",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600"
    },
    {
      title: "Student of the Year Scoring",
      desc: "Earn points for verified co-curricular achievements and track the live student leaderboard.",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600"
    }
  ];

  const features = [
    { title: "📍 Smart Finder (M1)", desc: "Navigate your way with live floor plans, cabin directories, and path routing.", icon: "🗺️" },
    { title: "💼 Placement Board (M3)", desc: "Match eligibility criteria automatically and register for placement drives.", icon: "📈" },
    { title: "👥 Student Career Hub (M4)", desc: "Publish social updates, endorse skills, and compile your academic resume PDF.", icon: "🎓" },
    { title: "🔬 IoT Sensor Rentals (M7)", desc: "Check out hardware sensors, manage return deadlines, and calculate fines.", icon: "🔌" },
    { title: "🔧 Support complaints (M5)", desc: "Report campus maintenance issues (WiFi, washrooms, electrical) and track status.", icon: "🛠️" },
    { title: "🚨 SOS Emergency (M6)", desc: "Quick dispatch alarm to notify campus guards of your location instantly.", icon: "🚨" }
  ];

  const sampleEvents = [
    { _id: "e1", title: "Smart India Hackathon 2026", description: "Internal hackathon rounds to select the team representing the institute.", venue: "Block A Auditorium", date: "2026-09-10" },
    { _id: "e2", title: "Capgemini Placement Talk", description: "Pre-placement presentation and eligibility criteria explanation seminar.", venue: "Main Seminar Hall", date: "2026-08-28" },
    { _id: "e3", title: "IoT Device Workshop", description: "Hands-on session using microcontrollers and sensor renting workflows.", venue: "IoT Lab Block C", date: "2026-09-02" }
  ];

  const desktopApps = [
    { name: "Campus Finder", path: "/finder", desc: "Interactive maps, buildings, rooms, facilities and indoor navigation to help you find anything across the campus.", bg: "bg-emerald-600", icon: "📍", illus: "/images/illus_finder.jpg", badge: "SMART CAMPUS SOLUTION" },
    { name: userRole === "student" ? "Notices and Events" : "Notices and Event Management", path: "/events", desc: "Explore upcoming events, publish notices, register for workshops, seminars, and manage campus activities.", bg: "bg-teal-600", icon: "📢", illus: "/images/illus_events.jpg" },
    { name: "Career Profile", path: "/career", desc: "Build your professional identity by showcasing your skills, projects, certifications and achievements.", bg: "bg-emerald-700", icon: "👥", illus: "/images/illus_career.jpg" },
    { name: "Sensor IoT", path: "/sensors", desc: "Real-time monitoring of campus environment sensors like temperature, humidity, air quality and get instant alerts for any anomalies.", bg: "bg-emerald-800", icon: "🔬", illus: "/images/illus_sensors.jpg" },
    { name: "Placement", path: "/placements", desc: "Register for placements, upload documents and get automatically matched with eligible job opportunities posted by companies.", bg: "bg-teal-700", icon: "💼", illus: "/images/illus_placement.jpg" },
    { name: "Service Complaint", path: "/complaints", desc: "Raise complaints regarding any campus service issues and track their status until resolution.", bg: "bg-emerald-700", icon: "🔧", illus: "/images/illus_complaints.jpg" },
    { name: "Lost & Found", path: "/lostfound", desc: "Report lost items or browse found items across the campus. Get notified when your lost item is found.", bg: "bg-emerald-600", icon: "📦", illus: "/images/illus_lostfound.jpg" },
    { name: "Security", path: "/sos", desc: "Stay safe with real-time security alerts and emergency notifications to ensure a secure campus environment.", bg: "bg-rose-600", icon: "🚨", illus: "/images/illus_security.jpg" }
  ];

  // Sync token from localStorage on load
  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
      
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
        .catch((err) => console.error("Mount profile sync failed:", err));

      fetch(`${BACKEND_URL}/api/lostfound/summary`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.summary) {
            setLostFoundSummary(data.summary);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Automatic slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginView) {
      handleLogin(e);
    } else {
      handleRegister(e, registerRole);
    }
  };

  const syncUserProfile = async (tk: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      const data = await response.json();
      if (data.success) {
        if (data.user.role === "student" && data.profile) {
          localStorage.setItem("trellis_student_branch", data.profile.branch || "");
          localStorage.setItem("trellis_student_year", (data.profile.year || 1).toString());
          localStorage.setItem("trellis_student_semester", (data.profile.semester || 1).toString());
          localStorage.removeItem("trellis_faculty_dept");
        } else if (data.user.role === "faculty" && data.profile) {
          localStorage.setItem("trellis_faculty_dept", data.profile.department || "");
          localStorage.removeItem("trellis_student_branch");
          localStorage.removeItem("trellis_student_year");
          localStorage.removeItem("trellis_student_semester");
        } else {
          localStorage.removeItem("trellis_student_branch");
          localStorage.removeItem("trellis_student_year");
          localStorage.removeItem("trellis_student_semester");
          localStorage.removeItem("trellis_faculty_dept");
        }
      }
    } catch (err) {
      console.error("Failed to sync user profile:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setToken(data.token);
        setUserRole(data.user.role);
        setUserEmail(data.user.email);
        localStorage.setItem("trellis_token", data.token);
        localStorage.setItem("trellis_role", data.user.role);
        localStorage.setItem("trellis_email", data.user.email);
        await syncUserProfile(data.token);
        setAuthMessage("Logged in successfully!");
        setIsAuthModalOpen(false);
        if (data.user.role === "placement_head") {
          router.push("/placements");
        }
      } else {
        setAuthError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setAuthError(`Could not connect to backend server.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent, selectedRole: string) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setLoading(true);

    let finalRole = selectedRole;
    if (facultyDept.includes("Placement") || post.toLowerCase().includes("placement") || selectedRole === "placement_head") {
      finalRole = "placement_head";
    }

    const payload: any = {
      email,
      password,
      role: finalRole,
      name: fullName
    };

    if (selectedRole === "student") {
      payload.enrollmentNumber = enrollmentNumber;
      payload.branch = branch;
      payload.year = year;
      payload.semester = semester;
      payload.yoa = parseInt(yoa) || undefined;
      payload.yop = parseInt(yop) || undefined;
      payload.admissionYear = parseInt(yoa) || undefined;
      payload.graduationYear = parseInt(yop) || undefined;
    } else if (selectedRole === "management") {
      payload.employeeId = employeeId;
      payload.department = mgmtDept;
      payload.phone = mgmtPhone;
      payload.officeLocation = officeLocation;
    } else {
      payload.collegeId = collegeId || (finalRole === "placement_head" ? `TPO-${Date.now().toString().slice(-4)}` : "");
      payload.post = post || (finalRole === "placement_head" ? "Placement Head" : "Professor");
      payload.department = facultyDept;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setToken(data.token);
        setUserRole(data.user.role);
        setUserEmail(data.user.email);
        localStorage.setItem("trellis_token", data.token);
        localStorage.setItem("trellis_role", data.user.role);
        localStorage.setItem("trellis_email", data.user.email);
        await syncUserProfile(data.token);
        setAuthMessage("Registered successfully!");
        setIsAuthModalOpen(false);
        if (data.user.role === "placement_head") {
          router.push("/placements");
        }
      } else {
        setAuthError(data.message || "Something went wrong");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureCardClick = (app: any, e: React.MouseEvent) => {
    if (userRole === "placement_head" && app.path !== "/placements") {
      e.preventDefault();
      alert("Access Restricted: As Placement Head, your account has dedicated access exclusively to the Placement Board.");
      router.push("/placements");
      return;
    }
    if (userRole === "management") {
      if (app.path !== "/lostfound" && app.path !== "/complaints") {
        e.preventDefault();
        alert("Management accounts are dedicated to Lost & Found operations and Facility Complaints desks.");
        return;
      }
      router.push(app.path);
      return;
    }
    const isPublic = app.path === "/finder";
    if (isPublic) {
      router.push(app.path);
    } else {
      if (token) {
        router.push(app.path);
      } else {
        e.preventDefault();
        setIsAuthRequiredModalOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans text-zinc-900 bg-[#F4FBF7]">
      {!token ? (
        /* Marketing Landing Page */
        <>
          <div className="fixed-bg-container">
            <img src="/images/ips-bg.png" className="fixed-bg-image opacity-70" alt="Campus Backdrop" />
            <div className="fixed-bg-overlay opacity-60"></div>
          </div>
          
          <div className="relative w-full flex flex-col min-h-screen">
            
            {/* Top Navbar */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-zinc-150 px-6 py-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌱</span>
                <span className="text-lg font-black text-emerald-800 tracking-tight leading-none">Trellis</span>
              </div>
              
              <div className="hidden md:flex gap-8 text-xs font-bold text-zinc-700">
                <a href="#hero" className="hover:text-emerald-800 transition-colors border-b-2 border-emerald-600 pb-1">Home</a>
                <a href="#features" className="hover:text-emerald-800 transition-colors pb-1">Features</a>
              </div>

              <button
                onClick={() => {
                  setIsLoginView(true);
                  setIsAuthModalOpen(true);
                }}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-2"
              >
                <span>👤</span> Login / Signup
              </button>
            </nav>

            {/* Main scrolling wrapper */}
            <div className="pt-24 space-y-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
              
              {/* Hero Section */}
              <section id="hero" className="min-h-[calc(100vh-140px)] flex items-center justify-center">
                <div className="w-full bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-emerald-100/30 shadow-2xl p-8 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Hero Left */}
                  <div className="lg:col-span-7 flex flex-col space-y-6">
                    <div>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-emerald-150 shadow-sm">
                        Smart Campus Solution
                      </span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 tracking-tight leading-[1.1]">
                      Everything your <span className="text-emerald-600 underline decoration-wavy decoration-emerald-300 decoration-3 underline-offset-8">campus</span> needs, in one OS
                    </h2>
                    <p className="text-zinc-600 text-base leading-relaxed max-w-xl">
                      Discover interactive layouts, automate placement checkouts, request lab IoT sensors, report support complaints, and trigger emergency alarms seamlessly from one unified workspace.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      <button
                        onClick={() => {
                          setIsLoginView(true);
                          setIsAuthModalOpen(true);
                        }}
                        className="py-3 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30"
                      >
                        Access Workspace
                      </button>
                      <a
                        href="#features"
                        className="py-3 px-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-all shadow"
                      >
                        Explore Features
                      </a>
                    </div>
                  </div>

                  {/* Hero Right Slideshow */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="relative aspect-[4/3] w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white shadow-zinc-950/20">
                      <div className="absolute inset-0">
                        <img
                          src={carouselSlides[currentSlide].image}
                          className="w-full h-full object-cover opacity-90"
                          alt="Carousel Slide"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                      </div>
                      
                      <div className="absolute bottom-6 left-6 right-6 text-white z-20 space-y-1">
                        <h4 className="font-extrabold text-sm">{carouselSlides[currentSlide].title}</h4>
                        <p className="text-[10px] text-zinc-200">{carouselSlides[currentSlide].desc}</p>
                      </div>

                      <div className="absolute bottom-5 left-0 w-full flex justify-center space-x-2 z-20">
                        {carouselSlides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all border border-white/50 ${
                              idx === currentSlide ? "bg-emerald-500 scale-125" : "bg-white/60 hover:bg-white"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* Features Module Section */}
              <section id="features" className="scroll-mt-24">
                <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-8 md:p-12 lg:p-16 border border-emerald-100/20 shadow-xl">
                  <div className="max-w-3xl mb-12">
                    <span className="text-emerald-600 font-bold uppercase tracking-wider text-sm">Modules Overview</span>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-zinc-950 mt-2 mb-4">Integrated Campus Ecosystem</h3>
                    <p className="text-zinc-600 leading-relaxed">
                      Trellis Campus OS unifies fragmented college databases into a dynamic client interface. Each app represents a complete workspace sync'd directly with the MongoDB backend.
                    </p>
                  </div>

                  <div className="flex flex-col space-y-6 w-full max-w-5xl mx-auto">
                    {desktopApps.map((app) => {
                      const isCareerApp = app.path === "/career";
                      const isFaculty = userRole === "faculty" || userRole === "admin";
                      const displayName = isCareerApp && (isFaculty || userRole !== "student") ? "Student Records and Verifications" : app.name;
                      const displayDesc = isCareerApp && (isFaculty || userRole !== "student")
                        ? "Verify student achievements, search student profiles by roll number or email, and discover campus talent."
                        : app.desc;
                      const displayIcon = isCareerApp && (isFaculty || userRole !== "student") ? "🎓" : app.icon;

                      return (
                        <button
                          key={app.name}
                          onClick={(e) => handleFeatureCardClick(app, e)}
                          className="w-full bg-white border border-zinc-200/80 rounded-[1.8rem] hover:border-emerald-300 hover:shadow-lg transition-all p-6 md:p-8 flex flex-col md:flex-row items-center justify-between text-left group gap-6 shadow-sm"
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-grow">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-center text-3xl shrink-0 shadow-sm">
                              {displayIcon}
                            </div>
                            <div className="space-y-1 flex-1">
                              {app.badge && (
                                <div className="mb-2">
                                  <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-emerald-100/50 shadow-sm">
                                    {app.badge}
                                  </span>
                                </div>
                              )}
                              <h4 className="text-xl font-extrabold text-zinc-950 group-hover:text-emerald-850 group-hover:underline decoration-emerald-500 transition-colors">
                                {displayName}
                              </h4>
                              <p className="text-xs text-zinc-500 leading-relaxed max-w-lg pt-1">
                                {displayDesc}
                              </p>
                              {app.path === "/lostfound" && lostFoundSummary && (
                                <div className="flex flex-wrap items-center gap-2 pt-2.5">
                                  {lostFoundSummary.hasUrgentFoundAlert && (
                                    <span className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-amber-400 text-amber-950 animate-pulse shadow-xs flex items-center gap-1">
                                      <span>🎉</span>
                                      <span>Your Item Found! Ready for Pickup</span>
                                    </span>
                                  )}
                                  <span
                                    title="Items reported lost that have not been found yet"
                                    className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1 shadow-xs"
                                  >
                                    <span>🔴</span>
                                    <span>{lostFoundSummary.notFoundCount} Still Missing</span>
                                  </span>
                                  <span
                                    title="Items found and ready at office, awaiting claim"
                                    className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 shadow-xs"
                                  >
                                    <span>🟡</span>
                                    <span>{lostFoundSummary.foundUnclaimedCount} Found (Awaiting Claim)</span>
                                  </span>
                                  <span
                                    title="Items claimed and successfully returned to owner"
                                    className="px-2.5 py-1 text-[9px] font-black rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1 shadow-xs"
                                  >
                                    <span>🟢</span>
                                    <span>{lostFoundSummary.claimedCount} Claimed</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6 shrink-0 self-end md:self-center">
                            {app.illus && (
                              <img src={app.illus} className="h-20 md:h-24 lg:h-28 object-contain select-none pointer-events-none hidden sm:block" alt="" />
                            )}
                            <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shrink-0">
                              <span className="text-sm font-bold">&rarr;</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Dark Footer */}
              <footer className="bg-zinc-950 text-zinc-400 py-12 rounded-[2rem] px-8 md:px-12 mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-zinc-800 text-xs">
                  <div>
                    <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Features</h4>
                    <ul className="space-y-2">
                      <li><Link href="/finder" className="hover:text-emerald-500">Campus Maps Finder</Link></li>
                      <li><Link href="/placements" className="hover:text-emerald-500">Placement Drive Portal</Link></li>
                      <li><Link href="/career" className="hover:text-emerald-500">Student Profile Hub</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Utilities</h4>
                    <ul className="space-y-2">
                      <li><Link href="/sensors" className="hover:text-emerald-500">IoT Sensor Rental Catalog</Link></li>
                      <li><Link href="/complaints" className="hover:text-emerald-500">Classroom Support Tickets</Link></li>
                      <li><Link href="/lostfound" className="hover:text-emerald-500">Lost & Found claims</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Emergency</h4>
                    <ul className="space-y-2">
                      <li><Link href="/sos" className="hover:text-emerald-500 text-rose-400 font-bold">🚨 Panic SOS Trigger</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-4 uppercase tracking-wider">Trellis Campus OS</h4>
                    <p className="text-[10px] leading-relaxed text-zinc-500">
                      A modern, unified digital workspace application enabling campus pathfinding, placement workflows, and real-time support tickets resolution.
                    </p>
                  </div>
                </div>
                <p className="text-center text-[10px] text-zinc-500 pt-8">
                  Trellis Smart Campus Operating System © 2026. All rights reserved.
                </p>
              </footer>

            </div>
          </div>
        </>
      ) : (
        /* Dynamic OS Dashboard View wrapped inside DashboardLayout */
        <DashboardLayout>
          <div className="space-y-8 text-zinc-950 font-sans">
            {/* Top Personalized Greeting Bar */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="text-emerald-100 text-xs font-black uppercase tracking-widest bg-emerald-700/40 px-3 py-1 rounded-full">
                  Status: Active
                </span>
                <h3 className="text-2xl md:text-3xl font-black">Hello, {userEmail}! 👋</h3>
                <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                  Welcome to your Trellis Campus Workspace. Use the sidebar to launch and manage individual campus modules.
                </p>
              </div>
              <span className="absolute -right-8 -bottom-8 text-9xl opacity-15">🌱</span>
            </div>

            {/* Quick Launch Grid & SOS Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Quick Launch Cards */}
              <div className="lg:col-span-8 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Campus Activity Shortcuts</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Quick access to individual services</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {desktopApps
                    .filter((app) => {
                      if (userRole === "management") {
                        return app.path === "/lostfound" || app.path === "/complaints";
                      }
                      if (userRole === "student") {
                        if (app.path === "/placements") {
                          const isAllowed = studentYear >= 3 || studentSemester >= 6;
                          if (!isAllowed) return false;
                        }
                      } else if (userRole === "faculty") {
                        if (app.path === "/placements" || app.path === "/complaints") {
                          return false;
                        }
                        if (app.path === "/sensors") {
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
                    .map((app) => {
                      const isCareerApp = app.path === "/career";
                      const isFaculty = userRole === "faculty" || userRole === "admin";
                      const displayName = isCareerApp && (isFaculty || userRole !== "student")
                        ? "Student Records and Verifications"
                        : app.name;
                      const displayDesc = isCareerApp && (isFaculty || userRole !== "student")
                        ? "Verify student achievements, search student profiles by roll number or email, and discover campus talent."
                        : app.desc;
                      const displayIcon = isCareerApp && (isFaculty || userRole !== "student") ? "🎓" : app.icon;

                      return (
                        <button
                          key={app.name}
                          onClick={(e) => handleFeatureCardClick(app, e)}
                          className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/10 transition-all flex items-center gap-4 group text-left w-full"
                        >
                          <div className={`w-10 h-10 rounded-xl ${app.bg} flex items-center justify-center text-lg text-white shadow-sm shrink-0`}>
                            {displayIcon}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-emerald-800 group-hover:underline">
                              {displayName}
                            </h5>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{displayDesc}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Side Panel (SOS for students/faculty, Operations for management) */}
              <div className="lg:col-span-4 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                {userRole === "management" ? (
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 mb-1">Management Desk</h4>
                    <p className="text-xs text-zinc-400">Campus Facilities & Operations</p>
                    
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center space-y-4 my-4">
                      <span className="text-3xl block">🏢</span>
                      <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Facilities Control Desk</h5>
                      <p className="text-[10px] text-emerald-800 leading-relaxed">
                        Manage item handover & pickup schedules, and resolve facility maintenance complaints in real time.
                      </p>
                      <div className="space-y-2">
                        <Link
                          href="/lostfound"
                          className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
                        >
                          📦 Lost & Found Desk
                        </Link>
                        <Link
                          href="/complaints"
                          className="block w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
                        >
                          🔧 Complaints Desk
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 mb-1">Security Dispatch</h4>
                    <p className="text-xs text-zinc-400">Emergency panic trigger tools</p>
                    
                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center space-y-4 my-4">
                      <span className="text-3xl block animate-bounce">🚨</span>
                      <h5 className="text-xs font-black text-rose-800 uppercase tracking-wider">Quick SOS Alarm</h5>
                      <p className="text-[10px] text-rose-700 leading-relaxed">
                        Triggering this alarm page will transmit your location coordinates to campus safety guards instantly.
                      </p>
                      <Link
                        href="/sos"
                        className="block w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
                      >
                        Go to Alarm Panel
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardLayout>
      )}

      {/* Auth Modal popup */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl max-w-md w-full border border-emerald-100 shadow-2xl p-8 relative animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 text-lg"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black text-emerald-800 text-center mb-6">
              {isLoginView ? "Sign In to Campus OS" : "Register Workspace"}
            </h3>

            {authError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-bold">
                {authError}
              </div>
            )}
            {authMessage && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold">
                {authMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginView && (
                <div className="flex bg-zinc-100 rounded-xl p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setRegisterRole("student")}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition ${
                      registerRole === "student" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole("faculty")}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition ${
                      registerRole === "faculty" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole("management")}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition ${
                      registerRole === "management" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Management
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Campus Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  placeholder="user@ips.edu"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {!isLoginView && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  {registerRole === "student" ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Enrollment Number</label>
                        <input
                          type="text"
                          required
                          value={enrollmentNumber}
                          onChange={(e) => setEnrollmentNumber(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                          placeholder="0108CS211000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Branch</label>
                        <input
                          type="text"
                          required
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                          placeholder="Computer Science"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Year</label>
                          <select
                            required
                            value={year}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYear(val);
                              const currentYear = new Date().getFullYear();
                              const numericYear = parseInt(val) || 1;
                              const calculatedYoa = currentYear - (numericYear - 1);
                              setYoa(calculatedYoa.toString());
                              setYop((calculatedYoa + 4).toString());
                            }}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none text-zinc-800"
                          >
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Semester</label>
                          <select
                            required
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none text-zinc-800"
                          >
                            <option value="1">1st Sem</option>
                            <option value="2">2nd Sem</option>
                            <option value="3">3rd Sem</option>
                            <option value="4">4th Sem</option>
                            <option value="5">5th Sem</option>
                            <option value="6">6th Sem</option>
                            <option value="7">7th Sem</option>
                            <option value="8">8th Sem</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">YOA (Admission)</label>
                          <input
                            type="number"
                            required
                            value={yoa}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYoa(val);
                              if (val.length === 4) {
                                const num = parseInt(val);
                                if (!isNaN(num)) {
                                  setYop((num + 4).toString());
                                }
                              }
                            }}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                            placeholder="e.g. 2022"
                            min="2000"
                            max="2099"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">YOP (Passing)</label>
                          <input
                            type="number"
                            required
                            value={yop}
                            onChange={(e) => setYop(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                            placeholder="e.g. 2026"
                            min="2000"
                            max="2099"
                          />
                        </div>
                      </div>
                    </>
                  ) : registerRole === "faculty" ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">College ID</label>
                        <input
                          type="text"
                          required
                          value={collegeId}
                          onChange={(e) => setCollegeId(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                          placeholder="FAC1001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Post</label>
                        <input
                          type="text"
                          required
                          value={post}
                          onChange={(e) => setPost(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                          placeholder="Assistant Professor"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Department</label>
                        <select
                          required
                          value={facultyDept}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFacultyDept(val);
                            if (val.includes("Placement")) {
                              if (!post || post === "Assistant Professor") {
                                setPost("Placement Head");
                              }
                            }
                          }}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                        >
                          <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                          <option value="Training & Placement Cell (Placement Head)">Training & Placement Cell (Placement Head)</option>
                          <option value="Electronics & Communication (ECE)">Electronics & Communication (ECE)</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Computer Science & Engineering (CSE)">Computer Science & Engineering (CSE)</option>
                          <option value="Computer Science & Information Technology">Computer Science & Information Technology</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Staff / Employee ID</label>
                        <input
                          type="text"
                          required
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                          placeholder="MGMT2001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Department / Operations Office</label>
                        <input
                          type="text"
                          required
                          value={mgmtDept}
                          onChange={(e) => setMgmtDept(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                          placeholder="Campus Facilities & Maintenance"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={mgmtPhone}
                            onChange={(e) => setMgmtPhone(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                            placeholder="+91-9876543210"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Office Location</label>
                          <input
                            type="text"
                            value={officeLocation}
                            onChange={(e) => setOfficeLocation(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none"
                            placeholder="Admin Block Room 102"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
              >
                {isLoginView
                  ? "Authorize Workspace"
                  : registerRole === "student"
                  ? "Register Student Account"
                  : registerRole === "faculty"
                  ? "Register Faculty Account"
                  : "Register Management Account"}
              </button>
            </form>

            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="mt-6 w-full text-xs text-zinc-500 hover:text-zinc-800 underline text-center"
            >
              {isLoginView ? "Need an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      )}

      {/* Gated Feature Login Prompt Modal */}
      {isAuthRequiredModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-emerald-100 shadow-2xl p-6 relative text-center space-y-4">
            <span className="text-4xl block">🔒</span>
            <h3 className="text-base font-extrabold text-zinc-950">Access Restricted</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Please login first to access this feature.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsAuthRequiredModalOpen(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsAuthRequiredModalOpen(false);
                  setIsLoginView(true);
                  setIsAuthModalOpen(true);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
