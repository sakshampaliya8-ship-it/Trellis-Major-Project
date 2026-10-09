"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { io } from "socket.io-client";
import { BACKEND_URL } from "@/config/api";

export default function PlacementsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Core Data States
  const [placementReg, setPlacementReg] = useState<any>(null);
  const [placementJobs, setPlacementJobs] = useState<any[]>([]);
  const [placementMatches, setPlacementMatches] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"student-profile" | "student-matches" | "admin-post" | "admin-profiles" | "notifications">("student-profile");

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [broadcastModalJob, setBroadcastModalJob] = useState<any>(null);
  const [broadcastMessage, setBroadcastMessage] = useState<string>("");
  const [broadcastSending, setBroadcastSending] = useState<boolean>(false);

  // Onboarding / Semester timing state
  const [studentSemester, setStudentSemester] = useState<number>(1);
  const [studentYear, setStudentYear] = useState<number>(1);
  const [isRetryAttempt, setIsRetryAttempt] = useState(false);

  // Form Section States
  // Personal / Student Detail
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Address Details
  const [curAddressLine, setCurAddressLine] = useState("");
  const [curCity, setCurCity] = useState("");
  const [curState, setCurState] = useState("");
  const [curPincode, setCurPincode] = useState("");

  const [permAddressLine, setPermAddressLine] = useState("");
  const [permCity, setPermCity] = useState("");
  const [permState, setPermState] = useState("");
  const [permPincode, setPermPincode] = useState("");

  // Family
  const [fatherName, setFatherName] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherContact, setFatherContact] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [motherContact, setMotherContact] = useState("");

  // Identity
  const [apaarId, setApaarId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Academics
  const [tenthPercentage, setTenthPercentage] = useState("");
  const [tenthBoard, setTenthBoard] = useState("");
  const [tenthSchoolName, setTenthSchoolName] = useState("");
  const [tenthYear, setTenthYear] = useState("");
  const [twelfthPercentage, setTwelfthPercentage] = useState("");
  const [twelfthBoard, setTwelfthBoard] = useState("");
  const [twelfthSchoolName, setTwelfthSchoolName] = useState("");
  const [twelfthYear, setTwelfthYear] = useState("");
  const [diplomaPercentage, setDiplomaPercentage] = useState("");
  const [diplomaBoard, setDiplomaBoard] = useState("");
  const [diplomaYear, setDiplomaYear] = useState("");
  const [gradDegree, setGradDegree] = useState("");
  const [gradUniversity, setGradUniversity] = useState("");
  const [gradCollege, setGradCollege] = useState("");
  const [gradBranch, setGradBranch] = useState("");
  const [gradStartYear, setGradStartYear] = useState("");
  const [gradExpectedGradYear, setGradExpectedGradYear] = useState("");
  const [gradRollNumber, setGradRollNumber] = useState("");
  const [gradEnrollmentNumber, setGradEnrollmentNumber] = useState("");

  // SGPAs
  const [sgpa1, setSgpa1] = useState("");
  const [sgpa2, setSgpa2] = useState("");
  const [sgpa3, setSgpa3] = useState("");
  const [sgpa4, setSgpa4] = useState("");
  const [sgpa5, setSgpa5] = useState("");
  const [sgpa6, setSgpa6] = useState("");
  const [sgpa7, setSgpa7] = useState("");
  const [sgpa8, setSgpa8] = useState("");

  // Backlogs
  const [backlogCount, setBacklogCount] = useState("0");
  const [backlogHistory, setBacklogHistory] = useState<string[]>([]);
  const [newBacklogItem, setNewBacklogItem] = useState("");

  // Documents Uploads (Base64 -> Cloudinary/Local URLs)
  const [resumeUrl, setResumeUrl] = useState("");
  const [tenthMarksheetUrl, setTenthMarksheetUrl] = useState("");
  const [twelfthMarksheetUrl, setTwelfthMarksheetUrl] = useState("");
  const [sem1MarksheetUrl, setSem1MarksheetUrl] = useState("");
  const [sem2MarksheetUrl, setSem2MarksheetUrl] = useState("");
  const [sem3MarksheetUrl, setSem3MarksheetUrl] = useState("");
  const [sem4MarksheetUrl, setSem4MarksheetUrl] = useState("");
  const [sem5MarksheetUrl, setSem5MarksheetUrl] = useState("");

  // Admin Job Posting States
  const [postCompanyName, setPostCompanyName] = useState("");
  const [postRole, setPostRole] = useState("");
  const [postType, setPostType] = useState("full-time");
  const [postDescription, setPostDescription] = useState("");
  const [postDeadline, setPostDeadline] = useState("");
  const [postRules, setPostRules] = useState<any[]>([
    { field: "cgpa", operator: ">=", value: "7.0" },
    { field: "backlogCount", operator: ">=", value: "0" }
  ]);

  // Faculty Job Edit Modal State
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editType, setEditType] = useState("full-time");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editRules, setEditRules] = useState<any[]>([]);

  // Admin Audit Log and Details view Modal states
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [showAdminEditForm, setShowAdminEditForm] = useState(false);
  const [adminEdits, setAdminEdits] = useState<any>({});
  const [updatingAcademicResume, setUpdatingAcademicResume] = useState(false);

  // Candidate Directory Filter, Sort, and View states
  const [candidateBranchFilter, setCandidateBranchFilter] = useState("all");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all");
  const [candidateZeroBacklogOnly, setCandidateZeroBacklogOnly] = useState(false);
  const [candidateViewMode, setCandidateViewMode] = useState<"table" | "cards">("table");
  const [candidateSortField, setCandidateSortField] = useState<"cgpa" | "roll" | "name" | "none">("none");
  const [candidateSortOrder, setCandidateSortOrder] = useState<"asc" | "desc">("desc");

  // Faculty Broadcast & Activity Center states
  const [broadcastsList, setBroadcastsList] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [broadcastSubTab, setBroadcastSubTab] = useState<"compose" | "history" | "activity">("compose");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastType, setBroadcastType] = useState<"shortlist" | "general" | "reminder">("shortlist");
  const [broadcastTarget, setBroadcastTarget] = useState<"all_registered" | "drive_candidates" | "selected_students">("all_registered");
  const [broadcastJobId, setBroadcastJobId] = useState("");
  const [broadcastSelectedRolls, setBroadcastSelectedRolls] = useState<string[]>([]);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [studentSearchForBroadcast, setStudentSearchForBroadcast] = useState("");

  // Quick Resume Upload Modal from Notification
  const [showQuickResumeModal, setShowQuickResumeModal] = useState(false);
  const [resumeModalJob, setResumeModalJob] = useState<any>(null);
  const [quickResumeFile, setQuickResumeFile] = useState<File | null>(null);
  const [quickResumeBase64, setQuickResumeBase64] = useState<string>("");
  const [isUploadingQuickResume, setIsUploadingQuickResume] = useState(false);
  const [quickResumeSuccess, setQuickResumeSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");
    const savedYear = parseInt(localStorage.getItem("trellis_student_year") || "1");
    const savedSemester = parseInt(localStorage.getItem("trellis_student_semester") || "1");
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
      setStudentYear(savedYear);
      setStudentSemester(savedSemester);
      if (savedRole === "admin" || savedRole === "faculty" || savedRole === "placement_head") {
        setActiveTab("admin-post");
      } else {
        setActiveTab("student-profile");
      }
    }
  }, []);

  useEffect(() => {
    if (token && userEmail) {
      fetchStudentSemester();
      fetchPlacementRegistration();
      fetchPlacementJobs();
      fetchNotifications();
      if (userRole === "admin" || userRole === "faculty" || userRole === "placement_head") {
        fetchAllRegistrations();
      }

      // Socket.io connection for real-time notifications
      const socket = io(BACKEND_URL);
      if (userEmail) {
        socket.emit("join:user", userEmail);
      }
      socket.on("notification:new", (newNotif: any) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadNotifCount((c) => c + 1);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token, userEmail, userRole]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadNotifCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadNotifCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !broadcastModalJob) return;
    setBroadcastSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobPostingId: broadcastModalJob._id,
          targetAllEligible: true,
          message: broadcastMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Alert dispatched to eligible candidates!");
        setBroadcastModalJob(null);
        setBroadcastMessage("");
        fetchNotifications();
      } else {
        alert(data.message || "Failed to dispatch alert.");
      }
    } catch (err) {
      alert("Error sending broadcast notification.");
    } finally {
      setBroadcastSending(false);
    }
  };

  // Read student's semester to validate M3 Timing Window (Backend validation also handles this)
  const fetchStudentSemester = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setStudentSemester(data.profile.semester || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlacementRegistration = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/registration/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.registration) {
        const reg = data.registration;
        setPlacementReg(reg);
        
        // Pre-fill states from registered details
        setFullName(reg.personal?.fullName || "");
        setDob(reg.personal?.dob || "");
        setGender(reg.personal?.gender || "male");
        setPhone(reg.personal?.phone || "");
        setEmail(reg.personal?.email || "");

        // Address components
        setCurAddressLine(reg.personal?.currentAddress?.addressLine || "");
        setCurCity(reg.personal?.currentAddress?.city || "");
        setCurState(reg.personal?.currentAddress?.state || "");
        setCurPincode(reg.personal?.currentAddress?.pincode || "");

        setPermAddressLine(reg.personal?.permanentAddress?.addressLine || "");
        setPermCity(reg.personal?.permanentAddress?.city || "");
        setPermState(reg.personal?.permanentAddress?.state || "");
        setPermPincode(reg.personal?.permanentAddress?.pincode || "");
        
        setFatherName(reg.family?.fatherName || "");
        setFatherOccupation(reg.family?.fatherOccupation || "");
        setFatherContact(reg.family?.fatherContact || "");
        setMotherName(reg.family?.motherName || "");
        setMotherOccupation(reg.family?.motherOccupation || "");
        setMotherContact(reg.family?.motherContact || "");
        
        setApaarId(reg.identity?.apaarId || "");
        setPhotoUrl(reg.identity?.photoUrl || "");
        
        setTenthPercentage(reg.academic?.tenth?.percentage?.toString() || "");
        setTenthBoard(reg.academic?.tenth?.board || "");
        setTenthSchoolName(reg.academic?.tenth?.schoolName || "");
        setTenthYear(reg.academic?.tenth?.year?.toString() || "");
        setTwelfthPercentage(reg.academic?.twelfth?.percentage?.toString() || "");
        setTwelfthBoard(reg.academic?.twelfth?.board || "");
        setTwelfthSchoolName(reg.academic?.twelfth?.schoolName || "");
        setTwelfthYear(reg.academic?.twelfth?.year?.toString() || "");
        setDiplomaPercentage(reg.academic?.diploma?.percentage?.toString() || "");
        setDiplomaBoard(reg.academic?.diploma?.board || "");
        setDiplomaYear(reg.academic?.diploma?.year?.toString() || "");
        
        setGradDegree(reg.academic?.graduation?.degree || "");
        setGradUniversity(reg.academic?.graduation?.university || "");
        setGradCollege(reg.academic?.graduation?.college || "");
        setGradBranch(reg.academic?.graduation?.branch || "");
        setGradStartYear(reg.academic?.graduation?.startYear?.toString() || "");
        setGradExpectedGradYear(reg.academic?.graduation?.expectedGraduationYear?.toString() || "");
        
        setGradRollNumber(reg.academic?.rollNumber || "");
        setGradEnrollmentNumber(reg.academic?.enrollmentNumber || "");
        setIsRetryAttempt(!!reg.isRetryAttempt);

        const sgpas = reg.academic?.semesterSgpa || [];
        setSgpa1(sgpas.find((e: any) => e.semester === 1)?.sgpa?.toString() || "");
        setSgpa2(sgpas.find((e: any) => e.semester === 2)?.sgpa?.toString() || "");
        setSgpa3(sgpas.find((e: any) => e.semester === 3)?.sgpa?.toString() || "");
        setSgpa4(sgpas.find((e: any) => e.semester === 4)?.sgpa?.toString() || "");
        setSgpa5(sgpas.find((e: any) => e.semester === 5)?.sgpa?.toString() || "");
        setSgpa6(sgpas.find((e: any) => e.semester === 6)?.sgpa?.toString() || "");
        setSgpa7(sgpas.find((e: any) => e.semester === 7)?.sgpa?.toString() || "");
        setSgpa8(sgpas.find((e: any) => e.semester === 8)?.sgpa?.toString() || "");
        
        setBacklogCount(reg.academic?.backlogCount?.toString() || "0");
        setBacklogHistory(reg.academic?.backlogHistory || []);

        setResumeUrl(reg.documents?.resumeUrl || "");
        setTenthMarksheetUrl(reg.documents?.tenthMarksheetUrl || "");
        setTwelfthMarksheetUrl(reg.documents?.twelfthMarksheetUrl || "");

        const sMarksheets = reg.documents?.semesterMarksheets || [];
        setSem1MarksheetUrl(sMarksheets.find((e: any) => e.semester === 1)?.url || "");
        setSem2MarksheetUrl(sMarksheets.find((e: any) => e.semester === 2)?.url || "");
        setSem3MarksheetUrl(sMarksheets.find((e: any) => e.semester === 3)?.url || "");
        setSem4MarksheetUrl(sMarksheets.find((e: any) => e.semester === 4)?.url || "");
        setSem5MarksheetUrl(sMarksheets.find((e: any) => e.semester === 5)?.url || "");

        // Fetch matched placement postings
        fetchMatches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlacementJobs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPlacementJobs(data.jobs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllRegistrations = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.registrations) {
        setAllRegistrations(data.registrations);
      }
    } catch (err) {
      console.error("Failed to fetch all registrations:", err);
    }
  };

  // Helper: Export candidate list to Excel / CSV format
  const handleExportCandidatesCsv = (candidates: any[]) => {
    if (!candidates || candidates.length === 0) {
      alert("No candidate data to export.");
      return;
    }

    const headers = [
      "Sr",
      "Roll Number",
      "Full Name",
      "Email (Mail)",
      "Phone",
      "Branch",
      "Calculated CGPA",
      "Active Backlogs",
      "10th %",
      "12th %",
      "Academic Gap (Yrs)",
      "Current Address",
      "Status",
      "Resume URL"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = candidates.map((reg, index) => {
      const curAddr = reg.personal?.currentAddress
        ? `${reg.personal.currentAddress.addressLine || ""}, ${reg.personal.currentAddress.city || ""}, ${reg.personal.currentAddress.state || ""} - ${reg.personal.currentAddress.pincode || ""}`
        : "";

      return [
        index + 1,
        escapeCsv(reg.academic?.rollNumber || "N/A"),
        escapeCsv(reg.personal?.fullName || "Student"),
        escapeCsv(reg.personal?.email || reg.studentId?.email || ""),
        escapeCsv(reg.personal?.phone || ""),
        escapeCsv(reg.academic?.branch || "N/A"),
        typeof reg.academic?.cgpa === "number" ? reg.academic.cgpa.toFixed(2) : reg.academic?.cgpa || 0,
        reg.academic?.backlogCount || 0,
        reg.academic?.tenth?.percentage ? `${reg.academic.tenth.percentage}%` : "N/A",
        reg.academic?.twelfth?.percentage ? `${reg.academic.twelfth.percentage}%` : "N/A",
        reg.academic?.overallEducationGap || 0,
        escapeCsv(curAddr),
        escapeCsv(reg.status || "draft"),
        escapeCsv(reg.documents?.resumeUrl || "")
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trellis_Placement_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.broadcasts) {
        setBroadcastsList(data.broadcasts);
      }
    } catch (err) {
      console.error("Failed to fetch broadcasts:", err);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/activity-feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.activities) {
        setActivityFeed(data.activities);
      }
    } catch (err) {
      console.error("Failed to fetch activity feed:", err);
    }
  };

  const handleSendCustomBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) {
      alert("Please provide both title and announcement message.");
      return;
    }

    setIsSubmittingBroadcast(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/broadcasts/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMsg,
          broadcastType,
          targetType: broadcastTarget,
          jobPostingId: broadcastJobId || undefined,
          selectedStudentIds: broadcastSelectedRolls
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || "Broadcast successfully sent to students!");
        setBroadcastTitle("");
        setBroadcastMsg("");
        setBroadcastSelectedRolls([]);
        fetchBroadcasts();
        fetchActivityFeed();
        setBroadcastSubTab("history");
      } else {
        alert(data.message || "Failed to send broadcast.");
      }
    } catch (err) {
      console.error("Broadcast send error:", err);
      alert("Error sending broadcast.");
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs?studentEmail=${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlacementMatches(data.jobs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper: Client side file uploader utility
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Max file size allowed is 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      try {
        const fileType = file.type === "application/pdf" ? "pdf" : "image";
        const response = await fetch(`${BACKEND_URL}/api/upload-file`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ fileData: base64, fileType })
        });
        const data = await response.json();
        if (data.success) {
          setter(data.url);
          alert("File uploaded and saved successfully!");
        } else {
          alert(data.message || "File upload failed.");
        }
      } catch (err) {
        alert("Upload connection error.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // derived values on frontend
  const calculateFrontendCgpa = () => {
    const s1 = parseFloat(sgpa1) || 0;
    const s2 = parseFloat(sgpa2) || 0;
    const s3 = parseFloat(sgpa3) || 0;
    const s4 = parseFloat(sgpa4) || 0;
    const s5 = parseFloat(sgpa5) || 0;
    const s6 = parseFloat(sgpa6) || 0;
    const s7 = parseFloat(sgpa7) || 0;
    const s8 = parseFloat(sgpa8) || 0;

    const entries = [s1, s2, s3, s4, s5, s6, s7, s8];
    const valid = entries.filter(v => v > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((a, b) => a + b, 0);
    return Math.round((sum / valid.length) * 100) / 100;
  };

  const getTenthToTwelfthGap = () => {
    const t = parseInt(tenthYear);
    const tw = parseInt(twelfthYear);
    if (!t || !tw) return 0;
    return Math.max(0, tw - t - 2);
  };

  const getTwelfthToGraduationGap = () => {
    const tw = parseInt(twelfthYear);
    const gs = parseInt(gradStartYear);
    if (!tw || !gs) return 0;
    return Math.max(0, gs - tw);
  };

  const getOverallEducationGap = () => {
    return getTenthToTwelfthGap() + getTwelfthToGraduationGap();
  };

  const handleSavePlacementReg = async (isDraft: boolean) => {
    if (!isDraft) {
      const confirmSubmit = window.confirm(
        "Warning: After final submission, you will not be able to edit this registration. Are you sure you want to submit and lock your profile?"
      );
      if (!confirmSubmit) return;
    }

    setLoading(true);
    try {
      const allSgpas = [
        { semester: 1, sgpa: parseFloat(sgpa1) || 0 },
        { semester: 2, sgpa: parseFloat(sgpa2) || 0 },
        { semester: 3, sgpa: parseFloat(sgpa3) || 0 },
        { semester: 4, sgpa: parseFloat(sgpa4) || 0 },
        { semester: 5, sgpa: parseFloat(sgpa5) || 0 },
        { semester: 6, sgpa: parseFloat(sgpa6) || 0 },
        { semester: 7, sgpa: parseFloat(sgpa7) || 0 },
        { semester: 8, sgpa: parseFloat(sgpa8) || 0 }
      ];
      const semesterSgpa = allSgpas.filter((item) => item.sgpa > 0);

      const semesterMarksheets = [
        { semester: 1, url: sem1MarksheetUrl },
        { semester: 2, url: sem2MarksheetUrl },
        { semester: 3, url: sem3MarksheetUrl },
        { semester: 4, url: sem4MarksheetUrl }
      ];
      if (!isRetryAttempt) {
        semesterMarksheets.push({ semester: 5, url: sem5MarksheetUrl });
      }

      const body = {
        isRetryAttempt,
        isDraft,
        personal: {
          fullName,
          dob,
          gender,
          phone,
          email: email || userEmail,
          currentAddress: {
            addressLine: curAddressLine,
            city: curCity,
            state: curState,
            pincode: curPincode
          },
          permanentAddress: {
            addressLine: permAddressLine,
            city: permCity,
            state: permState,
            pincode: permPincode
          }
        },
        family: {
          fatherName,
          fatherOccupation,
          fatherContact,
          motherName,
          motherOccupation,
          motherContact
        },
        identity: {
          apaarId,
          photoUrl
        },
        academic: {
          tenth: {
            percentage: parseFloat(tenthPercentage) || 0,
            board: tenthBoard,
            schoolName: tenthSchoolName,
            year: parseInt(tenthYear) || 0
          },
          twelfth: {
            percentage: parseFloat(twelfthPercentage) || 0,
            board: twelfthBoard,
            schoolName: twelfthSchoolName,
            year: parseInt(twelfthYear) || 0
          },
          diploma: {
            percentage: diplomaPercentage ? parseFloat(diplomaPercentage) : undefined,
            board: diplomaBoard || undefined,
            year: diplomaYear ? parseInt(diplomaYear) : undefined
          },
          graduation: {
            degree: gradDegree,
            university: gradUniversity,
            college: gradCollege,
            branch: gradBranch,
            startYear: parseInt(gradStartYear) || 0,
            expectedGraduationYear: parseInt(gradExpectedGradYear) || 0,
            currentSemester: studentSemester
          },
          branch: gradBranch,
          rollNumber: gradRollNumber,
          enrollmentNumber: gradEnrollmentNumber,
          semesterSgpa,
          backlogCount: parseInt(backlogCount) || 0,
          backlogHistory
        },
        documents: {
          resumeUrl,
          tenthMarksheetUrl,
          twelfthMarksheetUrl,
          semesterMarksheets
        }
      };

      const res = await fetch(`${BACKEND_URL}/api/placement/registration/${userEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert(isDraft ? "Draft saved successfully!" : "Profile locked and registered successfully!");
        fetchPlacementRegistration();
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (err) {
      alert("Error sending request.");
    } finally {
      setLoading(false);
    }
  };

  // Student update only resume & semester SGPAs/CGPA
  const handleUpdateAcademicAndResume = async () => {
    if (!placementReg) return;
    setUpdatingAcademicResume(true);
    try {
      const allSgpas = [
        { semester: 1, sgpa: parseFloat(sgpa1) || 0 },
        { semester: 2, sgpa: parseFloat(sgpa2) || 0 },
        { semester: 3, sgpa: parseFloat(sgpa3) || 0 },
        { semester: 4, sgpa: parseFloat(sgpa4) || 0 },
        { semester: 5, sgpa: parseFloat(sgpa5) || 0 },
        { semester: 6, sgpa: parseFloat(sgpa6) || 0 },
        { semester: 7, sgpa: parseFloat(sgpa7) || 0 },
        { semester: 8, sgpa: parseFloat(sgpa8) || 0 }
      ];
      const semesterSgpa = allSgpas.filter((item) => item.sgpa > 0);

      const res = await fetch(`${BACKEND_URL}/api/placement/registration/${userEmail}/student-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          semesterSgpa,
          resumeUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Resume and Semester CGPA updated successfully! Active placement eligibility recalculated.");
        fetchPlacementRegistration();
        fetchMatches();
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    } finally {
      setUpdatingAcademicResume(false);
    }
  };

  // Quick resume upload from notification card or drive card
  const handleQuickResumeUpload = async () => {
    if (!quickResumeBase64) {
      alert("Please select a PDF resume file first.");
      return;
    }
    setIsUploadingQuickResume(true);
    setQuickResumeSuccess(null);
    try {
      if (resumeModalJob?._id) {
        // DRIVE-SPECIFIC TAILORED RESUME:
        // Attaches solely to this company drive without modifying the master profile!
        const res = await fetch(`${BACKEND_URL}/api/placement/jobs/${resumeModalJob._id}/attach-resume`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            resumeUrl: quickResumeBase64
          })
        });
        const data = await res.json();
        if (data.success) {
          setQuickResumeSuccess(`Custom tailored resume attached exclusively for ${resumeModalJob.companyName || "this company"}! Your master profile resume remains untouched.`);
          fetchMatches();
        } else {
          alert(data.message || "Failed to attach tailored resume.");
        }
      } else {
        // MASTER PROFILE RESUME UPDATE
        const res = await fetch(`${BACKEND_URL}/api/placement/registration/${userEmail}/student-update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            resumeUrl: quickResumeBase64
          })
        });
        const data = await res.json();
        if (data.success) {
          setQuickResumeSuccess("Resume updated successfully in your master placement profile!");
          setResumeUrl(data.registration?.documents?.resumeUrl || quickResumeBase64);
          fetchPlacementRegistration();
          fetchMatches();
        } else {
          alert(data.message || "Failed to update resume.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading resume.");
    } finally {
      setIsUploadingQuickResume(false);
    }
  };

  // Student Match Actions
  const handleStudentDecision = async (jobId: string, decision: "applied" | "no-apply") => {
    setLoading(true);
    try {
      const targetMatch = placementMatches.find(
        (m: any) => (m.jobPostingId?._id || m.jobPostingId) === jobId
      );
      // Prefer drive-specific tailored resume if attached, otherwise fallback to master resumeUrl
      const finalResumeToSubmit = targetMatch?.applicationResumeUrl || resumeUrl;

      const res = await fetch(`${BACKEND_URL}/api/placement/jobs/${jobId}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision, applicationResume: finalResumeToSubmit })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully submitted decision: ${decision}`);
        fetchPlacementRegistration();
        fetchMatches();
      } else {
        alert(data.message || "Failed to submit decision.");
      }
    } catch (err) {
      alert("Error sending decision.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeReject = async (jobId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs/${jobId}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Notification acknowledged.");
        fetchPlacementRegistration();
      } else {
        alert(data.message || "Failed to acknowledge.");
      }
    } catch (err) {
      alert("Error sending acknowledgement.");
    } finally {
      setLoading(false);
    }
  };

  // Faculty Actions
  const handlePublishJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: postCompanyName,
          role: postRole,
          type: postType,
          description: postDescription,
          eligibilityRules: postRules,
          applicationDeadline: new Date(postDeadline)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Placement job drive published and candidates matched!");
        setPostCompanyName("");
        setPostRole("");
        setPostDescription("");
        setPostDeadline("");
        fetchPlacementJobs();
      } else {
        alert(data.message || "Failed to publish drive.");
      }
    } catch (err) {
      alert("Error publishing drive.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditJob = (job: any) => {
    setEditingJob(job);
    setEditCompanyName(job.companyName || "");
    setEditRole(job.role || "");
    setEditType(job.type || "full-time");
    setEditDescription(job.description || "");
    
    if (job.applicationDeadline) {
      const d = new Date(job.applicationDeadline);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditDeadline(iso);
    } else {
      setEditDeadline("");
    }
    
    setEditRules(job.eligibilityRules ? JSON.parse(JSON.stringify(job.eligibilityRules)) : []);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs/${editingJob._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: editCompanyName,
          role: editRole,
          type: editType,
          description: editDescription,
          applicationDeadline: editDeadline ? new Date(editDeadline) : undefined,
          eligibilityRules: editRules
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Placement drive updated successfully and eligible candidates re-matched!");
        setEditingJob(null);
        fetchPlacementJobs();
      } else {
        alert(data.message || "Failed to update drive.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating drive.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to delete the drive for "${companyName}"? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Drive deleted successfully.");
        fetchPlacementJobs();
      } else {
        alert(data.message || "Failed to delete drive.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting drive.");
    } finally {
      setLoading(false);
    }
  };

  // Audit and Admin edit logic
  const handleLoadStudentRegistrationForAdmin = async (studEmail: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/registration/${studEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.registration) {
        setSelectedReg(data.registration);
        setAdminEdits({});
        setShowAdminEditForm(false);
      } else {
        alert("Profile registration not found for this student.");
      }
    } catch (err) {
      alert("Error fetching details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpdateRegistration = async () => {
    if (Object.keys(adminEdits).length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/registration/${selectedReg.studentId?.email}/admin-edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(adminEdits)
      });
      const data = await res.json();
      if (data.success) {
        alert("Student profile updated and audit logged successfully!");
        setSelectedReg(data.registration);
        setShowAdminEditForm(false);
        fetchAllRegistrations();
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      alert("Error saving profile changes.");
    } finally {
      setLoading(false);
    }
  };

  // PDF report compile download
  const handleDownloadPdfReport = async (jobId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/placement/jobs/${jobId}/report`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      const data = await res.json();
      if (data.success && data.report?.pdfUrl) {
        window.open(data.report.pdfUrl, "_blank");
      } else {
        alert(data.message || "Error generating report.");
      }
    } catch (err) {
      console.error("PDF report compile error:", err);
      alert("Error compiling PDF report.");
    } finally {
      setLoading(false);
    }
  };

  const isYearSemAllowed = studentYear >= 3 || studentSemester >= 6;
  const isRestricted = userRole === "student" && !isYearSemAllowed;

  if (isRestricted) {
    return (
      <DashboardLayout>
        <div className="bg-white border border-rose-100 rounded-3xl p-8 text-center max-w-lg mx-auto mt-12 shadow-sm space-y-4">
          <span className="text-4xl">💼</span>
          <h2 className="text-lg font-black text-rose-800">Access Restricted</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            The Placement Board is restricted to students in Semester 6 and above.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 text-zinc-950 font-sans">
        
        {/* Top Header & Navigation Tabs */}
        <div className="pb-4 border-b border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-2xl font-black text-emerald-800 tracking-tight">Placement & Eligibility Dashboard</h3>
            <p className="text-xs text-zinc-500 mt-1">Structured placements dashboard with rule-based auto matching & alerts (IPS Academy, Indore)</p>
          </div>
          
          <div className="flex bg-emerald-50 rounded-2xl p-1 shrink-0 flex-wrap gap-1">
            {userRole === "student" ? (
              <>
                <button
                  onClick={() => setActiveTab("student-profile")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "student-profile" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  My Placement Form
                </button>
                <button
                  onClick={() => setActiveTab("student-matches")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "student-matches" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Matched Openings ({placementMatches.length})
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === "notifications" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <span>🔔 Alerts</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-black">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("admin-post")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "admin-post" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Publish Job Drive
                </button>
                <button
                  onClick={() => {
                    setActiveTab("admin-profiles");
                    fetchAllRegistrations();
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "admin-profiles" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Verify Candidates ({allRegistrations.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("notifications");
                    fetchBroadcasts();
                    fetchActivityFeed();
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === "notifications" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <span>🔔 Alerts & Broadcasts</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-black">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* loading spinner overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        )}

        {/* 1. STUDENT VIEW */}
        {userRole === "student" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Student profile tab */}
            {activeTab === "student-profile" && (
              <div className="lg:col-span-12 space-y-6">
                {placementReg?.status === "locked" ? (
                  // Locked Profile (Read Only)
                  <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-150">
                      <div>
                        <h4 className="text-xl font-black text-emerald-800">{placementReg.personal?.fullName}</h4>
                        <p className="text-xs text-zinc-500">Roll Number: {placementReg.academic?.rollNumber} | Branch: {placementReg.academic?.branch}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                        Registration Locked
                      </span>
                    </div>

                    {/* Derived Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-emerald-700">
                          {calculateFrontendCgpa() > 0 ? calculateFrontendCgpa().toFixed(2) : (placementReg.academic?.cgpa?.toFixed(2) || "0.00")}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Calculated CGPA</p>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-zinc-800">{placementReg.academic?.backlogCount}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Active Backlogs</p>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-zinc-800">{placementReg.academic?.overallEducationGap} Yrs</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Education Gap</p>
                      </div>
                      <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-center">
                        <p className="text-sm font-black text-zinc-800 truncate mt-1">{placementReg.identity?.apaarId}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">APAAR ID</p>
                      </div>
                    </div>

                    {/* Details sections read-only layout */}
                    <div className="space-y-6 pt-6 border-t border-zinc-150">
                      
                      {/* Section 1: Personal & Addresses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl">
                          <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">Student Details</h5>
                          <div className="text-xs text-zinc-700 space-y-2">
                            <p><strong>Full Name:</strong> {placementReg.personal?.fullName}</p>
                            <p><strong>Date of Birth:</strong> {placementReg.personal?.dob}</p>
                            <p><strong>Gender:</strong> {placementReg.personal?.gender}</p>
                            <p><strong>Mobile:</strong> {placementReg.personal?.phone}</p>
                            <p><strong>Email Address:</strong> {placementReg.personal?.email}</p>
                          </div>
                        </div>

                        <div className="bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl">
                          <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">Address Details</h5>
                          <div className="text-xs text-zinc-700 space-y-3">
                            <div>
                              <p className="font-bold text-[10px] uppercase text-zinc-400">Current Address:</p>
                              <p className="mt-0.5">{placementReg.personal?.currentAddress?.addressLine}, {placementReg.personal?.currentAddress?.city}, {placementReg.personal?.currentAddress?.state} - {placementReg.personal?.currentAddress?.pincode}</p>
                            </div>
                            <div>
                              <p className="font-bold text-[10px] uppercase text-zinc-400">Permanent Address:</p>
                              <p className="mt-0.5">{placementReg.personal?.permanentAddress?.addressLine}, {placementReg.personal?.permanentAddress?.city}, {placementReg.personal?.permanentAddress?.state} - {placementReg.personal?.permanentAddress?.pincode}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Family Details */}
                      <div className="bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl">
                        <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">Family Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-700">
                          <div>
                            <p className="font-bold text-zinc-500 uppercase text-[9px] mb-1">Father's Info:</p>
                            <p><strong>Name:</strong> {placementReg.family?.fatherName}</p>
                            <p><strong>Occupation:</strong> {placementReg.family?.fatherOccupation}</p>
                            <p><strong>Contact Phone:</strong> {placementReg.family?.fatherContact}</p>
                          </div>
                          <div>
                            <p className="font-bold text-zinc-500 uppercase text-[9px] mb-1">Mother's Info:</p>
                            <p><strong>Name:</strong> {placementReg.family?.motherName}</p>
                            <p><strong>Occupation:</strong> {placementReg.family?.motherOccupation}</p>
                            <p><strong>Contact Phone:</strong> {placementReg.family?.motherContact}</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Academics & Gaps Details */}
                      <div className="bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl space-y-4">
                        <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Academic & Schooling History</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-700 border-b border-zinc-200/60 pb-3">
                          <div>
                            <p className="font-bold text-zinc-500 uppercase text-[9px] mb-1">10th Schooling Details:</p>
                            <p><strong>School Name:</strong> {placementReg.academic?.tenth?.schoolName}</p>
                            <p><strong>Board Name:</strong> {placementReg.academic?.tenth?.board}</p>
                            <p><strong>Percentage Marks:</strong> {placementReg.academic?.tenth?.percentage}%</p>
                            <p><strong>Passing Year:</strong> {placementReg.academic?.tenth?.year}</p>
                          </div>
                          <div>
                            <p className="font-bold text-zinc-500 uppercase text-[9px] mb-1">12th/Diploma Schooling Details:</p>
                            <p><strong>School Name:</strong> {placementReg.academic?.twelfth?.schoolName}</p>
                            <p><strong>Board Name:</strong> {placementReg.academic?.twelfth?.board}</p>
                            <p><strong>Percentage Marks:</strong> {placementReg.academic?.twelfth?.percentage}%</p>
                            <p><strong>Passing Year:</strong> {placementReg.academic?.twelfth?.year}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-700">
                          <div>
                            <p className="font-bold text-zinc-500 uppercase text-[9px] mb-1">Graduation Details:</p>
                            <p><strong>Degree / Branch:</strong> {placementReg.academic?.graduation?.degree} in {placementReg.academic?.graduation?.branch}</p>
                            <p><strong>University / College:</strong> {placementReg.academic?.graduation?.university} | {placementReg.academic?.graduation?.college}</p>
                            <p><strong>Academic Years:</strong> {placementReg.academic?.graduation?.startYear} - {placementReg.academic?.graduation?.expectedGraduationYear}</p>
                            <p><strong>Roll / Enrollment:</strong> {placementReg.academic?.rollNumber} / {placementReg.academic?.enrollmentNumber}</p>
                          </div>
                          <div>
                            <p className="font-bold text-zinc-500 uppercase text-[9px] mb-1">Semester SGPA Track (Editable):</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mt-1">
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 1</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa1}
                                  onChange={(e) => setSgpa1(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 2</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa2}
                                  onChange={(e) => setSgpa2(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 3</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa3}
                                  onChange={(e) => setSgpa3(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 4</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa4}
                                  onChange={(e) => setSgpa4(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 5</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa5}
                                  onChange={(e) => setSgpa5(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 6</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa6}
                                  onChange={(e) => setSgpa6(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 7</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa7}
                                  onChange={(e) => setSgpa7(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Sem 8</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sgpa8}
                                  onChange={(e) => setSgpa8(e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-zinc-800 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-emerald-700 font-bold mt-1.5">
                              ✨ Live Calculated CGPA: {calculateFrontendCgpa().toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Identity Verification & Documents */}
                      <div className="bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <img src={placementReg.identity?.photoUrl} alt="Passport Photograph" className="w-14 h-14 object-cover rounded-xl border border-zinc-200 shadow-sm" />
                            <div>
                              <p className="text-xs font-bold text-zinc-800">{placementReg.personal?.fullName}</p>
                              <p className="text-[10px] text-zinc-400">APAAR ID: {placementReg.identity?.apaarId}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-bold text-emerald-800">
                            {resumeUrl && (
                              <a href={resumeUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm">📄 View Current Resume</a>
                            )}
                            {placementReg.documents?.tenthMarksheetUrl && (
                              <a href={placementReg.documents?.tenthMarksheetUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm">📄 View 10th Marksheet</a>
                            )}
                            {placementReg.documents?.twelfthMarksheetUrl && (
                              <a href={placementReg.documents?.twelfthMarksheetUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm">📄 View 12th Marksheet</a>
                            )}
                          </div>
                        </div>

                        {/* Editable Resume Upload */}
                        <div className="pt-3 border-t border-zinc-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-emerald-800">Update Resume File (PDF)</p>
                            <p className="text-[10px] text-zinc-400">Upload an updated PDF resume for placements</p>
                          </div>
                          <div className="max-w-xs w-full">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleFileUpload(e, setResumeUrl)}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Bar for Student Update */}
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-xs text-emerald-900">
                          <p className="font-bold flex items-center gap-1.5">
                            <span>🔒</span> Institute Policy: Only Resume & Semester SGPAs are editable.
                          </p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            Saving will recalculate your Cumulative CGPA and update active placement drive matching immediately.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={updatingAcademicResume}
                          onClick={handleUpdateAcademicAndResume}
                          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 shrink-0"
                        >
                          {updatingAcademicResume ? "Saving Updates..." : "💾 Update Resume & Semester CGPA"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Wizard Onboarding form
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSavePlacementReg(false); }}
                    className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-sm space-y-8"
                  >
                    <div>
                      <h4 className="text-lg font-black text-emerald-800">Placement Registration Form (3rd Year Window)</h4>
                      <p className="text-xs text-zinc-400 mt-1">Please fill in all sections carefully. Form will be permanently locked after final submission.</p>
                    </div>

                    {/* Semester window check check */}
                    {(studentSemester < 6 || studentSemester > 8) && (
                      <div className="bg-red-50 text-red-800 text-xs font-bold rounded-2xl p-4 border border-red-200">
                        ⚠ Placement registration is only available to students in Semester 6, 7, and 8. Your current semester is {studentSemester}. Submission will be rejected by backend.
                      </div>
                    )}

                    {/* Section 1: Personal Info */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-50 pb-1">Personal Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Full Name *</label>
                          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Date of Birth *</label>
                          <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Gender *</label>
                          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Phone *</label>
                          <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Email Address *</label>
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                      </div>
                      <div className="border-t border-zinc-100 pt-4 space-y-4">
                        <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest pb-1 border-b border-emerald-50">Address Details</h5>
                        
                        <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-2xl space-y-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Address</p>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Address Line *</label>
                              <input type="text" required value={curAddressLine} onChange={(e) => setCurAddressLine(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">City *</label>
                              <input type="text" required value={curCity} onChange={(e) => setCurCity(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">State *</label>
                              <input type="text" required value={curState} onChange={(e) => setCurState(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Pincode *</label>
                              <input type="text" required value={curPincode} onChange={(e) => setCurPincode(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-2xl space-y-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Permanent Address</p>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Address Line *</label>
                              <input type="text" required value={permAddressLine} onChange={(e) => setPermAddressLine(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">City *</label>
                              <input type="text" required value={permCity} onChange={(e) => setPermCity(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">State *</label>
                              <input type="text" required value={permState} onChange={(e) => setPermState(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Pincode *</label>
                              <input type="text" required value={permPincode} onChange={(e) => setPermPincode(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Family Info */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-50 pb-1">Family Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Father's Name *</label>
                          <input type="text" required value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Father's Occupation *</label>
                          <input type="text" required value={fatherOccupation} onChange={(e) => setFatherOccupation(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Father's Contact Phone *</label>
                          <input type="text" required value={fatherContact} onChange={(e) => setFatherContact(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Mother's Name *</label>
                          <input type="text" required value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Mother's Occupation *</label>
                          <input type="text" required value={motherOccupation} onChange={(e) => setMotherOccupation(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Mother's Contact Phone *</label>
                          <input type="text" required value={motherContact} onChange={(e) => setMotherContact(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Identity & Photo */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-50 pb-1">Identity verification (Excluding Aadhaar)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">APAAR ID *</label>
                          <input type="text" required value={apaarId} onChange={(e) => setApaarId(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. 12-digit APAAR identification code" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Upload Passport Photo (Image) *</label>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setPhotoUrl)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-1.5 text-xs" />
                          {photoUrl && <span className="text-[10px] text-emerald-700 block mt-1 font-bold">✔ Photo uploaded successfully</span>}
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Academic details */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-50 pb-1">Academic & Gaps Details</h5>
                      
                      {/* Retry attempt checkbox */}
                      <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                        <input type="checkbox" checked={isRetryAttempt} onChange={(e) => setIsRetryAttempt(e.target.checked)} className="rounded text-emerald-700" id="retry-chk" />
                        <label htmlFor="retry-chk" className="text-xs font-bold text-emerald-800 cursor-pointer">
                          Apply as Retry/Late Attempt (Uses Semesters 1–4 data only, Semester 5 results unavailable)
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Graduation Degree *</label>
                          <input type="text" required value={gradDegree} onChange={(e) => setGradDegree(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. B.Tech / B.E." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">University Name *</label>
                          <input type="text" required value={gradUniversity} onChange={(e) => setGradUniversity(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. RGPV" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">College Name *</label>
                          <input type="text" required value={gradCollege} onChange={(e) => setGradCollege(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. IPS Academy, Indore" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Branch / Department *</label>
                          <input type="text" required value={gradBranch} onChange={(e) => setGradBranch(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. CSE / IT" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Start / Admission Year *</label>
                          <input type="number" required value={gradStartYear} onChange={(e) => setGradStartYear(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Expected Graduation Year *</label>
                          <input type="number" required value={gradExpectedGradYear} onChange={(e) => setGradExpectedGradYear(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Academic Roll Number *</label>
                          <input type="text" required value={gradRollNumber} onChange={(e) => setGradRollNumber(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Enrollment Number *</label>
                          <input type="text" required value={gradEnrollmentNumber} onChange={(e) => setGradEnrollmentNumber(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                      </div>

                      {/* 10th and 12th details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">10th Percentage *</label>
                          <input type="number" step="0.01" required value={tenthPercentage} onChange={(e) => setTenthPercentage(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">10th Board *</label>
                          <input type="text" required value={tenthBoard} onChange={(e) => setTenthBoard(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">10th School Name *</label>
                          <input type="text" required value={tenthSchoolName} onChange={(e) => setTenthSchoolName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. DPS Indore" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">10th Passing Year *</label>
                          <input type="number" required value={tenthYear} onChange={(e) => setTenthYear(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">12th Percentage *</label>
                          <input type="number" step="0.01" required value={twelfthPercentage} onChange={(e) => setTwelfthPercentage(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">12th Board *</label>
                          <input type="text" required value={twelfthBoard} onChange={(e) => setTwelfthBoard(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">12th School Name *</label>
                          <input type="text" required value={twelfthSchoolName} onChange={(e) => setTwelfthSchoolName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" placeholder="e.g. DPS Indore" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">12th Passing Year *</label>
                          <input type="number" required value={twelfthYear} onChange={(e) => setTwelfthYear(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                      </div>

                      {/* Derived gap information display */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-zinc-700 mt-2">
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">10th ➔ 12th Gap</p>
                          <p className="text-base text-zinc-800 font-black">{getTenthToTwelfthGap()} Year(s)</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">12th ➔ Graduation Gap</p>
                          <p className="text-base text-zinc-800 font-black">{getTwelfthToGraduationGap()} Year(s)</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Overall Academic Gap</p>
                          <p className="text-base text-zinc-800 font-black">{getOverallEducationGap()} Year(s)</p>
                        </div>
                      </div>

                      {/* SGPAs entries */}
                      <div className="pt-2 space-y-3">
                        <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider">Semester SGPA Data</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 1 SGPA</label>
                            <input type="number" step="0.01" required value={sgpa1} onChange={(e) => setSgpa1(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 2 SGPA</label>
                            <input type="number" step="0.01" required value={sgpa2} onChange={(e) => setSgpa2(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 3 SGPA</label>
                            <input type="number" step="0.01" required value={sgpa3} onChange={(e) => setSgpa3(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 4 SGPA</label>
                            <input type="number" step="0.01" required value={sgpa4} onChange={(e) => setSgpa4(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 5 SGPA</label>
                            <input type="number" step="0.01" value={sgpa5} onChange={(e) => setSgpa5(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 6 SGPA</label>
                            <input type="number" step="0.01" value={sgpa6} onChange={(e) => setSgpa6(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 7 SGPA</label>
                            <input type="number" step="0.01" value={sgpa7} onChange={(e) => setSgpa7(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Sem 8 SGPA</label>
                            <input type="number" step="0.01" value={sgpa8} onChange={(e) => setSgpa8(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold text-center" />
                          </div>
                        </div>

                        {/* derived CGPA read only display */}
                        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs font-bold text-emerald-800">
                          <span>Calculated Cumulative CGPA (Read-only derived value):</span>
                          <span className="text-base font-black tracking-wide">{calculateFrontendCgpa().toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Backlogs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Current Backlogs Count *</label>
                          <input type="number" required value={backlogCount} onChange={(e) => setBacklogCount(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-700" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Add Backlog History Item</label>
                          <div className="flex gap-2">
                            <input type="text" placeholder="e.g. BT-301 Mathematics-III" value={newBacklogItem} onChange={(e) => setNewBacklogItem(e.target.value)} className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs" />
                            <button type="button" onClick={() => { if (newBacklogItem.trim()) { setBacklogHistory([...backlogHistory, newBacklogItem.trim()]); setNewBacklogItem(""); } }} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-750 text-xs font-bold rounded-xl">+</button>
                          </div>
                          {backlogHistory.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {backlogHistory.map((item, idx) => (
                                <span key={idx} className="bg-red-50 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-red-100 flex items-center gap-1.5">
                                  {item}
                                  <button type="button" onClick={() => setBacklogHistory(backlogHistory.filter((_, i) => i !== idx))} className="text-red-500 font-extrabold hover:text-red-900">×</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Documents File uploaders */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-50 pb-1">Resume Upload (PDF)</h5>
                      <div className="max-w-md">
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Resume File Upload *</label>
                        <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, setResumeUrl)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs" />
                        {resumeUrl && <span className="text-[10px] text-emerald-700 block mt-1 font-bold">✔ Resume uploaded</span>}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex gap-4 pt-6 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => handleSavePlacementReg(true)}
                        className="flex-1 py-3 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold shadow-sm"
                      >
                        Save Draft Details
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                      >
                        Submit Placement Registration
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Student Matches Tab */}
            {activeTab === "student-matches" && (
              <div className="lg:col-span-12 space-y-6">
                <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-base font-bold text-zinc-900 mb-2">My Matching Drives & Placement Openings</h4>
                  <p className="text-xs text-zinc-500 mb-6">Real-time dynamic rule checking and application statuses</p>

                  {placementMatches.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-10">No drives match or logs found. Please complete and lock your placement registration profile first.</p>
                  ) : (
                    <div className="space-y-4">
                      {placementMatches.map((m) => {
                        const deadlinePassed = new Date() > new Date(m.jobPostingId.applicationDeadline);
                        return (
                          <div key={m._id} className={`border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                            m.isEligible ? "border-emerald-100 bg-emerald-50/20" : "border-red-100 bg-red-50/20"
                          }`}>
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-extrabold text-zinc-900 text-base">{m.jobPostingId.companyName}</h5>
                                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                                  m.isEligible ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {m.isEligible ? "Eligible" : "Ineligible"}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-600"><strong>Role:</strong> {m.jobPostingId.role} | <strong>Type:</strong> {m.jobPostingId.type === "internship" ? "Internship" : "Full-Time"}</p>
                              <p className="text-xs text-zinc-500 leading-relaxed">{m.jobPostingId.description}</p>
                              <p className="text-[10px] text-zinc-400"><strong>Deadline:</strong> {new Date(m.jobPostingId.applicationDeadline).toLocaleString()}</p>

                              {/* Mismatch breakdown list */}
                              {!m.isEligible && (
                                <div className="mt-3 bg-white border border-red-100 rounded-xl p-3 space-y-1 text-xs">
                                  <p className="font-bold text-red-800 text-[10px] uppercase tracking-wider mb-1">Failed Eligibility Rules:</p>
                                  {m.failedConditions.map((cond: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 text-[11px] text-zinc-700">
                                      <span className="text-red-500">❌</span>
                                      <span>{cond.message}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Decisions buttons Column */}
                            <div className="shrink-0 space-y-2 text-right">
                              {m.isEligible ? (
                                <>
                                  {m.studentDecision === "applied" ? (
                                    <div className="space-y-1">
                                      <span className="bg-emerald-600 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl block text-center">
                                        Applied successfully
                                      </span>
                                      {m.applicationResumeUrl && (
                                        <a
                                          href={m.applicationResumeUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline block text-center"
                                        >
                                          📄 View Submitted Resume
                                        </a>
                                      )}
                                    </div>
                                  ) : m.studentDecision === "no-apply" ? (
                                    <span className="bg-zinc-200 text-zinc-500 font-bold text-xs uppercase px-4 py-2 rounded-xl block text-center">Opted-Out</span>
                                  ) : deadlinePassed ? (
                                    <span className="bg-zinc-100 text-zinc-400 font-bold text-xs uppercase px-4 py-2 rounded-xl block text-center">Deadline Passed</span>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                      {/* Drive-Specific Tailored Resume Upload Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setResumeModalJob(m.jobPostingId || null);
                                          setQuickResumeFile(null);
                                          setQuickResumeBase64("");
                                          setQuickResumeSuccess(null);
                                          setShowQuickResumeModal(true);
                                        }}
                                        className="py-1.5 px-3 bg-white border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-zinc-700 hover:text-emerald-900 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
                                        title={`Upload a customized resume exclusively for ${m.jobPostingId.companyName}`}
                                      >
                                        <span>📄</span>
                                        <span>{m.applicationResumeUrl ? "Change Custom Resume" : "Custom Resume"}</span>
                                      </button>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleStudentDecision(m.jobPostingId._id, "no-apply")}
                                          className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl shadow-sm"
                                        >
                                          No Apply
                                        </button>
                                        <button
                                          onClick={() => handleStudentDecision(m.jobPostingId._id, "applied")}
                                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                                        >
                                          Apply Now
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {m.studentDecision === "not-applicable" ? (
                                    <span className="bg-zinc-100 text-zinc-400 font-bold text-xs uppercase px-4 py-2 rounded-xl block text-center">Acknowledged</span>
                                  ) : (
                                    <button
                                      onClick={() => handleAcknowledgeReject(m.jobPostingId._id)}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
                                    >
                                      Acknowledge Rejection / OK
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. ADMIN/FACULTY/PLACEMENT HEAD VIEW */}
        {(userRole === "admin" || userRole === "faculty" || userRole === "placement_head") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Tab: Publish drive */}
            {activeTab === "admin-post" && (
              <>
                {/* Left Rule Builder and Form */}
                <div className="lg:col-span-5 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-5 self-start">
                  <h4 className="text-base font-bold text-zinc-900">Publish Placement Drive & Rules</h4>
                  <form onSubmit={handlePublishJob} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Company Name *</label>
                      <input type="text" required value={postCompanyName} onChange={(e) => setPostCompanyName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Job Role / Designation *</label>
                      <input type="text" required value={postRole} onChange={(e) => setPostRole(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Job Type *</label>
                        <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs">
                          <option value="full-time">Full-Time</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Deadline *</label>
                        <input type="datetime-local" required value={postDeadline} onChange={(e) => setPostDeadline(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Job Description *</label>
                      <textarea required value={postDescription} onChange={(e) => setPostDescription(e.target.value)} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs" />
                    </div>

                    {/* Eligibility Rule Builder */}
                    <div className="border-t border-zinc-100 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider">Dynamic Eligibility Rules</label>
                        <button
                          type="button"
                          onClick={() => setPostRules([...postRules, { field: "cgpa", operator: ">=", value: "" }])}
                          className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded"
                        >
                          + Add Rule
                        </button>
                      </div>
                      <div className="space-y-2">
                        {postRules.map((rule, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={rule.field}
                              onChange={(e) => {
                                const newRules = [...postRules];
                                newRules[idx].field = e.target.value;
                                setPostRules(newRules);
                              }}
                              className="bg-zinc-50 border border-zinc-200 rounded p-1.5 text-[10px] w-28"
                            >
                              <option value="cgpa">CGPA</option>
                              <option value="backlogCount">Backlogs</option>
                              <option value="tenthPercentage">10th %</option>
                              <option value="twelfthPercentage">12th %</option>
                              <option value="twelfthToGraduationGap">12-Grad Gap</option>
                              <option value="overallEducationGap">Overall Gap</option>
                              <option value="branch">Branch</option>
                            </select>
                            <div className="bg-zinc-100 border border-zinc-200 rounded px-2.5 py-1.5 text-[11px] font-black text-emerald-700 select-none flex items-center justify-center min-w-[34px]">
                              &gt;=
                            </div>
                            <input
                              type="text"
                              required
                              value={rule.value}
                              placeholder="Value"
                              onChange={(e) => {
                                const newRules = [...postRules];
                                newRules[idx].value = e.target.value;
                                setPostRules(newRules);
                              }}
                              className="bg-zinc-50 border border-zinc-200 rounded p-1.5 text-[10px] flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => setPostRules(postRules.filter((_, i) => i !== idx))}
                              className="text-red-500 font-extrabold hover:text-red-800 px-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow shadow-emerald-600/25">
                      Publish Placement Drive
                    </button>
                  </form>
                </div>

                {/* Right Active drives summary lists */}
                <div className="lg:col-span-7 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <h4 className="text-base font-bold text-zinc-900">Active Placement Drives & Compilations</h4>
                  <div className="space-y-4">
                    {placementJobs.map((job) => {
                      const passed = new Date() > new Date(job.applicationDeadline);
                      return (
                        <div key={job._id} className="border border-zinc-150 rounded-2xl p-5 bg-zinc-50 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-extrabold text-zinc-900 text-base">{job.companyName}</h5>
                              <p className="text-xs text-zinc-500">{job.role} | {job.type === "internship" ? "Internship" : "Full-Time"}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditJob(job)}
                                className="py-1.5 px-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  setBroadcastModalJob(job);
                                  setBroadcastMessage("");
                                }}
                                className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                              >
                                📢 Alert Candidates
                              </button>
                              <button
                                onClick={() => handleDownloadPdfReport(job._id)}
                                className="py-1.5 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                              >
                                PDF Report
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job._id, job.companyName)}
                                className="py-1.5 px-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-[10px] font-black rounded-lg shadow-sm"
                                title="Delete Drive"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-zinc-600 leading-relaxed">{job.description}</p>
                          
                          <div className="border-t border-zinc-200/50 pt-3 flex justify-between items-center text-[10px] text-zinc-400">
                            <span><strong>Deadline:</strong> {new Date(job.applicationDeadline).toLocaleString()}</span>
                            <span className={`font-bold ${passed ? "text-red-600" : "text-emerald-700"}`}>
                              {passed ? "Deadline Passed (PDF report locked)" : "Active Drive"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Tab: Verify candidate profiles directory (Excel-Like Master Sheet) */}
            {activeTab === "admin-profiles" && (
              <div className="lg:col-span-12 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
                {/* Header & Excel Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-zinc-150">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-emerald-800">Placement Candidates Master Sheet</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                        Excel Table View
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Live directory of students registered & locked for placement drives (Total: {allRegistrations.length})
                    </p>
                  </div>

                  {/* Actions & Export */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* View Switcher */}
                    <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                      <button
                        onClick={() => setCandidateViewMode("table")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          candidateViewMode === "table" ? "bg-white text-emerald-800 shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        <span>📊</span> Sheet View
                      </button>
                      <button
                        onClick={() => setCandidateViewMode("cards")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          candidateViewMode === "cards" ? "bg-white text-emerald-800 shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        <span>🃏</span> Card View
                      </button>
                    </div>

                    <button
                      onClick={fetchAllRegistrations}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                    >
                      🔄 Refresh
                    </button>

                    <button
                      onClick={() => {
                        const filteredData = allRegistrations.filter((reg) => {
                          if (candidateBranchFilter !== "all" && reg.academic?.branch !== candidateBranchFilter) return false;
                          if (candidateStatusFilter !== "all" && reg.status !== candidateStatusFilter) return false;
                          if (candidateZeroBacklogOnly && (reg.academic?.backlogCount || 0) > 0) return false;
                          if (candidateSearchQuery.trim()) {
                            const q = candidateSearchQuery.toLowerCase().trim();
                            const email = (reg.personal?.email || reg.studentId?.email || "").toLowerCase();
                            const name = (reg.personal?.fullName || "").toLowerCase();
                            const roll = (reg.academic?.rollNumber || "").toLowerCase();
                            const branch = (reg.academic?.branch || "").toLowerCase();
                            const phone = (reg.personal?.phone || "").toLowerCase();
                            const addr = (
                              (reg.personal?.currentAddress?.addressLine || "") +
                              " " +
                              (reg.personal?.currentAddress?.city || "") +
                              " " +
                              (reg.personal?.currentAddress?.state || "")
                            ).toLowerCase();
                            return email.includes(q) || name.includes(q) || roll.includes(q) || branch.includes(q) || phone.includes(q) || addr.includes(q);
                          }
                          return true;
                        });
                        handleExportCandidatesCsv(filteredData);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>📥</span> Export to Excel / CSV
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Search Candidates</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, roll, email, phone, address..."
                        className="w-full bg-white border border-zinc-200 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={candidateSearchQuery}
                        onChange={(e) => setCandidateSearchQuery(e.target.value)}
                      />
                      {candidateSearchQuery && (
                        <button
                          onClick={() => setCandidateSearchQuery("")}
                          className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Branch</label>
                    <select
                      value={candidateBranchFilter}
                      onChange={(e) => setCandidateBranchFilter(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 font-semibold"
                    >
                      <option value="all">All Branches</option>
                      {Array.from(new Set(allRegistrations.map((r) => r.academic?.branch).filter(Boolean))).map((b: any) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Status</label>
                    <select
                      value={candidateStatusFilter}
                      onChange={(e) => setCandidateStatusFilter(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 font-semibold"
                    >
                      <option value="all">All Status</option>
                      <option value="locked">🔒 Locked Only</option>
                      <option value="draft">📝 Draft Only</option>
                    </select>
                  </div>

                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer select-none bg-white border border-zinc-200 px-3 py-2 rounded-xl w-full">
                      <input
                        type="checkbox"
                        checked={candidateZeroBacklogOnly}
                        onChange={(e) => setCandidateZeroBacklogOnly(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Zero Backlogs Only</span>
                    </label>
                  </div>
                </div>

                {(() => {
                  let filtered = allRegistrations.filter((reg) => {
                    // Search Query
                    if (candidateSearchQuery.trim()) {
                      const q = candidateSearchQuery.toLowerCase().trim();
                      const email = (reg.personal?.email || reg.studentId?.email || "").toLowerCase();
                      const name = (reg.personal?.fullName || "").toLowerCase();
                      const roll = (reg.academic?.rollNumber || "").toLowerCase();
                      const branch = (reg.academic?.branch || "").toLowerCase();
                      const phone = (reg.personal?.phone || "").toLowerCase();
                      const addr = (
                        (reg.personal?.currentAddress?.addressLine || "") +
                        " " +
                        (reg.personal?.currentAddress?.city || "") +
                        " " +
                        (reg.personal?.currentAddress?.state || "") +
                        " " +
                        (reg.personal?.currentAddress?.pincode || "")
                      ).toLowerCase();

                      if (
                        !email.includes(q) &&
                        !name.includes(q) &&
                        !roll.includes(q) &&
                        !branch.includes(q) &&
                        !phone.includes(q) &&
                        !addr.includes(q)
                      ) {
                        return false;
                      }
                    }

                    // Branch Filter
                    if (candidateBranchFilter !== "all" && reg.academic?.branch !== candidateBranchFilter) {
                      return false;
                    }

                    // Status Filter
                    if (candidateStatusFilter !== "all" && reg.status !== candidateStatusFilter) {
                      return false;
                    }

                    // Zero Backlog Filter
                    if (candidateZeroBacklogOnly && (reg.academic?.backlogCount || 0) > 0) {
                      return false;
                    }

                    return true;
                  });

                  // Sorting
                  if (candidateSortField !== "none") {
                    filtered = [...filtered].sort((a, b) => {
                      let valA: any = 0;
                      let valB: any = 0;
                      if (candidateSortField === "cgpa") {
                        valA = a.academic?.cgpa || 0;
                        valB = b.academic?.cgpa || 0;
                      } else if (candidateSortField === "roll") {
                        valA = (a.academic?.rollNumber || "").toLowerCase();
                        valB = (b.academic?.rollNumber || "").toLowerCase();
                      } else if (candidateSortField === "name") {
                        valA = (a.personal?.fullName || "").toLowerCase();
                        valB = (b.personal?.fullName || "").toLowerCase();
                      }

                      if (valA < valB) return candidateSortOrder === "asc" ? -1 : 1;
                      if (valA > valB) return candidateSortOrder === "asc" ? 1 : -1;
                      return 0;
                    });
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                        <p className="text-sm font-bold text-zinc-600 mb-1">
                          No candidates found matching the selected filters.
                        </p>
                        <p className="text-xs text-zinc-400">
                          Try adjusting search keywords or clearing branch/backlog filters.
                        </p>
                      </div>
                    );
                  }

                  const toggleSort = (field: "cgpa" | "roll" | "name") => {
                    if (candidateSortField === field) {
                      setCandidateSortOrder(candidateSortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setCandidateSortField(field);
                      setCandidateSortOrder("desc");
                    }
                  };

                  const getSortIcon = (field: string) => {
                    if (candidateSortField !== field) return "↕";
                    return candidateSortOrder === "asc" ? "↑" : "↓";
                  };

                  return candidateViewMode === "table" ? (
                    /* EXCEL-LIKE SPREADSHEET TABLE */
                    <div className="overflow-x-auto border border-zinc-200 rounded-2xl shadow-xs bg-white">
                      <table className="w-full text-left text-xs text-zinc-700 border-collapse">
                        <thead className="bg-emerald-800 text-white text-[11px] uppercase tracking-wider font-extrabold sticky top-0 z-10 select-none">
                          <tr>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">#</th>
                            <th
                              onClick={() => toggleSort("roll")}
                              className="py-3 px-3 cursor-pointer hover:bg-emerald-900 border-r border-emerald-700/60 whitespace-nowrap"
                            >
                              Roll No {getSortIcon("roll")}
                            </th>
                            <th
                              onClick={() => toggleSort("name")}
                              className="py-3 px-3 cursor-pointer hover:bg-emerald-900 border-r border-emerald-700/60 whitespace-nowrap"
                            >
                              Student Name {getSortIcon("name")}
                            </th>
                            <th className="py-3 px-3 border-r border-emerald-700/60 whitespace-nowrap">Mail (Email)</th>
                            <th className="py-3 px-3 border-r border-emerald-700/60 whitespace-nowrap">Phone</th>
                            <th className="py-3 px-3 border-r border-emerald-700/60 whitespace-nowrap">Branch</th>
                            <th
                              onClick={() => toggleSort("cgpa")}
                              className="py-3 px-3 text-center cursor-pointer hover:bg-emerald-900 border-r border-emerald-700/60 whitespace-nowrap"
                            >
                              CGPA {getSortIcon("cgpa")}
                            </th>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">Backlogs</th>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">10th %</th>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">12th %</th>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">Gap</th>
                            <th className="py-3 px-3 border-r border-emerald-700/60 min-w-[220px]">Current Address</th>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">Status</th>
                            <th className="py-3 px-3 text-center border-r border-emerald-700/60 whitespace-nowrap">Resume</th>
                            <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150">
                          {filtered.map((reg, idx) => {
                            const email = reg.personal?.email || reg.studentId?.email || "N/A";
                            const phone = reg.personal?.phone || "N/A";
                            const curAddr = reg.personal?.currentAddress
                              ? `${reg.personal.currentAddress.addressLine || ""}, ${reg.personal.currentAddress.city || ""}, ${reg.personal.currentAddress.state || ""} - ${reg.personal.currentAddress.pincode || ""}`
                              : "N/A";
                            const cgpa = typeof reg.academic?.cgpa === "number" ? reg.academic.cgpa.toFixed(2) : reg.academic?.cgpa || "0.00";
                            const backlogs = reg.academic?.backlogCount || 0;

                            return (
                              <tr key={reg._id} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="py-2.5 px-3 text-center text-[11px] text-zinc-400 font-bold border-r border-zinc-150">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 border-r border-zinc-150 whitespace-nowrap">
                                  {reg.academic?.rollNumber || "N/A"}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-zinc-900 border-r border-zinc-150 whitespace-nowrap">
                                  {reg.personal?.fullName || "Student"}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 border-r border-zinc-150 whitespace-nowrap font-mono text-[11px]">
                                  {email}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 border-r border-zinc-150 whitespace-nowrap font-mono text-[11px]">
                                  {phone}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-zinc-700 border-r border-zinc-150 whitespace-nowrap">
                                  {reg.academic?.branch || "N/A"}
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-full font-black text-xs bg-emerald-100 text-emerald-800">
                                    {cgpa}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                                    backlogs === 0 ? "bg-zinc-100 text-zinc-700" : "bg-red-100 text-red-800"
                                  }`}>
                                    {backlogs}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap font-semibold">
                                  {reg.academic?.tenth?.percentage ? `${reg.academic.tenth.percentage}%` : "N/A"}
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap font-semibold">
                                  {reg.academic?.twelfth?.percentage ? `${reg.academic.twelfth.percentage}%` : "N/A"}
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap font-semibold">
                                  {reg.academic?.overallEducationGap || 0} Yrs
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 border-r border-zinc-150 text-[11px] leading-tight min-w-[220px]" title={curAddr}>
                                  {curAddr}
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap">
                                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                                    reg.status === "locked" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {reg.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center border-r border-zinc-150 whitespace-nowrap">
                                  {reg.documents?.resumeUrl ? (
                                    <a
                                      href={reg.documents?.resumeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 bg-white border border-zinc-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold rounded-lg shadow-2xs inline-flex items-center gap-1"
                                    >
                                      📄 PDF
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-zinc-400 italic">None</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => handleLoadStudentRegistrationForAdmin(email)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                                  >
                                    Audit / Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* CARDS VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filtered.map((reg) => {
                        const email = reg.personal?.email || reg.studentId?.email || "N/A";
                        const phone = reg.personal?.phone || "N/A";
                        const curAddr = reg.personal?.currentAddress
                          ? `${reg.personal.currentAddress.addressLine || ""}, ${reg.personal.currentAddress.city || ""}, ${reg.personal.currentAddress.state || ""} - ${reg.personal.currentAddress.pincode || ""}`
                          : "N/A";

                        return (
                          <div key={reg._id} className="border border-zinc-150 rounded-2xl p-5 bg-zinc-50 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-extrabold text-zinc-900 text-base">{reg.personal?.fullName || "Student"}</h5>
                                <p className="text-[11px] text-zinc-500 font-mono">Mail: {email}</p>
                                <p className="text-[11px] text-zinc-500 font-mono">Phone: {phone}</p>
                                <p className="text-[10px] text-zinc-400">Branch: {reg.academic?.branch || "N/A"} | Roll: {reg.academic?.rollNumber || "N/A"}</p>
                              </div>
                              <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${
                                reg.status === "locked" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {reg.status}
                              </span>
                            </div>

                            <div className="bg-white p-2.5 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 space-y-0.5">
                              <p className="text-[10px] uppercase font-black text-zinc-400">Current Address:</p>
                              <p className="line-clamp-2">{curAddr}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold text-zinc-700 bg-white p-3 rounded-xl border border-zinc-200">
                              <div>
                                <p className="text-[10px] text-zinc-400 font-bold mb-0.5">CGPA</p>
                                <p className="text-sm text-zinc-800 font-black">
                                  {typeof reg.academic?.cgpa === "number" ? reg.academic.cgpa.toFixed(2) : reg.academic?.cgpa || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-zinc-400 font-bold mb-0.5">Backlogs</p>
                                <p className="text-sm text-zinc-800 font-black">{reg.academic?.backlogCount || 0}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {reg.documents?.resumeUrl ? (
                                <a href={reg.documents?.resumeUrl} target="_blank" rel="noreferrer" className="flex-1 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-[10px] font-bold rounded-lg text-center shadow-sm">
                                  📄 Resume PDF
                                </a>
                              ) : (
                                <span className="flex-1 py-1.5 bg-zinc-100 text-zinc-400 text-[10px] font-bold rounded-lg text-center">
                                  No Resume
                                </span>
                              )}
                              <button
                                onClick={() => handleLoadStudentRegistrationForAdmin(email)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg shadow-sm"
                              >
                                Audit & Edit Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Admin Audit & edit Modal overlay */}
            {selectedReg && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start pb-4 border-b border-zinc-150">
                    <div>
                      <h4 className="text-lg font-black text-emerald-800">Placement Profile Audit: {selectedReg.personal?.fullName}</h4>
                      <p className="text-xs text-zinc-500">{selectedReg.personal?.email} | Status: <span className="font-bold">{selectedReg.status}</span></p>
                    </div>
                    <button onClick={() => setSelectedReg(null)} className="text-zinc-400 hover:text-zinc-600 text-xl font-bold">×</button>
                  </div>

                  {/* Audit edit log display */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Change logs history:</h5>
                    {selectedReg.editLog?.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic">No admin changes logged yet.</p>
                    ) : (
                      <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto text-[11px]">
                        {selectedReg.editLog.map((log: any, idx: number) => (
                          <div key={idx} className="flex flex-col sm:flex-row justify-between border-b border-zinc-100 pb-1 gap-1">
                            <span className="text-zinc-600">
                              <strong>Field:</strong> <code className="bg-zinc-200 px-1 rounded">{log.field}</code> edited by <strong>{log.editedBy}</strong>
                            </span>
                            <span className="text-zinc-400 shrink-0">
                              {log.oldValue} ➔ {log.newValue} ({new Date(log.editedAt).toLocaleString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form toggle */}
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Configure Overrides</h5>
                    <button
                      onClick={() => setShowAdminEditForm(!showAdminEditForm)}
                      className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-1 rounded font-bold"
                    >
                      {showAdminEditForm ? "Cancel overrides" : "Edit Profile Overrides"}
                    </button>
                  </div>

                  {showAdminEditForm ? (
                    // Admin override edits form fields
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 text-xs">
                      <div>
                        <label className="block text-zinc-500 mb-1 font-bold">Name Override</label>
                        <input
                          type="text"
                          defaultValue={selectedReg.personal?.fullName}
                          onChange={(e) => setAdminEdits({ ...adminEdits, "personal.fullName": e.target.value })}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1 font-bold">Override CGPA</label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={selectedReg.academic?.cgpa}
                          onChange={(e) => setAdminEdits({ ...adminEdits, "academic.cgpa": parseFloat(e.target.value) })}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1 font-bold">Override Backlogs</label>
                        <input
                          type="number"
                          defaultValue={selectedReg.academic?.backlogCount}
                          onChange={(e) => setAdminEdits({ ...adminEdits, "academic.backlogCount": parseInt(e.target.value) })}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3 text-right">
                        <button
                          onClick={handleAdminUpdateRegistration}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                        >
                          Save changes override
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Render current registration details in modal
                    <div className="grid grid-cols-2 gap-4 text-xs border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                      <p><strong>APAAR ID:</strong> {selectedReg.identity?.apaarId}</p>
                      <p><strong>Roll Number:</strong> {selectedReg.academic?.rollNumber}</p>
                      <p><strong>Enrollment Number:</strong> {selectedReg.academic?.enrollmentNumber}</p>
                      <p><strong>Branch:</strong> {selectedReg.academic?.branch}</p>
                      <p><strong>Calculated CGPA:</strong> {selectedReg.academic?.cgpa?.toFixed(2)}</p>
                      <p><strong>Backlogs Count:</strong> {selectedReg.academic?.backlogCount}</p>
                      <p><strong>Phone:</strong> {selectedReg.personal?.phone || "N/A"}</p>
                      <p><strong>Email:</strong> {selectedReg.personal?.email || selectedReg.studentId?.email || "N/A"}</p>
                      <p className="col-span-2"><strong>Current Address:</strong> {selectedReg.personal?.currentAddress ? `${selectedReg.personal.currentAddress.addressLine || ""}, ${selectedReg.personal.currentAddress.city || ""}, ${selectedReg.personal.currentAddress.state || ""} - ${selectedReg.personal.currentAddress.pincode || ""}` : "N/A"}</p>
                      <p className="col-span-2"><strong>Education gaps:</strong> 10-12: {selectedReg.academic?.tenthToTwelfthGap} Yrs | 12-Grad: {selectedReg.academic?.twelfthToGraduationGap} Yrs | Overall: {selectedReg.academic?.overallEducationGap} Yrs</p>
                    </div>
                  )}

                  <div className="text-right pt-4 border-t border-zinc-150">
                    <button onClick={() => setSelectedReg(null)} className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl shadow-sm">
                      Close Panel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. NOTIFICATIONS & ALERTS TAB */}
        {activeTab === "notifications" && (
          userRole === "student" ? (
            /* STUDENT NOTIFICATIONS LIST */
            <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-150">
                <div>
                  <h4 className="text-lg font-black text-emerald-800">Placement Alerts & Notifications</h4>
                  <p className="text-xs text-zinc-500 mt-1">Real-time drive alerts, eligibility confirmations, and faculty announcements</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={handleMarkAllNotifsRead}
                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all shadow-sm"
                    >
                      ✔ Mark All as Read
                    </button>
                  )}
                  <button
                    onClick={fetchNotifications}
                    className="py-1.5 px-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-200 transition-all shadow-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 space-y-3">
                  <span className="text-4xl block">🔔</span>
                  <p className="text-sm font-bold">No notifications yet</p>
                  <p className="text-xs">When placement drives or faculty announcements match your profile, alerts will appear here in real time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => {
                    const isUnread = !n.isRead;
                    const typeIcon =
                      n.type === "shortlist_announcement" ? "🎯" :
                      n.type === "placement_drive" ? "💼" :
                      n.type === "application_status" ? "📄" :
                      n.type === "custom_alert" ? "📢" :
                      n.type === "eligibility_alert" ? "⚠️" : "🔔";

                    return (
                      <div
                        key={n._id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          n.type === "shortlist_announcement"
                            ? "bg-amber-50/40 border-amber-300 shadow-sm"
                            : isUnread
                            ? "bg-emerald-50/50 border-emerald-300 shadow-sm"
                            : "bg-white border-zinc-150 hover:border-zinc-250"
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-2xl p-2 bg-white rounded-xl border border-zinc-150 shadow-xs shrink-0">
                            {typeIcon}
                          </span>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                                n.type === "shortlist_announcement"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300 font-black"
                                  : (n.source === "faculty" && n.type !== "placement_drive")
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {n.type === "shortlist_announcement"
                                  ? "🎯 Shortlist Notice"
                                  : (n.source === "faculty" && n.type !== "placement_drive")
                                  ? "Faculty Alert"
                                  : "System Alert"}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                              )}
                            </div>
                            {n.title && (
                              <h6 className="text-xs font-black text-zinc-900">{n.title}</h6>
                            )}
                            <p className="text-xs font-bold text-zinc-800 leading-relaxed break-words whitespace-pre-wrap">
                              {n.message}
                            </p>
                            {n.jobPostingId && (
                              <p className="text-[11px] text-zinc-500 font-semibold">
                                Drive: {n.jobPostingId.companyName} — {n.jobPostingId.role}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                          {userRole === "student" && (() => {
                            const jId = n.jobPostingId?._id || n.jobPostingId;
                            const matchItem = jId
                              ? placementMatches.find(
                                  (m) => (m.jobPostingId?._id || m.jobPostingId) === jId
                                )
                              : null;
                            const isAlreadyApplied =
                              matchItem?.studentDecision === "applied" ||
                              n.message?.toLowerCase().includes("already registered");

                            return (
                              <>
                                {/* Show Update Resume only if candidate has NOT applied yet */}
                                {!isAlreadyApplied && (
                                  <button
                                    onClick={() => {
                                      setResumeModalJob(n.jobPostingId || null);
                                      setQuickResumeFile(null);
                                      setQuickResumeBase64("");
                                      setQuickResumeSuccess(null);
                                      setShowQuickResumeModal(true);
                                    }}
                                    className="py-1.5 px-3 bg-white border border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-zinc-700 hover:text-emerald-900 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
                                    title="Update or revise your placement resume before applying"
                                  >
                                    <span>📄</span> Update Resume
                                  </button>
                                )}

                                {n.jobPostingId && (
                                  isAlreadyApplied ? (
                                    <button
                                      onClick={() => {
                                        if (isUnread) handleMarkNotifRead(n._id);
                                        setActiveTab("student-matches");
                                      }}
                                      className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5"
                                    >
                                      <span className="text-emerald-600">✔</span> Already Applied
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (isUnread) handleMarkNotifRead(n._id);
                                        setActiveTab("student-matches");
                                      }}
                                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                      View & Apply ➔
                                    </button>
                                  )
                                )}
                              </>
                            );
                          })()}

                          {isUnread && (
                            <button
                              onClick={() => handleMarkNotifRead(n._id)}
                              className="py-1.5 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl shadow-sm"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* FACULTY / ADMIN VIEW: PLACEMENT COMMUNICATION & ACTIVITY CENTER */
            <div className="space-y-6">
              {/* Header Card with Navigation Pills */}
              <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-150">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-black text-emerald-800">Placement Communication & Activity Center</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                        Faculty Hub
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Conduct candidate announcements (shortlists, notices, reminders), inspect sent broadcast logs, and monitor live student activities.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        fetchBroadcasts();
                        fetchActivityFeed();
                      }}
                      className="py-1.5 px-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-200 transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200 gap-1 flex-wrap">
                  <button
                    onClick={() => setBroadcastSubTab("compose")}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
                      broadcastSubTab === "compose"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <span>✍️</span> Conduct Announcement
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastSubTab("history");
                      fetchBroadcasts();
                    }}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
                      broadcastSubTab === "history"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <span>📨</span> Sent Broadcasts History ({broadcastsList.length})
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastSubTab("activity");
                      fetchActivityFeed();
                    }}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${
                      broadcastSubTab === "activity"
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <span>⚡</span> Live Student Activity Feed ({activityFeed.length})
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: COMPOSE ANNOUNCEMENT */}
              {broadcastSubTab === "compose" && (
                <div className="bg-white border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h5 className="text-base font-black text-emerald-800">Compose & Dispatch Announcement</h5>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Messages dispatched here will immediately appear in students' notifications in real time.
                    </p>
                  </div>

                  <form onSubmit={handleSendCustomBroadcast} className="space-y-6">
                    {/* Announcement Category Selector */}
                    <div>
                      <label className="block text-xs font-black uppercase text-zinc-400 mb-2">1. Select Announcement Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setBroadcastType("shortlist")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            broadcastType === "shortlist"
                              ? "bg-amber-50/70 border-amber-400 shadow-sm"
                              : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="text-xl mb-1">🎯</div>
                          <p className="font-extrabold text-xs text-zinc-900">Shortlist Announcement</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Announce candidates shortlisted for interview/exam rounds</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBroadcastType("general")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            broadcastType === "general"
                              ? "bg-emerald-50/70 border-emerald-400 shadow-sm"
                              : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="text-xl mb-1">📢</div>
                          <p className="font-extrabold text-xs text-zinc-900">General Placement Notice</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">PPT schedules, timing changes, policy or venue updates</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBroadcastType("reminder")}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            broadcastType === "reminder"
                              ? "bg-indigo-50/70 border-indigo-400 shadow-sm"
                              : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="text-xl mb-1">⏰</div>
                          <p className="font-extrabold text-xs text-zinc-900">Urgent Drive Reminder</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Remind candidates to apply or submit documents before deadline</p>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Announcement Title / Subject *</label>
                      <input
                        type="text"
                        required
                        placeholder={
                          broadcastType === "shortlist"
                            ? "e.g. TCS Technical Interview Round 1 Shortlist"
                            : broadcastType === "reminder"
                            ? "e.g. Urgent: Infosys Application Deadline Ending at 5 PM"
                            : "e.g. Pre-Placement Talk Venue & Timing Update"
                        }
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase text-zinc-400">2. Target Audience (Recipients)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          broadcastTarget === "all_registered" ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                        }`}>
                          <input
                            type="radio"
                            name="broadcastTarget"
                            value="all_registered"
                            checked={broadcastTarget === "all_registered"}
                            onChange={() => setBroadcastTarget("all_registered")}
                            className="text-emerald-600"
                          />
                          <span className="text-xs">All Registered Students ({allRegistrations.length})</span>
                        </label>

                        <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          broadcastTarget === "drive_candidates" ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                        }`}>
                          <input
                            type="radio"
                            name="broadcastTarget"
                            value="drive_candidates"
                            checked={broadcastTarget === "drive_candidates"}
                            onChange={() => setBroadcastTarget("drive_candidates")}
                            className="text-emerald-600"
                          />
                          <span className="text-xs">Drive Candidates</span>
                        </label>

                        <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          broadcastTarget === "selected_students" ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" : "bg-zinc-50 border-zinc-200 text-zinc-700"
                        }`}>
                          <input
                            type="radio"
                            name="broadcastTarget"
                            value="selected_students"
                            checked={broadcastTarget === "selected_students"}
                            onChange={() => setBroadcastTarget("selected_students")}
                            className="text-emerald-600"
                          />
                          <span className="text-xs">Selected Shortlist Candidates</span>
                        </label>
                      </div>

                      {/* If Target is Drive Candidates */}
                      {broadcastTarget === "drive_candidates" && (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700">Select Placement Drive *</label>
                          <select
                            required
                            value={broadcastJobId}
                            onChange={(e) => setBroadcastJobId(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900"
                          >
                            <option value="">-- Choose Placement Drive --</option>
                            {placementJobs.map((j) => (
                              <option key={j._id} value={j._id}>
                                {j.companyName} — {j.role} ({j.type})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* If Target is Selected Shortlisted Candidates */}
                      {broadcastTarget === "selected_students" && (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-zinc-800">Pick Shortlisted Candidates ({broadcastSelectedRolls.length} Selected)</p>
                              <p className="text-[10px] text-zinc-400">Click candidates below to toggle them into the shortlist broadcast list</p>
                            </div>
                            {broadcastSelectedRolls.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setBroadcastSelectedRolls([])}
                                className="text-[10px] text-red-600 font-bold hover:underline"
                              >
                                Clear Selection
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder="Filter candidates by name, roll, or email..."
                            value={studentSearchForBroadcast}
                            onChange={(e) => setStudentSearchForBroadcast(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800"
                          />

                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                            {allRegistrations
                              .filter((r) => {
                                if (!studentSearchForBroadcast.trim()) return true;
                                const q = studentSearchForBroadcast.toLowerCase();
                                const name = (r.personal?.fullName || "").toLowerCase();
                                const roll = (r.academic?.rollNumber || "").toLowerCase();
                                const email = (r.personal?.email || r.studentId?.email || "").toLowerCase();
                                return name.includes(q) || roll.includes(q) || email.includes(q);
                              })
                              .map((reg) => {
                                const id = reg.studentId?._id || reg.studentId || reg.personal?.email;
                                const isSelected = broadcastSelectedRolls.includes(id);

                                return (
                                  <div
                                    key={reg._id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setBroadcastSelectedRolls(broadcastSelectedRolls.filter((s) => s !== id));
                                      } else {
                                        setBroadcastSelectedRolls([...broadcastSelectedRolls, id]);
                                      }
                                    }}
                                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                        : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                                    }`}
                                  >
                                    <div className="text-xs">
                                      <span>{reg.personal?.fullName || "Student"}</span>
                                      <span className="text-[10px] text-zinc-400 font-mono ml-2">({reg.academic?.rollNumber || "No Roll"})</span>
                                      <span className="text-[10px] text-zinc-400 ml-2">{reg.academic?.branch}</span>
                                    </div>
                                    <span className="text-xs">{isSelected ? "✔ Selected" : "+ Add"}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Box */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Announcement Message *</label>
                      <textarea
                        rows={5}
                        required
                        placeholder={
                          broadcastType === "shortlist"
                            ? "Congratulations to the following candidates shortlisted for Round 1 Technical Interview tomorrow at 10:00 AM in Lab 3:\n- [Candidate Names/Rolls]\nPlease report in formal attire with 2 copies of your updated resume and college ID."
                            : "Write the details of the announcement here..."
                        }
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans leading-relaxed"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingBroadcast}
                        className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
                      >
                        {isSubmittingBroadcast ? "Dispatching Broadcast..." : "🚀 Dispatch Announcement to Students"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-tab 2: SENT BROADCASTS HISTORY */}
              {broadcastSubTab === "history" && (
                <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
                    <div>
                      <h5 className="text-base font-black text-emerald-800">Sent Broadcasts & Announcements Log</h5>
                      <p className="text-xs text-zinc-400">Chronological history of notices dispatched by faculty</p>
                    </div>
                    <button
                      onClick={fetchBroadcasts}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      🔄 Refresh Log
                    </button>
                  </div>

                  {broadcastsList.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50 space-y-2">
                      <span className="text-3xl block">📨</span>
                      <p className="text-sm font-bold text-zinc-600">No broadcasts dispatched yet</p>
                      <p className="text-xs text-zinc-400">
                        Use the "Conduct Announcement" tab to send your first shortlist notice or reminder.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {broadcastsList.map((b) => (
                        <div key={b._id} className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                                b.broadcastType === "shortlist"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : b.broadcastType === "reminder"
                                  ? "bg-indigo-100 text-indigo-900"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {b.broadcastType === "shortlist" ? "🎯 Shortlist" : b.broadcastType === "reminder" ? "⏰ Reminder" : "📢 Notice"}
                              </span>
                              <h6 className="font-extrabold text-sm text-zinc-900">{b.title}</h6>
                              {b.jobTitle && (
                                <span className="text-[11px] text-zinc-500 font-semibold bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                                  {b.jobTitle}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {new Date(b.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="bg-white border border-zinc-150 rounded-xl p-3.5 text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed font-sans">
                            {b.message}
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2 pt-1 border-t border-zinc-100">
                            <div>
                              <strong>Target:</strong> {b.targetType === "all_registered" ? "All Registered Students" : b.targetType === "drive_candidates" ? "Drive Candidates" : "Selected Students"} ({b.recipientCount} recipient(s))
                            </div>
                            {b.recipientsSummary && b.recipientsSummary.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {b.recipientsSummary.map((s: string, idx: number) => (
                                  <span key={idx} className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: LIVE STUDENT ACTIVITY FEED */}
              {broadcastSubTab === "activity" && (
                <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
                    <div>
                      <h5 className="text-base font-black text-emerald-800">Live Student Placement Activity Stream</h5>
                      <p className="text-xs text-zinc-400">Real-time audit log of student registrations, profile updates, and drive applications</p>
                    </div>
                    <button
                      onClick={fetchActivityFeed}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      🔄 Refresh Stream
                    </button>
                  </div>

                  {activityFeed.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50 space-y-2">
                      <span className="text-3xl block">⚡</span>
                      <p className="text-sm font-bold text-zinc-600">No student activity logged yet</p>
                      <p className="text-xs text-zinc-400">
                        When students lock placement profiles, update resumes/CGPA, or apply to drives, activities will stream here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activityFeed.map((act) => {
                        const icon =
                          act.type === "profile_locked" ? "🔒" :
                          act.type === "job_applied" ? "📄" :
                          act.type === "profile_updated" ? "🔄" : "📢";

                        const badgeColor =
                          act.type === "profile_locked" ? "bg-emerald-100 text-emerald-800" :
                          act.type === "job_applied" ? "bg-blue-100 text-blue-800" :
                          act.type === "profile_updated" ? "bg-purple-100 text-purple-800" :
                          "bg-amber-100 text-amber-800";

                        return (
                          <div key={act._id} className="p-4 rounded-2xl border border-zinc-150 bg-zinc-50/60 flex items-start gap-3.5 hover:border-zinc-250 transition-all">
                            <span className="text-xl p-2 bg-white rounded-xl border border-zinc-200 shadow-2xs shrink-0">
                              {icon}
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${badgeColor}`}>
                                    {act.type.replace("_", " ")}
                                  </span>
                                  <span className="font-extrabold text-xs text-zinc-900">{act.actorName}</span>
                                  {act.rollNumber && (
                                    <span className="text-[10px] font-mono text-zinc-400">({act.rollNumber})</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-400 font-medium">
                                  {new Date(act.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                                {act.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* BROADCAST ALERT MODAL FOR FACULTY / ADMIN */}
        {broadcastModalJob && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-emerald-100 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                <div>
                  <h4 className="text-base font-black text-emerald-800">Broadcast Alert to Eligible Candidates</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Drive: <strong>{broadcastModalJob.companyName}</strong> ({broadcastModalJob.role})
                  </p>
                </div>
                <button
                  onClick={() => setBroadcastModalJob(null)}
                  className="text-zinc-400 hover:text-zinc-700 font-black text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700">Alert Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. PPT scheduled for tomorrow at 10 AM in Auditorium 2. Bring 2 hard copies of your resume."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-zinc-400">
                  This notification will be immediately dispatched to every student matching the eligibility criteria for this drive.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setBroadcastModalJob(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={broadcastSending || !broadcastMessage.trim()}
                  onClick={handleSendBroadcast}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {broadcastSending ? "Dispatching..." : "Send Broadcast Alert 📢"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PLACEMENT DRIVE MODAL FOR FACULTY / ADMIN */}
        {editingJob && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 space-y-5">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                <div>
                  <h4 className="text-base font-black text-emerald-800">Edit Placement Drive</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Modifying rules will automatically re-evaluate all students and dispatch alerts to newly eligible candidates.
                  </p>
                </div>
                <button
                  onClick={() => setEditingJob(null)}
                  className="text-zinc-400 hover:text-zinc-700 font-black text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Role / Designation *</label>
                    <input
                      type="text"
                      required
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Type *</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="full-time">Full-Time</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Application Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Drive Description / Details *</label>
                  <textarea
                    rows={4}
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Eligibility Rules Builder */}
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h6 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Eligibility Criteria Rules</h6>
                      <p className="text-[10px] text-zinc-400">Tip: Use &gt;= for CGPA and percentage so higher-scoring students qualify!</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditRules([...editRules, { field: "cgpa", operator: ">=", value: "" }])}
                      className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg"
                    >
                      + Add Rule
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editRules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          value={rule.field}
                          onChange={(e) => {
                            const newR = [...editRules];
                            newR[idx].field = e.target.value;
                            setEditRules(newR);
                          }}
                          className="bg-white border border-zinc-200 rounded-lg p-1.5 text-xs w-32 font-medium"
                        >
                          <option value="cgpa">CGPA</option>
                          <option value="backlogCount">Backlogs</option>
                          <option value="tenthPercentage">10th %</option>
                          <option value="twelfthPercentage">12th %</option>
                          <option value="twelfthToGraduationGap">12-Grad Gap</option>
                          <option value="overallEducationGap">Overall Gap</option>
                          <option value="branch">Branch</option>
                        </select>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-black text-emerald-800 select-none flex items-center justify-center min-w-[38px]">
                          &gt;=
                        </div>
                        <input
                          type="text"
                          required
                          value={rule.value}
                          placeholder="Value (e.g. 7.0, 0, 60)"
                          onChange={(e) => {
                            const newR = [...editRules];
                            newR[idx].value = e.target.value;
                            setEditRules(newR);
                          }}
                          className="bg-white border border-zinc-200 rounded-lg p-1.5 text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setEditRules(editRules.filter((_, i) => i !== idx))}
                          className="text-red-500 font-extrabold hover:text-red-800 px-2 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {editRules.length === 0 && (
                      <p className="text-xs text-zinc-400 italic">No rules specified. Every student will be considered eligible.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {loading ? "Updating..." : "Save & Re-Match Candidates 💾"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QUICK RESUME UPLOAD MODAL FOR STUDENTS (Supports Master or Company-Specific Tailored Resumes) */}
        {showQuickResumeModal && (() => {
          const modalTargetJobId = resumeModalJob?._id || resumeModalJob;
          const currentMatchForModal = modalTargetJobId
            ? placementMatches.find((m: any) => (m.jobPostingId?._id || m.jobPostingId) === modalTargetJobId)
            : null;
          const tailoredDriveResumeUrl = currentMatchForModal?.applicationResumeUrl;

          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-emerald-100 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-emerald-50 rounded-xl text-lg border border-emerald-200">
                      {resumeModalJob ? "🏢" : "📄"}
                    </span>
                    <div>
                      <h4 className="text-base font-black text-emerald-800">
                        {resumeModalJob
                          ? `Custom Resume for ${resumeModalJob.companyName || "Company"}`
                          : "Update Placement Profile Resume"}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {resumeModalJob
                          ? `Drive: ${resumeModalJob.companyName || "Placement Drive"} (${resumeModalJob.role || "Role"})`
                          : "Upload a revised resume for your placement master profile"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuickResumeModal(false)}
                    className="text-zinc-400 hover:text-zinc-700 font-black text-lg p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Company-Specific Notice Callout */}
                {resumeModalJob && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-amber-900">
                      <span>🔒</span>
                      <span>Company-Specific Tailored Resume</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      This resume is submitted <strong>exclusively for {resumeModalJob.companyName}</strong>. Your Master Placement Profile resume and applications for other companies remain completely safe and untouched!
                    </p>
                  </div>
                )}

                {/* Resume Status Card */}
                {resumeModalJob ? (
                  tailoredDriveResumeUrl ? (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                          Custom Tailored Resume Active
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✔ Exclusively for {resumeModalJob.companyName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                          📄 Tailored_{resumeModalJob.companyName}_Resume.pdf
                        </span>
                        <a
                          href={tailoredDriveResumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-black hover:underline flex items-center gap-1"
                        >
                          👁️ View Custom PDF
                        </a>
                      </div>
                      {resumeUrl && (
                        <div className="border-t border-emerald-100 pt-2 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Master Profile Resume (Safe):</span>
                          <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-zinc-900 underline font-semibold">
                            View Master
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Default Profile Resume</span>
                        {resumeUrl && (
                          <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200/70 px-2 py-0.5 rounded-full">
                            Fallback Default
                          </span>
                        )}
                      </div>
                      {resumeUrl ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-semibold text-zinc-700 truncate max-w-[200px]">
                            📄 Placement_Resume.pdf
                          </span>
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1"
                          >
                            👁️ View Master Resume
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">No master resume uploaded in profile yet.</p>
                      )}
                      <p className="text-[10px] text-zinc-400 pt-1">
                        Uploading below will attach a tailored resume <strong>only for {resumeModalJob.companyName}</strong>.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Current Master Resume</span>
                      {resumeUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✔ Linked to Profile
                        </span>
                      )}
                    </div>
                    {resumeUrl ? (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-zinc-700 truncate max-w-[200px]">
                          📄 Placement_Resume.pdf
                        </span>
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1"
                        >
                          👁️ View Current
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No resume uploaded in profile yet.</p>
                    )}
                  </div>
                )}

                {/* File Upload Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    {resumeModalJob
                      ? `Select PDF Resume Tailored for ${resumeModalJob.companyName} *`
                      : "Choose New PDF Resume *"}
                  </label>
                  <div className="border-2 border-dashed border-zinc-250 hover:border-emerald-400 rounded-2xl p-4 text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-emerald-50/30 relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type !== "application/pdf") {
                          alert("Only PDF files are supported for resumes.");
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File size exceeds 5MB limit.");
                          return;
                        }
                        setQuickResumeFile(file);
                        setQuickResumeSuccess(null);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setQuickResumeBase64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-1">
                      <span className="text-2xl block">📁</span>
                      {quickResumeFile ? (
                        <div>
                          <p className="text-xs font-black text-emerald-800">{quickResumeFile.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            {(quickResumeFile.size / 1024).toFixed(1)} KB • Ready to upload
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-zinc-700">Click to browse or drop your PDF here</p>
                          <p className="text-[10px] text-zinc-400">PDF up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {quickResumeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <span>✅</span>
                    <span>{quickResumeSuccess}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowQuickResumeModal(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-800 rounded-xl transition-all"
                  >
                    {quickResumeSuccess ? "Close" : "Cancel"}
                  </button>
                  {quickResumeSuccess && resumeModalJob ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickResumeModal(false);
                        setActiveTab("student-matches");
                      }}
                      className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      Proceed to Apply ➔
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuickResumeUpload}
                      disabled={!quickResumeBase64 || isUploadingQuickResume}
                      className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      {isUploadingQuickResume ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span>
                          <span>
                            {resumeModalJob
                              ? `Save for ${resumeModalJob.companyName || "Drive"} Only`
                              : "Upload & Save to Profile"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
