"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { BACKEND_URL } from "@/config/api";

interface SensorItem {
  _id: string;
  name: string;
  type: string;
  department: string;
  totalQuantity: number;
  availableQuantity: number;
  conditionSummary: string;
  unitConditionLog?: { condition: string; notes?: string; updatedAt: string }[];
}

interface SensorRequestItem {
  _id: string;
  studentId?: { _id: string; email: string };
  studentName: string;
  studentEmail: string;
  enrollmentNo: string;
  branch: string;
  phone: string;
  duration: string;
  purpose: string;
  projectName?: string;
  sensorId: SensorItem;
  sensorName?: string;
  requestedFrom: string;
  requestedTo?: string;
  status: "pending" | "approved" | "rejected" | "issued" | "returned" | "overdue" | "lost";
  approvedBy?: { _id: string; email: string };
  approverName?: string;
  approvalNote?: string;
  approvedAt?: string;
  issuedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  returnCondition?: "ok" | "damaged";
  createdAt: string;
}

export default function SensorsPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [studentBranch, setStudentBranch] = useState("");
  const [facultyDept, setFacultyDept] = useState("");
  const [userName, setUserName] = useState("");
  const [userEnrollment, setUserEnrollment] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Active Tab
  const [sensorTab, setSensorTab] = useState<"catalog" | "my-requests" | "approvals">("catalog");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Data States
  const [sensorsList, setSensorsList] = useState<SensorItem[]>([]);
  const [myRequests, setMyRequests] = useState<SensorRequestItem[]>([]);
  const [allRequests, setAllRequests] = useState<SensorRequestItem[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved" | "returned" | "rejected">("pending");

  // Student Apply Modal State
  const [applyingSensor, setApplyingSensor] = useState<SensorItem | null>(null);
  const [formStudentName, setFormStudentName] = useState("");
  const [formEnrollmentNo, setFormEnrollmentNo] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDuration, setFormDuration] = useState("7 Days");
  const [formPurpose, setFormPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Faculty View Issued Students Modal State
  const [viewingIssuedSensor, setViewingIssuedSensor] = useState<SensorItem | null>(null);
  const [issuedStudentsList, setIssuedStudentsList] = useState<SensorRequestItem[]>([]);
  const [loadingIssuedStudents, setLoadingIssuedStudents] = useState(false);

  // Faculty Add Sensor Modal
  const [isAddSensorOpen, setIsAddSensorOpen] = useState(false);
  const [newSensorName, setNewSensorName] = useState("");
  const [newSensorType, setNewSensorType] = useState("");
  const [newSensorDept, setNewSensorDept] = useState("Internet of Things (IoT)");
  const [newSensorQty, setNewSensorQty] = useState(10);

  // Action status message
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showAlert = (text: string, type: "success" | "error" | "info" = "success") => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlertMessage({ text, type });
    alertTimerRef.current = setTimeout(() => setAlertMessage(null), 4000);
  };

  // 1. Load Initial Local Storage & Profile
  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");
    const savedBranch = localStorage.getItem("trellis_student_branch") || "";
    const savedFacultyDept = localStorage.getItem("trellis_faculty_dept") || "";
    const savedName = localStorage.getItem("trellis_user") || "";

    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
      setStudentBranch(savedBranch);
      setFacultyDept(savedFacultyDept);
      setUserName(savedName);

      // Pre-populate form state
      setFormStudentName(savedName);
      setFormBranch(savedBranch);

      // Fetch dynamic profile via /api/auth/me to get exact enrollmentNo and phone
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            const p = data.profile;
            const fetchedName = p.name || data.user?.name || savedName;
            const fetchedRoll = p.rollNumber || p.collegeId || "";
            const fetchedBranch = p.branch || p.department || savedBranch;
            const fetchedContact = p.contact || "";

            setUserName(fetchedName);
            setUserEnrollment(fetchedRoll);
            setStudentBranch(fetchedBranch);
            setUserPhone(fetchedContact);

            setFormStudentName(fetchedName);
            setFormEnrollmentNo(fetchedRoll);
            setFormBranch(fetchedBranch);
            setFormPhone(fetchedContact);
          }
        })
        .catch((err) => console.error("Could not fetch user profile:", err));
    }
  }, []);

  // 2. Data Fetcher (Silent or with Spinner)
  const fetchModuleData = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);

    try {
      // Catalog
      const resSensors = await fetch(`${BACKEND_URL}/api/sensors-module/sensors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataSensors = await resSensors.json();
      if (dataSensors.success) {
        setSensorsList(dataSensors.sensors || []);
      }

      // Student Requests
      if (userRole === "student" && userEmail) {
        const resReq = await fetch(`${BACKEND_URL}/api/sensors-module/sensor-requests/${userEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataReq = await resReq.json();
        if (dataReq.success) {
          setMyRequests(dataReq.requests || []);
        }
      }

      // Faculty / Admin Requests
      if (userRole === "faculty" || userRole === "admin") {
        const resAll = await fetch(`${BACKEND_URL}/api/sensors-module/sensor-requests/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataAll = await resAll.json();
        if (dataAll.success) {
          setAllRequests(dataAll.requests || []);
        }
      }
    } catch (err) {
      console.error("Error fetching sensor module data:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token, userRole, userEmail]);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchModuleData();
    }
  }, [token, fetchModuleData]);

  // 3. Live Auto-Sync: Polls every 4 seconds in the background so updates reflect across devices without manual refresh
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchModuleData(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [token, fetchModuleData]);

  // Open Apply Modal for a Sensor with pre-filled editable values
  const handleOpenApplyModal = (sensor: SensorItem) => {
    setApplyingSensor(sensor);
    setFormStudentName(userName || formStudentName || "");
    setFormEnrollmentNo(userEnrollment || formEnrollmentNo || "");
    setFormBranch(studentBranch || formBranch || "");
    setFormPhone(userPhone || formPhone || "");
    setFormDuration("7 Days");
    setFormPurpose("");
  };

  // Submit Rental Request Form (Optimistic & Dynamic)
  const handleSubmitRentalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingSensor) return;

    setIsSubmitting(true);
    try {
      const payload = {
        sensorId: applyingSensor._id,
        studentName: formStudentName,
        studentEmail: userEmail,
        enrollmentNo: formEnrollmentNo,
        branch: formBranch,
        phone: formPhone,
        duration: formDuration,
        purpose: formPurpose,
        projectName: "Academic Lab / Project Rental"
      };

      const res = await fetch(`${BACKEND_URL}/api/sensors-module/sensor-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showAlert("Rental request submitted successfully! Pending faculty approval.", "success");

        // Optimistically update local state immediately
        const createdReq: SensorRequestItem = data.request || {
          _id: "temp-" + Date.now(),
          studentName: formStudentName,
          studentEmail: userEmail || "",
          enrollmentNo: formEnrollmentNo,
          branch: formBranch,
          phone: formPhone,
          duration: formDuration,
          purpose: formPurpose,
          sensorId: applyingSensor,
          sensorName: applyingSensor.name,
          requestedFrom: new Date().toISOString(),
          status: "pending",
          createdAt: new Date().toISOString()
        };

        setMyRequests((prev) => [createdReq, ...prev]);
        setAllRequests((prev) => [createdReq, ...prev]);

        setApplyingSensor(null);
        setFormPurpose("");
        setSensorTab("my-requests");

        // Refresh data from server in background
        fetchModuleData(true);
      } else {
        showAlert(data.message || "Failed to submit request.", "error");
      }
    } catch (err) {
      showAlert("Network error submitting sensor request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Faculty Approve / Reject Request (Optimistic & Dynamic)
  const handleDecision = async (requestId: string, decision: "approved" | "rejected") => {
    const note = decision === "rejected" ? prompt("Enter rejection reason / remarks (optional):") || "" : "";

    // Optimistically update requests list and sensor quantity immediately
    setAllRequests((prev) =>
      prev.map((r) => {
        if (r._id === requestId) {
          return {
            ...r,
            status: decision,
            approvalNote: note || r.approvalNote,
            approvedAt: new Date().toISOString()
          };
        }
        return r;
      })
    );

    // If approved, decrement sensor catalog stock immediately in UI
    const targetReq = allRequests.find((r) => r._id === requestId);
    if (targetReq && targetReq.sensorId) {
      const targetSensorId = typeof targetReq.sensorId === "object" ? targetReq.sensorId._id : targetReq.sensorId;
      if (decision === "approved") {
        setSensorsList((prev) =>
          prev.map((s) =>
            s._id === targetSensorId ? { ...s, availableQuantity: Math.max(0, s.availableQuantity - 1) } : s
          )
        );
      }
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/sensors-module/sensor-requests/${requestId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision, approvalNote: note })
      });
      const data = await res.json();
      if (data.success) {
        showAlert(`Request has been ${decision}!`, "success");
        if (data.sensor) {
          setSensorsList((prev) => prev.map((s) => (s._id === data.sensor._id ? data.sensor : s)));
        }
      } else {
        showAlert(data.message || "Action failed.", "error");
        fetchModuleData(true);
      }
    } catch (err) {
      showAlert("Error updating request status.", "error");
      fetchModuleData(true);
    }
  };

  // Faculty Mark as Returned (Optimistic & Dynamic)
  const handleReturnSensor = async (requestId: string) => {
    if (!confirm("Confirm hardware return? Available inventory will be restored.")) {
      return;
    }

    // Optimistically mark as returned and restore inventory
    const targetReq = allRequests.find((r) => r._id === requestId);
    if (targetReq && targetReq.sensorId) {
      const targetSensorId = typeof targetReq.sensorId === "object" ? targetReq.sensorId._id : targetReq.sensorId;
      setSensorsList((prev) =>
        prev.map((s) =>
          s._id === targetSensorId
            ? { ...s, availableQuantity: Math.min(s.totalQuantity, s.availableQuantity + 1) }
            : s
        )
      );
    }

    setAllRequests((prev) =>
      prev.map((r) => (r._id === requestId ? { ...r, status: "returned", returnedAt: new Date().toISOString() } : r))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/api/sensors-module/sensor-requests/${requestId}/return`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ condition: "ok" })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Sensor marked as Returned. Inventory restored!", "success");
        if (data.sensor) {
          setSensorsList((prev) => prev.map((s) => (s._id === data.sensor._id ? data.sensor : s)));
        }
      } else {
        showAlert(data.message || "Failed to mark as returned.", "error");
        fetchModuleData(true);
      }
    } catch (err) {
      showAlert("Error returning sensor.", "error");
      fetchModuleData(true);
    }
  };

  // Faculty View Issued Students for Specific Sensor
  const handleViewIssuedStudents = async (sensor: SensorItem) => {
    setViewingIssuedSensor(sensor);
    setLoadingIssuedStudents(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/sensors-module/sensors/${sensor._id}/issued-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIssuedStudentsList(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching issued students:", err);
    } finally {
      setLoadingIssuedStudents(false);
    }
  };

  // Faculty Add New Sensor Catalog Item (Optimistic & Dynamic)
  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/sensors-module/sensors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSensorName,
          type: newSensorType,
          department: newSensorDept,
          totalQuantity: newSensorQty
        })
      });
      const data = await res.json();
      if (data.success && data.sensor) {
        showAlert("New sensor catalog item added successfully!", "success");
        setSensorsList((prev) => [data.sensor, ...prev]);
        setNewSensorName("");
        setNewSensorType("");
        setIsAddSensorOpen(false);
      } else {
        showAlert(data.message || "Failed to create sensor.", "error");
      }
    } catch (err) {
      showAlert("Error adding sensor.", "error");
    }
  };

  // Access check for faculty
  const deptLower = (facultyDept || "").toLowerCase();
  const isDeptAllowed =
    deptLower.includes("iot") ||
    deptLower.includes("electronics") ||
    deptLower.includes("electrical") ||
    deptLower.includes("ece") ||
    deptLower.includes("eee");

  const isRestricted = userRole === "faculty" && !isDeptAllowed;

  if (isRestricted) {
    return (
      <DashboardLayout>
        <div className="bg-white border border-rose-100 rounded-3xl p-8 text-center max-w-lg mx-auto mt-12 shadow-sm space-y-4">
          <span className="text-4xl">🔬</span>
          <h2 className="text-lg font-black text-rose-800">Access Restricted</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            The IoT Sensor Renting feature is restricted to faculty members from <strong>IoT, ECE, and Electrical</strong> departments.
          </p>
          <button
            onClick={() => router.push("/")}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Return to OS Desktop
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Filtered lists
  const filteredSensors = sensorsList.filter((s) => {
    if (!catalogSearch) return true;
    const q = catalogSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
  });

  const filteredRequests = allRequests.filter((req) => {
    if (approvalFilter === "all") return true;
    if (approvalFilter === "pending") return req.status === "pending";
    if (approvalFilter === "approved") return req.status === "approved" || req.status === "issued";
    if (approvalFilter === "returned") return req.status === "returned";
    if (approvalFilter === "rejected") return req.status === "rejected";
    return true;
  });

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;
  const approvedCount = allRequests.filter((r) => r.status === "approved" || r.status === "issued").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-zinc-950 font-sans pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔬</span>
              <h3 className="text-2xl font-black text-emerald-800 tracking-tight">IoT Sensor Renting & Inventory</h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Browse available hardware kits, apply for rental loans, and manage laboratory checkout approvals
            </p>
          </div>

          {/* Navigation Pills */}
          <div className="flex bg-emerald-50 rounded-xl p-1 shadow-inner border border-emerald-100">
            <button
              onClick={() => setSensorTab("catalog")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                sensorTab === "catalog" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              📦 Sensor Catalog ({sensorsList.length})
            </button>

            {userRole === "student" ? (
              <button
                onClick={() => setSensorTab("my-requests")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  sensorTab === "my-requests" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span>📋 My Requests</span>
                {myRequests.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                    {myRequests.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setSensorTab("approvals")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  sensorTab === "approvals" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span>🛡️ Faculty Approvals</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Toast Alert */}
        {alertMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn ${
              alertMessage.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : alertMessage.type === "error"
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            <span>{alertMessage.text}</span>
            <button onClick={() => setAlertMessage(null)} className="text-zinc-400 hover:text-zinc-700 ml-4 font-black">
              ✕
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: SENSOR CATALOG */}
        {/* ========================================================= */}
        {sensorTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-emerald-100/80 p-5 rounded-2xl shadow-sm">
              <div className="flex-1">
                <h4 className="text-sm font-black text-zinc-900">Available Sensor Hardware Inventory</h4>
                <p className="text-xs text-zinc-500">
                  Select a sensor from the catalog below to submit a rental loan application. All your profile details are pre-filled automatically.
                </p>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="🔍 Search sensors by name or type..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 w-full sm:w-64 focus:outline-none focus:border-emerald-500"
                />

                {(userRole === "faculty" || userRole === "admin") && (
                  <button
                    onClick={() => setIsAddSensorOpen(true)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>➕ Add Item</span>
                  </button>
                )}
              </div>
            </div>

            {loading && sensorsList.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs text-zinc-400">Loading sensor catalog...</p>
              </div>
            ) : filteredSensors.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
                <span className="text-4xl block mb-2">🔬</span>
                <p className="text-sm font-bold text-zinc-700">No sensors match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSensors.map((sensor) => {
                  const isAvailable = sensor.availableQuantity > 0;

                  return (
                    <div
                      key={sensor._id}
                      className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Category & Stock Indicator */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                            {sensor.type || "Hardware Kit"}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {isAvailable ? `🟢 ${sensor.availableQuantity} in stock` : "🔴 Out of Stock"}
                          </span>
                        </div>

                        {/* Title & Department */}
                        <h5 className="font-extrabold text-zinc-900 text-base leading-snug group-hover:text-emerald-800 transition-colors">
                          {sensor.name}
                        </h5>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                          <span>🏛️</span>
                          <span>Dept: {sensor.department}</span>
                        </p>

                        {/* Quantity Metrics Card */}
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3.5 my-4 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Available Units</span>
                            <span className="text-lg font-black text-emerald-700">{sensor.availableQuantity}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Inventory</span>
                            <span className="text-lg font-black text-zinc-800">{sensor.totalQuantity}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <span>⚙️ Condition:</span>
                          <span className="capitalize font-bold text-zinc-700">{sensor.conditionSummary || "Working"}</span>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col gap-2">
                        {userRole === "student" ? (
                          <button
                            onClick={() => handleOpenApplyModal(sensor)}
                            disabled={!isAvailable}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                              isAvailable
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                            }`}
                          >
                            <span>📝</span>
                            <span>{isAvailable ? "Apply for Rent" : "Currently Unavailable"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewIssuedStudents(sensor)}
                            className="w-full py-2.5 bg-zinc-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>👥</span>
                            <span>View Issued Students & Loans</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MY REQUESTS (FOR STUDENTS) */}
        {/* ========================================================= */}
        {sensorTab === "my-requests" && userRole === "student" && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h4 className="text-base font-black text-zinc-900">My Sensor Rental Applications</h4>
                <p className="text-xs text-zinc-500">Track the real-time status of your requested sensor equipment</p>
              </div>
              <button
                onClick={() => fetchModuleData()}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span>🔄 Sync Now</span>
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-sm font-bold text-zinc-700">You haven&apos;t applied for any sensors yet.</p>
                <button
                  onClick={() => setSensorTab("catalog")}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Browse Sensor Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((req) => {
                  const statusColors: Record<string, { bg: string; text: string; label: string; icon: string }> = {
                    pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", label: "Pending Review", icon: "🟡" },
                    approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", label: "Approved (Ready for Pickup)", icon: "🟢" },
                    issued: { bg: "bg-emerald-100 border-emerald-300", text: "text-emerald-900", label: "Issued & Active", icon: "🟢" },
                    rejected: { bg: "bg-rose-50 border-rose-200", text: "text-rose-800", label: "Request Rejected", icon: "🔴" },
                    returned: { bg: "bg-zinc-100 border-zinc-200", text: "text-zinc-700", label: "Returned & Completed", icon: "⚪" },
                    overdue: { bg: "bg-red-100 border-red-300", text: "text-red-900", label: "Overdue", icon: "⚠️" },
                    lost: { bg: "bg-purple-50 border-purple-200", text: "text-purple-800", label: "Reported Lost", icon: "❌" }
                  };

                  const sInfo = statusColors[req.status] || statusColors.pending;

                  return (
                    <div
                      key={req._id}
                      className="border border-zinc-200/80 rounded-2xl p-5 bg-zinc-50/70 hover:bg-white transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-zinc-900 text-sm">{req.sensorId?.name || req.sensorName}</h5>
                          <span className="text-xs text-zinc-400">|</span>
                          <span className="text-xs font-semibold text-zinc-600">Duration: {req.duration}</span>
                        </div>

                        <p className="text-xs text-zinc-600 leading-relaxed">
                          <strong>Purpose:</strong> {req.purpose}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pt-1">
                          <span>👤 <strong>{req.studentName}</strong> ({req.enrollmentNo})</span>
                          <span>🏢 {req.branch}</span>
                          <span>📞 {req.phone}</span>
                          <span>📅 Applied: {new Date(req.createdAt || req.requestedFrom).toLocaleDateString()}</span>
                        </div>

                        {req.approvalNote && (
                          <div className="mt-2 bg-zinc-100 border-l-2 border-emerald-500 px-3 py-1.5 rounded text-[11px] text-zinc-700">
                            <strong>Faculty Note:</strong> {req.approvalNote}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${sInfo.bg} ${sInfo.text}`}>
                          <span>{sInfo.icon}</span>
                          <span>{sInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: FACULTY APPROVALS & REVIEWS */}
        {/* ========================================================= */}
        {sensorTab === "approvals" && (userRole === "faculty" || userRole === "admin") && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total Sensors</span>
                <span className="text-2xl font-black text-emerald-950 mt-1 block">{sensorsList.length} Items</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Requests</span>
                <span className="text-2xl font-black text-amber-950 mt-1 block">{pendingCount} Action Needed</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Active Student Loans</span>
                <span className="text-2xl font-black text-blue-950 mt-1 block">{approvedCount} Issued</span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setApprovalFilter("pending")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    approvalFilter === "pending"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  🟡 Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setApprovalFilter("approved")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    approvalFilter === "approved"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  🟢 Approved / Issued ({approvedCount})
                </button>
                <button
                  onClick={() => setApprovalFilter("returned")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    approvalFilter === "returned"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  ⚪ Returned ({allRequests.filter((r) => r.status === "returned").length})
                </button>
                <button
                  onClick={() => setApprovalFilter("rejected")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    approvalFilter === "rejected"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  🔴 Rejected ({allRequests.filter((r) => r.status === "rejected").length})
                </button>
                <button
                  onClick={() => setApprovalFilter("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    approvalFilter === "all"
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  All ({allRequests.length})
                </button>
              </div>

              <button
                onClick={() => fetchModuleData()}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>🔄 Sync Requests</span>
              </button>
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-3xl block mb-2">✨</span>
                <p className="text-xs font-bold text-zinc-500">No requests in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req._id}
                    className="border border-zinc-200/90 rounded-2xl p-5 bg-zinc-50 hover:bg-white transition-all shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-zinc-950 text-base">{req.sensorId?.name || req.sensorName}</span>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-100">
                          {req.duration}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Applied: {new Date(req.createdAt || req.requestedFrom).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Student Details Card */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-white border border-zinc-200/80 rounded-xl p-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Student Name</span>
                          <span className="font-extrabold text-zinc-800">{req.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Enrollment No.</span>
                          <span className="font-extrabold text-zinc-800">{req.enrollmentNo}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Branch</span>
                          <span className="font-medium text-zinc-700">{req.branch}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Contact Phone</span>
                          <span className="font-medium text-zinc-700">{req.phone}</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600">
                        <strong>Purpose:</strong> {req.purpose}
                      </p>

                      {req.approvalNote && (
                        <p className="text-xs text-zinc-500 italic">
                          Remarks: {req.approvalNote}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons based on Status */}
                    <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2">
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleDecision(req._id, "approved")}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>✓ Approve Loan</span>
                          </button>
                          <button
                            onClick={() => handleDecision(req._id, "rejected")}
                            className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                          >
                            <span>✕ Reject</span>
                          </button>
                        </>
                      )}

                      {(req.status === "approved" || req.status === "issued") && (
                        <>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                            🟢 Approved & Active
                          </span>
                          <button
                            onClick={() => handleReturnSensor(req._id)}
                            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                          >
                            🔄 Mark Returned
                          </button>
                        </>
                      )}

                      {req.status === "returned" && (
                        <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-zinc-200">
                          ⚪ Returned ({new Date(req.returnedAt || "").toLocaleDateString()})
                        </span>
                      )}

                      {req.status === "rejected" && (
                        <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-rose-200">
                          🔴 Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: STUDENT APPLY FOR SENSOR RENTAL (AUTO-FILLED & EDITABLE) */}
        {/* ========================================================= */}
        {applyingSensor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-emerald-100 shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
              <button
                onClick={() => setApplyingSensor(null)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 text-lg font-black cursor-pointer"
              >
                ✕
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Rental Loan Application
                </span>
                <h4 className="text-xl font-black text-zinc-950">{applyingSensor.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Dept: {applyingSensor.department} | Stock Available:{" "}
                  <strong className="text-emerald-700">{applyingSensor.availableQuantity} units</strong>
                </p>
                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2 mt-2">
                  ✨ Profile information has been auto-filled from your student account. You can edit any details below if needed.
                </p>
              </div>

              <form onSubmit={handleSubmitRentalRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStudentName}
                    onChange={(e) => setFormStudentName(e.target.value)}
                    placeholder="e.g. Rishi Patole"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                      Enrollment Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formEnrollmentNo}
                      onChange={(e) => setFormEnrollmentNo(e.target.value)}
                      placeholder="e.g. 0808CS211045"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                      Branch / Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                      placeholder="e.g. Computer Science & Engg"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                      Duration of Rental *
                    </label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="3 Days">3 Days</option>
                      <option value="7 Days">7 Days (1 Week)</option>
                      <option value="14 Days">14 Days (2 Weeks)</option>
                      <option value="30 Days">30 Days (1 Month)</option>
                      <option value="Entire Semester (Lab)">Entire Semester (Lab Project)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Purpose of Rental *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="Describe your laboratory experiment, capstone project, or IoT application purpose..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyingSensor(null)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Confirm & Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: FACULTY VIEW ISSUED STUDENTS LIST */}
        {/* ========================================================= */}
        {viewingIssuedSensor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full border border-emerald-100 shadow-2xl p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto animate-fadeIn">
              <button
                onClick={() => setViewingIssuedSensor(null)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 text-lg font-black cursor-pointer"
              >
                ✕
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Active Loans & Student Borrowers
                </span>
                <h4 className="text-xl font-black text-zinc-950">{viewingIssuedSensor.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Available: <strong className="text-emerald-700">{viewingIssuedSensor.availableQuantity}</strong> / {viewingIssuedSensor.totalQuantity} units
                </p>
              </div>

              {loadingIssuedStudents ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs text-zinc-400">Loading student borrower records...</p>
                </div>
              ) : issuedStudentsList.length === 0 ? (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center">
                  <p className="text-xs font-bold text-zinc-600">No students currently have active or recorded requests for this sensor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-400 uppercase text-[10px]">
                        <th className="pb-3 font-bold">Student Name</th>
                        <th className="pb-3 font-bold">Enrollment No.</th>
                        <th className="pb-3 font-bold">Branch & Phone</th>
                        <th className="pb-3 font-bold">Duration</th>
                        <th className="pb-3 font-bold">Status</th>
                        <th className="pb-3 font-bold">Applied Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {issuedStudentsList.map((st) => (
                        <tr key={st._id} className="hover:bg-zinc-50/80">
                          <td className="py-3 font-extrabold text-zinc-900">{st.studentName}</td>
                          <td className="py-3 font-mono font-bold text-zinc-700">{st.enrollmentNo}</td>
                          <td className="py-3 text-zinc-600">
                            <div>{st.branch}</div>
                            <div className="text-[10px] text-zinc-400">{st.phone}</div>
                          </td>
                          <td className="py-3 font-semibold text-emerald-800">{st.duration}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                st.status === "approved" || st.status === "issued"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : st.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : st.status === "returned"
                                  ? "bg-zinc-100 text-zinc-600"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                          <td className="py-3 text-zinc-500">
                            {new Date(st.createdAt || st.requestedFrom).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: FACULTY / ADMIN ADD SENSOR */}
        {/* ========================================================= */}
        {isAddSensorOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-emerald-100 shadow-2xl p-6 sm:p-8 relative animate-fadeIn">
              <button
                onClick={() => setIsAddSensorOpen(false)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 text-lg font-black cursor-pointer"
              >
                ✕
              </button>

              <h4 className="text-xl font-black text-zinc-950 mb-1">Add Sensor Catalog Item</h4>
              <p className="text-xs text-zinc-500 mb-6">Create a new hardware equipment listing in the institutional catalog</p>

              <form onSubmit={handleCreateSensor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Sensor Name *</label>
                  <input
                    type="text"
                    required
                    value={newSensorName}
                    onChange={(e) => setNewSensorName(e.target.value)}
                    placeholder="e.g. Arduino Uno R3 Microcontroller Kit"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Category / Type *</label>
                  <input
                    type="text"
                    required
                    value={newSensorType}
                    onChange={(e) => setNewSensorType(e.target.value)}
                    placeholder="e.g. Microcontroller Board"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Department *</label>
                  <select
                    value={newSensorDept}
                    onChange={(e) => setNewSensorDept(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                    <option value="Electronics & Communication (ECE)">Electronics & Communication (ECE)</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Computer Science & Engineering (CSE)">Computer Science & Engineering (CSE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Total Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newSensorQty}
                    onChange={(e) => setNewSensorQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddSensorOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                  >
                    Add to Catalog
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
