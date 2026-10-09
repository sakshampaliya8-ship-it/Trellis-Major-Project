"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BACKEND_URL } from "@/config/api";

export default function EventsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Active top-level tab: "events", "publish", or "notices"
  const [activeTab, setActiveTab] = useState<"events" | "publish" | "notices">("events");

  // Dates
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState(getTodayStr());
  const [eventDeadline, setEventDeadline] = useState(getTodayStr());
  const [eventMaxPart, setEventMaxPart] = useState("100");

  // Event poster states (Publish form)
  const [eventPosterFile, setEventPosterFile] = useState<File | null>(null);
  const [eventPosterPreview, setEventPosterPreview] = useState<string | null>(null);
  const [eventPosterUrlInput, setEventPosterUrlInput] = useState<string>("");
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Full-size poster viewing modal (for students, faculty, and admins)
  const [viewingPoster, setViewingPoster] = useState<{ url: string; title: string } | null>(null);

  // Update poster modal for existing events (Faculty / Admin)
  const [eventForPosterUpdate, setEventForPosterUpdate] = useState<any | null>(null);
  const [updatePosterFile, setUpdatePosterFile] = useState<File | null>(null);
  const [updatePosterPreview, setUpdatePosterPreview] = useState<string | null>(null);
  const [updatePosterUrlInput, setUpdatePosterUrlInput] = useState<string>("");
  const [savingUpdatedPoster, setSavingUpdatedPoster] = useState(false);

  // Notices state
  const [notices, setNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticeSearch, setNoticeSearch] = useState("");
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState("all");
  const [showCreateNoticeModal, setShowCreateNoticeModal] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeCategory, setNewNoticeCategory] = useState("general");
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);

  // Participant Roster modal states (Faculty / Admin)
  const [selectedEventRoster, setSelectedEventRoster] = useState<any | null>(null);
  const [rosterParticipants, setRosterParticipants] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilterAttended, setRosterFilterAttended] = useState<"all" | "present" | "absent">("all");

  // Announce Event Winners / Results modal states (Faculty / Admin)
  const [eventForWinners, setEventForWinners] = useState<any | null>(null);
  const [eventAttendeesForWinners, setEventAttendeesForWinners] = useState<any[]>([]);
  const [loadingAttendeesForWinners, setLoadingAttendeesForWinners] = useState(false);
  const [winnerEntries, setWinnerEntries] = useState<Array<{
    position: string;
    studentName: string;
    rollNumber: string;
    branch: string;
    semester: number;
    email: string;
    contact: string;
    prize: string;
  }>>([
    { position: "Winner (1st Place)", studentName: "", rollNumber: "", branch: "", semester: 1, email: "", contact: "", prize: "1st Prize Trophy & Certificate" },
    { position: "Runner Up (2nd Place)", studentName: "", rollNumber: "", branch: "", semester: 1, email: "", contact: "", prize: "Runner Up Shield & Certificate" }
  ]);
  const [customNoticeText, setCustomNoticeText] = useState("");
  const [submittingWinners, setSubmittingWinners] = useState(false);

  // Student Profile & Registration Form Modal states
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [eventToRegister, setEventToRegister] = useState<any | null>(null);
  const [regName, setRegName] = useState("");
  const [regRoll, setRegRoll] = useState("");
  const [regBranch, setRegBranch] = useState("");
  const [regSemester, setRegSemester] = useState<number | string>(1);
  const [regEmail, setRegEmail] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccessMessage, setRegSuccessMessage] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUserId(data.user._id || data.user.id);
            setCurrentUserEmail(data.user.email || "");
          }
          if (data.success && data.profile) {
            setCurrentUserProfile(data.profile);
          }
        })
        .catch((err) => console.error("Error fetching user info:", err));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchNotices();
    }
  }, [token]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotices = async () => {
    setNoticesLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/notices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setNotices(data.notices || []);
    } catch (err) {
      console.error("Error fetching notices:", err);
    } finally {
      setNoticesLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const response = await fetch(`${BACKEND_URL}/api/upload-file`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileType: "image"
            })
          });
          const data = await response.json();
          if (data.success) {
            resolve(data.url);
          } else {
            reject(new Error(data.message || "Poster upload failed"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Poster file size must be less than 5MB");
        return;
      }
      setEventPosterFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setEventPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePoster = () => {
    setEventPosterFile(null);
    setEventPosterPreview(null);
    setEventPosterUrlInput("");
  };

  const handleUpdatePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Poster file size must be less than 5MB");
        return;
      }
      setUpdatePosterFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUpdatePosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openPosterUpdateModal = (event: any) => {
    setEventForPosterUpdate(event);
    setUpdatePosterFile(null);
    setUpdatePosterPreview(event.posterUrl || null);
    setUpdatePosterUrlInput(event.posterUrl || "");
  };

  const handleSaveUpdatedPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForPosterUpdate) return;
    setSavingUpdatedPoster(true);

    try {
      let finalPosterUrl = updatePosterUrlInput.trim();
      if (updatePosterFile) {
        finalPosterUrl = await uploadFile(updatePosterFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/events/${eventForPosterUpdate._id}/poster`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          posterUrl: finalPosterUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Event poster updated successfully!");
        setEventForPosterUpdate(null);
        setUpdatePosterFile(null);
        setUpdatePosterPreview(null);
        setUpdatePosterUrlInput("");
        fetchEvents();
      } else {
        alert(data.message || "Failed to update poster");
      }
    } catch (err: any) {
      alert(err.message || "Error updating event poster.");
    } finally {
      setSavingUpdatedPoster(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventVenue || !eventDate || !eventDeadline) {
      alert("Please fill in required fields");
      return;
    }
    setLoading(true);
    setUploadingPoster(true);

    const deadlineObj = new Date(eventDeadline);
    deadlineObj.setHours(23, 59, 59, 999);

    try {
      let finalPosterUrl = eventPosterUrlInput.trim();
      if (eventPosterFile) {
        finalPosterUrl = await uploadFile(eventPosterFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDesc,
          venue: eventVenue,
          date: new Date(eventDate),
          registrationDeadline: deadlineObj,
          maxParticipants: parseInt(eventMaxPart) || 100,
          posterUrl: finalPosterUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Event created successfully!");
        setEventTitle("");
        setEventDesc("");
        setEventVenue("");
        setEventDate(getTodayStr());
        setEventDeadline(getTodayStr());
        setEventMaxPart("100");
        setEventPosterFile(null);
        setEventPosterPreview(null);
        setEventPosterUrlInput("");
        fetchEvents();
        setActiveTab("events");
      } else {
        alert(data.message || "Failed to create event");
      }
    } catch (err: any) {
      alert(err.message || "Error creating event.");
    } finally {
      setLoading(false);
      setUploadingPoster(false);
    }
  };

  const openRegistrationModal = (event: any) => {
    setEventToRegister(event);
    setRegError("");
    setRegSuccessMessage("");
    setRegName(currentUserProfile?.name || "");
    setRegRoll(currentUserProfile?.rollNumber || "");
    setRegBranch(currentUserProfile?.branch || "");
    setRegSemester(currentUserProfile?.semester || 1);
    setRegEmail(currentUserEmail || "");
    setRegContact(currentUserProfile?.contact || "");
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventToRegister) return;
    if (!regName.trim()) {
      setRegError("Full Name is required.");
      return;
    }
    if (!regRoll.trim()) {
      setRegError("Enrollment Number is required.");
      return;
    }
    if (!regContact.trim()) {
      setRegError("Please provide a valid Mobile / Contact Number for event coordination.");
      return;
    }

    setRegSubmitting(true);
    setRegError("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventToRegister._id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: regName.trim(),
          rollNumber: regRoll.trim(),
          branch: regBranch.trim(),
          semester: regSemester,
          contact: regContact.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        setRegSuccessMessage(`🎉 You're registered! A seat for "${eventToRegister.title}" has been reserved for you.`);
        fetchEvents();
        if (currentUserProfile) {
          setCurrentUserProfile({ ...currentUserProfile, contact: regContact.trim() });
        }
        setTimeout(() => {
          setEventToRegister(null);
          setRegSuccessMessage("");
        }, 1800);
      } else {
        setRegError(data.message || "Failed to register for event.");
      }
    } catch (err) {
      setRegError("Error submitting registration. Please verify connection.");
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to remove the event "${eventTitle}"?`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert("Event removed successfully!");
        fetchEvents();
      } else {
        alert(data.message || "Failed to remove event.");
      }
    } catch (err) {
      alert("Error removing event.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewParticipants = async (event: any) => {
    setSelectedEventRoster(event);
    setRosterLoading(true);
    setRosterSearch("");
    setRosterFilterAttended("all");
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${event._id}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRosterParticipants(data.participants || []);
      } else {
        alert(data.message || "Failed to load participants.");
      }
    } catch (err) {
      alert("Error fetching event participants.");
    } finally {
      setRosterLoading(false);
    }
  };

  const handleToggleAttendance = async (studentUserId: string) => {
    if (!selectedEventRoster?._id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${selectedEventRoster._id}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: studentUserId })
      });
      const data = await response.json();
      if (data.success) {
        setRosterParticipants((prev) =>
          prev.map((p) =>
            p.userId === studentUserId || p._id === studentUserId
              ? { ...p, attended: data.attended !== undefined ? data.attended : !p.attended }
              : p
          )
        );
      } else {
        alert(data.message || "Could not update attendance.");
      }
    } catch (err) {
      alert("Error updating attendance.");
    }
  };

  const handleExportCSV = () => {
    if (!selectedEventRoster || rosterParticipants.length === 0) return;
    const headers = ["S.No", "Student Name", "Enrollment Number", "Branch", "Semester", "Email", "Contact", "Attendance Status"];
    const rows = rosterParticipants.map((p, idx) => [
      idx + 1,
      `"${p.name || ''}"`,
      `"${p.rollNumber || ''}"`,
      `"${p.branch || ''}"`,
      p.semester || 1,
      `"${p.email || ''}"`,
      `"${p.contact || 'N/A'}"`,
      p.attended ? "Present" : "Absent"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeTitle = selectedEventRoster.title.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `${safeTitle}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Runner-Up CSV (Faculty / Admin)
  const handleExportRunnerUpCSV = (event: any) => {
    if (!event) return;
    const runnersUp = (event.winners || []).filter((w: any) =>
      (w.position || "").toLowerCase().includes("runner up") ||
      (w.position || "").toLowerCase().includes("2nd")
    );

    if (runnersUp.length === 0) {
      alert("No Runner-Up has been declared yet for this event. Please announce the winners and runner-up first using the 'Announce Results' button.");
      return;
    }

    const headers = ["Position", "Student Name", "Enrollment / Roll No", "Branch", "Semester", "Email", "Contact", "Prize / Remarks", "Event Name", "Event Date"];
    const rows = runnersUp.map((w: any) => [
      `"${w.position || 'Runner Up'}"`,
      `"${w.studentName || ''}"`,
      `"${w.rollNumber || ''}"`,
      `"${w.branch || ''}"`,
      w.semester || 1,
      `"${w.email || ''}"`,
      `"${w.contact || ''}"`,
      `"${w.prize || ''}"`,
      `"${event.title || ''}"`,
      `"${new Date(event.date).toLocaleDateString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeTitle = (event.title || "event").replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `${safeTitle}_runners_up.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export All Winners & Runners-Up CSV (Faculty / Admin)
  const handleExportAllWinnersCSV = (event: any) => {
    if (!event) return;
    const winners = event.winners || [];

    if (winners.length === 0) {
      alert("No winners have been announced yet for this event. Please announce the results first.");
      return;
    }

    const headers = ["Position", "Student Name", "Enrollment / Roll No", "Branch", "Semester", "Email", "Contact", "Prize / Remarks", "Event Name", "Event Date"];
    const rows = winners.map((w: any) => [
      `"${w.position || ''}"`,
      `"${w.studentName || ''}"`,
      `"${w.rollNumber || ''}"`,
      `"${w.branch || ''}"`,
      w.semester || 1,
      `"${w.email || ''}"`,
      `"${w.contact || ''}"`,
      `"${w.prize || ''}"`,
      `"${event.title || ''}"`,
      `"${new Date(event.date).toLocaleDateString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeTitle = (event.title || "event").replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `${safeTitle}_winners_and_runners_up.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Announce Winners Modal
  const openWinnersModal = async (event: any) => {
    setEventForWinners(event);
    setLoadingAttendeesForWinners(true);

    if (event.winners && event.winners.length > 0) {
      setWinnerEntries(
        event.winners.map((w: any) => ({
          position: w.position || "Winner (1st Place)",
          studentName: w.studentName || "",
          rollNumber: w.rollNumber || "",
          branch: w.branch || "",
          semester: w.semester || 1,
          email: w.email || "",
          contact: w.contact || "",
          prize: w.prize || ""
        }))
      );
    } else {
      setWinnerEntries([
        { position: "Winner (1st Place)", studentName: "", rollNumber: "", branch: "", semester: 1, email: "", contact: "", prize: "1st Prize Trophy & Certificate" },
        { position: "Runner Up (2nd Place)", studentName: "", rollNumber: "", branch: "", semester: 1, email: "", contact: "", prize: "Runner Up Shield & Certificate" }
      ]);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${event._id}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEventAttendeesForWinners(data.participants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendeesForWinners(false);
    }
  };

  // Select participant from fast dropdown to fill row
  const handleSelectAttendeeForWinner = (attendeeUserId: string, index: number) => {
    const attendee = eventAttendeesForWinners.find((p) => p.userId === attendeeUserId || p._id === attendeeUserId);
    if (!attendee) return;

    setWinnerEntries((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        studentName: attendee.name || "",
        rollNumber: attendee.rollNumber || "",
        branch: attendee.branch || "",
        semester: attendee.semester || 1,
        email: attendee.email || "",
        contact: attendee.contact || ""
      };
      return updated;
    });
  };

  const handleAddWinnerRow = () => {
    const currentLen = winnerEntries.length;
    const defaultPos = currentLen === 2 ? "2nd Runner Up (3rd Place)" : `Honorable Mention / ${currentLen + 1}th Place`;
    setWinnerEntries((prev) => [
      ...prev,
      { position: defaultPos, studentName: "", rollNumber: "", branch: "", semester: 1, email: "", contact: "", prize: "Merit Certificate" }
    ]);
  };

  const handleRemoveWinnerRow = (index: number) => {
    if (winnerEntries.length <= 1) {
      alert("At least one position is required.");
      return;
    }
    setWinnerEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAndPublishWinners = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForWinners) return;

    const validWinners = winnerEntries.filter((w) => w.studentName.trim() !== "");
    if (validWinners.length === 0) {
      alert("Please provide the details for at least the Winner or Runner-Up.");
      return;
    }

    setSubmittingWinners(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventForWinners._id}/winners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          winners: validWinners,
          customNoticeContent: customNoticeText.trim() || undefined
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("🎉 Winners and Runner-Up announced successfully! Results have been automatically broadcast to the Notices section.");
        setEventForWinners(null);
        fetchEvents();
        fetchNotices();
      } else {
        alert(data.message || "Failed to publish winners.");
      }
    } catch (err) {
      alert("Network error while publishing winners.");
    } finally {
      setSubmittingWinners(false);
    }
  };

  // General Notice creation (Faculty / Admin)
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      alert("Please provide title and content");
      return;
    }
    setNoticeSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/notices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newNoticeTitle.trim(),
          category: newNoticeCategory,
          content: newNoticeContent.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Notice published successfully!");
        setShowCreateNoticeModal(false);
        setNewNoticeTitle("");
        setNewNoticeContent("");
        fetchNotices();
      } else {
        alert(data.message || "Failed to publish notice");
      }
    } catch (err) {
      alert("Error publishing notice.");
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove notice "${title}"?`)) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/notices/${noticeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert("Notice removed.");
        fetchNotices();
      } else {
        alert(data.message || "Failed to remove notice");
      }
    } catch (err) {
      alert("Error deleting notice");
    }
  };

  const filteredParticipants = rosterParticipants.filter((p) => {
    const q = rosterSearch.toLowerCase();
    const matchesSearch =
      (p.name || "").toLowerCase().includes(q) ||
      (p.rollNumber || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.branch || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (rosterFilterAttended === "present") return p.attended;
    if (rosterFilterAttended === "absent") return !p.attended;
    return true;
  });

  const filteredNotices = notices.filter((n) => {
    const q = noticeSearch.toLowerCase();
    const matchesSearch =
      (n.title || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q) ||
      (n.author?.email || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (noticeCategoryFilter === "all") return true;
    return n.category === noticeCategoryFilter;
  });

  // Calculate stats for badges
  const resultNoticesCount = notices.filter((n) => n.category === "event" || (n.title || "").includes("Results")).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-zinc-950 font-sans">
        {/* Header with dynamic title based on role */}
        <div className="pb-3 border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-emerald-800 flex items-center gap-2">
              <span>{userRole === "student" ? "📢 Notices and Events" : "📢 Notices and Event Management"}</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {userRole === "student"
                ? "Browse official campus notices, event winners & results, and register for student activities & workshops."
                : "Publish campus events, announce winners & runner-up results to notices, and export attendee rosters & CSV reports."}
            </p>
          </div>

          {/* Top Tabs Switcher */}
          <div className="flex items-center gap-1.5 bg-emerald-50/70 p-1.5 rounded-2xl border border-emerald-100 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "events"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-emerald-900 hover:bg-white/60"
              }`}
            >
              <span>📅</span>
              <span>Events & Drives</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "events" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}>
                {events.length}
              </span>
            </button>

            {/* Publish Events Tab (Faculty / Admin only) */}
            {(userRole === "faculty" || userRole === "admin") && (
              <button
                onClick={() => setActiveTab("publish")}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "publish"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-emerald-900 hover:bg-white/60"
                }`}
              >
                <span>✨</span>
                <span>Publish Events</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("notices")}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "notices"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-emerald-900 hover:bg-white/60"
              }`}
            >
              <span>📢</span>
              <span>Notices & Results</span>
              {resultNoticesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-400 text-amber-950 animate-pulse">
                  🏆 {resultNoticesCount}
                </span>
              )}
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "notices" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}>
                {notices.length}
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: EVENTS VIEW (FULL-WIDTH) */}
        {/* ============================================================== */}
        {activeTab === "events" && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
              <div>
                <h4 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>📅</span>
                  <span>Active Campus Events & Workshops</span>
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">Explore campus drives, registrations, and official result broadcasts.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-semibold">{events.length} listed</span>
                {(userRole === "faculty" || userRole === "admin") && (
                  <button
                    onClick={() => setActiveTab("publish")}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✨</span>
                    <span>Publish Events</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-2xl mb-1">📅</p>
                  <p>No campus events published yet.</p>
                </div>
              ) : (
                  events.map((event) => {
                    const isRegistered = Boolean(
                      currentUserId &&
                      event.registeredParticipants?.some((p: any) => {
                        const pid = typeof p === "object" && p !== null ? (p._id || p.id) : p;
                        return pid?.toString() === currentUserId.toString();
                      })
                    );

                    const deadlineDate = new Date(event.registrationDeadline);
                    if (deadlineDate.getHours() === 0 && deadlineDate.getMinutes() === 0 && deadlineDate.getSeconds() === 0) {
                      deadlineDate.setHours(23, 59, 59, 999);
                    }
                    const isDeadlinePassed = new Date() > deadlineDate;
                    const isCapacityFull = Boolean(event.maxParticipants && (event.registeredParticipants?.length || 0) >= event.maxParticipants);

                    const organizerId = typeof event.organizer === "object" && event.organizer !== null
                      ? (event.organizer._id || event.organizer.id)
                      : event.organizer;

                    const canManage = userRole === "admin" || userRole === "faculty";
                    const canDelete = userRole === "admin" || (
                      userRole === "faculty" && currentUserId && (
                        !organizerId || organizerId.toString() === currentUserId.toString()
                      )
                    );

                    return (
                      <div key={event._id} className="border border-zinc-200 rounded-2xl bg-zinc-50 overflow-hidden hover:border-emerald-300 transition-all shadow-xs flex flex-col">
                        {/* Event Poster Banner (Visible to Students & Faculty) */}
                        {event.posterUrl && (
                          <div
                            onClick={() => setViewingPoster({ url: event.posterUrl, title: event.title })}
                            className="relative w-full h-44 sm:h-52 bg-zinc-900 group cursor-pointer overflow-hidden"
                            title="Click to view full poster"
                          >
                            <img
                              src={event.posterUrl}
                              alt={`${event.title} Poster`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                              onError={(e: any) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-transparent to-black/25 pointer-events-none" />
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-black/70 text-white backdrop-blur-md flex items-center gap-1 shadow">
                                <span>🖼️</span> View Poster
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex items-center justify-between">
                              <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase drop-shadow">
                                Official Event Poster
                              </span>
                              <span className="text-[10px] text-white/80 font-semibold drop-shadow hidden sm:inline">
                                Click to enlarge
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Event Details Content */}
                        <div className="p-5 flex flex-col gap-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-extrabold text-zinc-900 text-base">{event.title}</h5>
                                {event.resultsAnnounced && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-sm">
                                    <span>🏆</span>
                                    <span>Results Announced</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{event.description}</p>
                              <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-zinc-500">
                                <span>📍 Venue: <strong className="text-zinc-700">{event.venue}</strong></span>
                                <span>📅 Date: <strong className="text-zinc-700">{new Date(event.date).toLocaleDateString()}</strong></span>
                                <span>⏰ Deadline: <strong className="text-zinc-700">{new Date(event.registrationDeadline).toLocaleDateString()}</strong></span>
                                <span>👥 Capacity: <strong className="text-zinc-700">{event.registeredParticipants?.length || 0} / {event.maxParticipants || 100}</strong></span>
                                {event.organizer?.email && (
                                  <span>👤 Host: <strong className="text-zinc-700">{event.organizer.email}</strong></span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {/* Poster Button for all users */}
                              {event.posterUrl && (
                                <button
                                  onClick={() => setViewingPoster({ url: event.posterUrl, title: event.title })}
                                  className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                                  title="View full event poster"
                                >
                                  <span>🖼️</span>
                                  <span>Poster</span>
                                </button>
                              )}

                              {userRole === "student" && (
                                <div>
                                  {isRegistered ? (
                                    <span className="py-2 px-4 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 whitespace-nowrap inline-flex items-center gap-1">
                                      ✓ Registered
                                    </span>
                                  ) : isDeadlinePassed ? (
                                    <span className="py-2 px-4 bg-zinc-200 text-zinc-500 text-xs font-bold rounded-xl border border-zinc-300 whitespace-nowrap inline-flex">
                                      Registration Closed
                                    </span>
                                  ) : isCapacityFull ? (
                                    <span className="py-2 px-4 bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 whitespace-nowrap inline-flex">
                                      Event Full
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => openRegistrationModal(event)}
                                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5"
                                    >
                                      <span>✍️</span>
                                      <span>Register</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              {canManage && (
                                <>
                                  <button
                                    onClick={() => handleViewParticipants(event)}
                                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                                    title="View registered student entries"
                                  >
                                    <span>👥</span>
                                    <span>Entries ({event.registeredParticipants?.length || 0})</span>
                                  </button>

                                  <button
                                    onClick={() => openPosterUpdateModal(event)}
                                    className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                                    title={event.posterUrl ? "Update event poster" : "Upload event poster"}
                                  >
                                    <span>📸</span>
                                    <span>{event.posterUrl ? "Edit Poster" : "Add Poster"}</span>
                                  </button>

                                  <button
                                    onClick={() => openWinnersModal(event)}
                                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer ${
                                      event.resultsAnnounced
                                        ? "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300"
                                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                                    }`}
                                    title="Declare or edit winners and broadcast to Notices"
                                  >
                                    <span>🏆</span>
                                    <span>{event.resultsAnnounced ? "Edit Results" : "Announce Winners"}</span>
                                  </button>

                                  {event.resultsAnnounced && (
                                    <button
                                      onClick={() => handleExportRunnerUpCSV(event)}
                                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                                      title="Download Runner-Up roster as CSV"
                                    >
                                      <span>🥈</span>
                                      <span>Runner-Up CSV</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteEvent(event._id, event.title)}
                                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                                  title="Remove this event"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                        {/* Winners Display Card (if results announced) */}
                        {event.resultsAnnounced && event.winners && event.winners.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-amber-50/90 via-emerald-50/40 to-amber-50/60 border border-amber-200 rounded-2xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-amber-200/60 gap-2">
                              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                                <span className="text-base">🏆</span>
                                <span>Official Winner & Runner-Up Honors:</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setActiveTab("notices");
                                    setNoticeCategoryFilter("event");
                                  }}
                                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>View in Notices</span>
                                  <span>➔</span>
                                </button>
                                {canManage && (
                                  <>
                                    <button
                                      onClick={() => handleExportRunnerUpCSV(event)}
                                      className="text-[10px] font-bold bg-white text-slate-800 border border-slate-300 px-2 py-0.5 rounded-md hover:bg-slate-50 cursor-pointer"
                                      title="Download Runner-Up CSV"
                                    >
                                      🥈 Runner-Up CSV
                                    </button>
                                    <button
                                      onClick={() => handleExportAllWinnersCSV(event)}
                                      className="text-[10px] font-bold bg-white text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md hover:bg-amber-50 cursor-pointer"
                                      title="Download All Winners CSV"
                                    >
                                      📥 All Winners CSV
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {event.winners.map((w: any, idx: number) => {
                                const posLower = (w.position || "").toLowerCase();
                                const isWinner = posLower.includes("winner") || posLower.includes("1st");
                                const isRunnerUp = posLower.includes("runner up") || posLower.includes("2nd");
                                const isThird = posLower.includes("3rd");

                                return (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 shadow-xs ${
                                      isWinner
                                        ? "bg-amber-100/90 border-amber-300 text-amber-950"
                                        : isRunnerUp
                                        ? "bg-slate-100/90 border-slate-300 text-slate-900"
                                        : isThird
                                        ? "bg-orange-50 border-orange-200 text-orange-950"
                                        : "bg-white border-zinc-200 text-zinc-800"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="text-xl">
                                        {isWinner ? "🥇" : isRunnerUp ? "🥈" : isThird ? "🥉" : "🎖️"}
                                      </span>
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-wider opacity-75">
                                          {w.position}
                                        </div>
                                        <div className="font-black text-xs text-zinc-950 mt-0.5">
                                          {w.studentName}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5">
                                          {w.rollNumber && <span className="font-mono">{w.rollNumber}</span>}
                                          {w.branch && <span> &bull; {w.branch}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    {w.prize && (
                                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 border border-current self-start">
                                        🎁 {w.prize}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PUBLISH EVENT VIEW (FACULTY / ADMIN ONLY) */}
        {/* ============================================================== */}
        {activeTab === "publish" && (userRole === "admin" || userRole === "faculty") && (
          <div className="max-w-3xl mx-auto bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h4 className="text-lg font-bold text-zinc-900 font-sans flex items-center gap-2">
                  <span>✨</span>
                  <span>Publish Campus Event</span>
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Create and schedule a new official university event, workshop, or competition.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                Faculty Admin Drive
              </span>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Annual Robotics Championship 2026"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={3}
                  placeholder="Provide event details, rules, prizes, or eligibility..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Venue *</label>
                <input
                  type="text"
                  required
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. Block B Central Auditorium"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      if (!eventDeadline || eventDeadline === eventDate) {
                        setEventDeadline(e.target.value);
                      }
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Registration Deadline *</label>
                  <input
                    type="date"
                    required
                    value={eventDeadline}
                    onChange={(e) => setEventDeadline(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Max Participants / Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={eventMaxPart}
                  onChange={(e) => setEventMaxPart(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Event Poster Upload (Optional) */}
              <div className="border border-dashed border-emerald-300 rounded-2xl p-4 bg-emerald-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                    <span>🖼️</span>
                    <span>Event Poster / Banner (Optional)</span>
                  </label>
                  {eventPosterPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold transition cursor-pointer"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mb-3">
                  Upload an official poster for students to view and download (PNG, JPG, WEBP, max 5MB).
                </p>

                {eventPosterPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-xs max-h-56 group">
                    <img
                      src={eventPosterPreview}
                      alt="Poster preview"
                      className="w-full h-52 object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingPoster({ url: eventPosterPreview, title: eventTitle || "Event Poster Preview" })}
                        className="px-3.5 py-1.5 bg-white/90 hover:bg-white text-zinc-800 rounded-lg text-xs font-bold shadow cursor-pointer"
                      >
                        🔍 Preview Full
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePoster}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-emerald-400 bg-white rounded-xl p-4 cursor-pointer transition">
                      <span className="text-3xl mb-1.5">📸</span>
                      <span className="text-xs font-bold text-zinc-700">Choose poster image file</span>
                      <span className="text-[10px] text-zinc-400">PNG, JPG, JPEG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePosterFileChange}
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-zinc-200 flex-1" />
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">or image URL</span>
                      <div className="h-px bg-zinc-200 flex-1" />
                    </div>
                    <input
                      type="url"
                      value={eventPosterUrlInput}
                      onChange={(e) => {
                        setEventPosterUrlInput(e.target.value);
                        if (e.target.value) {
                          setEventPosterPreview(e.target.value);
                        }
                      }}
                      placeholder="https://example.com/event-poster.jpg"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("events")}
                  className="py-2.5 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingPoster}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {uploadingPoster ? (
                    <>
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Uploading Poster & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Publish Event Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: NOTICES & RESULTS VIEW */}
        {/* ============================================================== */}
        {activeTab === "notices" && (
          <div className="space-y-6">
            {/* Notices Toolbar */}
            <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search notices, winner announcements, exams..."
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {noticeSearch && (
                    <button
                      onClick={() => setNoticeSearch("")}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "all", label: "All Notices" },
                    { id: "event", label: "🏆 Event Results" },
                    { id: "academic", label: "📚 Academic" },
                    { id: "placement", label: "💼 Placement" },
                    { id: "general", label: "🎉 General" },
                    { id: "exam", label: "⏰ Exam" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNoticeCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        noticeCategoryFilter === cat.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Notice button (Faculty / Admin) */}
              {(userRole === "admin" || userRole === "faculty") && (
                <button
                  onClick={() => setShowCreateNoticeModal(true)}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>➕</span>
                  <span>Publish Notice</span>
                </button>
              )}
            </div>

            {/* Notices Cards Grid */}
            {noticesLoading ? (
              <div className="py-20 text-center text-xs text-zinc-400">
                <span className="animate-spin inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mb-2" />
                <p>Loading notices and announcements...</p>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="p-16 text-center text-xs text-zinc-400 italic bg-white rounded-3xl border border-dashed border-zinc-200">
                <p className="text-3xl mb-2">📢</p>
                <p>No notices found matching your search filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotices.map((n) => {
                  const isEventNotice = n.category === "event" || (n.title || "").includes("Results");
                  const isAuthor = currentUserId && n.author && (
                    (typeof n.author === "object" && (n.author._id || n.author.id)?.toString() === currentUserId.toString()) ||
                    n.author.toString() === currentUserId.toString()
                  );
                  const canDeleteNotice = userRole === "admin" || isAuthor;

                  return (
                    <div
                      key={n._id}
                      className={`rounded-3xl p-6 transition-all flex flex-col justify-between gap-4 border shadow-sm ${
                        isEventNotice
                          ? "bg-gradient-to-br from-amber-50/60 via-white to-emerald-50/40 border-amber-300 ring-2 ring-amber-100"
                          : "bg-white border-zinc-200 hover:border-emerald-200"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Notice Header & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isEventNotice
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : n.category === "exam"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : n.category === "placement"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {isEventNotice ? "🏆 Event Result" : n.category}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              📅 {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {canDeleteNotice && (
                            <button
                              onClick={() => handleDeleteNotice(n._id, n.title)}
                              className="text-zinc-400 hover:text-rose-600 text-xs transition-colors p-1"
                              title="Delete notice"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-extrabold text-zinc-950 leading-snug">
                          {n.title}
                        </h4>

                        {/* Content */}
                        <div className="text-xs text-zinc-700 whitespace-pre-line leading-relaxed border-t border-zinc-100 pt-3">
                          {n.content}
                        </div>
                      </div>

                      {/* Notice Footer Author */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                        <span>
                          Author: <strong className="text-zinc-600">{n.author?.email || "Academic Coordinator"}</strong>
                        </span>
                        {isEventNotice && (
                          <span className="font-bold text-amber-800 flex items-center gap-1">
                            <span>✨ Verified Result</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: ANNOUNCE EVENT WINNERS & RESULTS (Faculty / Admin) */}
        {/* ============================================================== */}
        {eventForWinners && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] flex flex-col shadow-2xl border border-amber-200">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-zinc-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <h4 className="text-xl font-extrabold text-zinc-950">
                      Announce Event Results & Winners
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Event: <strong className="text-zinc-800">{eventForWinners.title}</strong> &bull; {eventForWinners.venue}
                  </p>
                  <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mt-2">
                    💡 Once saved, Trellis will automatically broadcast a formatted results notice into the <strong>Notices</strong> section and allow downloading the <strong>Runner-Up CSV</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setEventForWinners(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-sm transition-all cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveAndPublishWinners} className="space-y-5 flex-1 overflow-y-auto pr-1">
                {/* Winner entries list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-600">
                      Podium & Honor Positions
                    </label>
                    <button
                      type="button"
                      onClick={handleAddWinnerRow}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Add Position (e.g. 2nd Runner Up)</span>
                    </button>
                  </div>

                  {winnerEntries.map((winner, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        idx === 0
                          ? "bg-amber-50/70 border-amber-300"
                          : idx === 1
                          ? "bg-slate-50 border-slate-300"
                          : "bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🎖️"}
                          </span>
                          <input
                            type="text"
                            required
                            value={winner.position}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].position = val;
                                return copy;
                              });
                            }}
                            placeholder="e.g. Winner (1st Place) or Runner Up"
                            className="font-extrabold text-xs text-zinc-900 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Fast Select from attendees */}
                        {eventAttendeesForWinners.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-zinc-400">Fast pick attendee:</span>
                            <select
                              onChange={(e) => handleSelectAttendeeForWinner(e.target.value, idx)}
                              defaultValue=""
                              className="text-[11px] bg-white border border-zinc-300 rounded-xl px-2.5 py-1 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="" disabled>-- Select student --</option>
                              {eventAttendeesForWinners.map((att) => (
                                <option key={att.userId || att._id} value={att.userId || att._id}>
                                  {att.name} ({att.rollNumber}) {att.attended ? "✓" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {winnerEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWinnerRow(idx)}
                            className="text-zinc-400 hover:text-rose-600 text-xs p-1"
                            title="Remove position"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Student details inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1">Student Full Name *</label>
                          <input
                            type="text"
                            required
                            value={winner.studentName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].studentName = val;
                                return copy;
                              });
                            }}
                            placeholder="Student name"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1">Roll / Enrollment No.</label>
                          <input
                            type="text"
                            value={winner.rollNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].rollNumber = val;
                                return copy;
                              });
                            }}
                            placeholder="e.g. 21BCS045"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1">Branch & Semester</label>
                          <input
                            type="text"
                            value={winner.branch}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].branch = val;
                                return copy;
                              });
                            }}
                            placeholder="e.g. Computer Science"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1">College Email</label>
                          <input
                            type="email"
                            value={winner.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].email = val;
                                return copy;
                              });
                            }}
                            placeholder="student@ipsacademy.org"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1">Contact / Phone</label>
                          <input
                            type="text"
                            value={winner.contact}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].contact = val;
                                return copy;
                              });
                            }}
                            placeholder="+91 98765 43210"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 mb-1">Prize / Remarks</label>
                          <input
                            type="text"
                            value={winner.prize}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinnerEntries((prev) => {
                                const copy = [...prev];
                                copy[idx].prize = val;
                                return copy;
                              });
                            }}
                            placeholder="e.g. Certificate + ₹2,000"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Notice announcement text */}
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Custom Announcement Message (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customNoticeText}
                    onChange={(e) => setCustomNoticeText(e.target.value)}
                    placeholder="Provide additional congratulatory remarks or notes for the official Notice..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                {/* Submit & Export bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportRunnerUpCSV(eventForWinners)}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Download Runner-Up CSV directly"
                    >
                      <span>🥈</span>
                      <span>Export Runner-Up CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportAllWinnersCSV(eventForWinners)}
                      className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Download All Winners CSV"
                    >
                      <span>📥</span>
                      <span>Export All Winners CSV</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEventForWinners(null)}
                      className="py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingWinners}
                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submittingWinners ? (
                        <>
                          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                          <span>Broadcasting...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          <span>Publish Results & Broadcast Notice</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: PUBLISH GENERAL NOTICE (Faculty / Admin) */}
        {/* ============================================================== */}
        {showCreateNoticeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl border border-emerald-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h4 className="text-lg font-extrabold text-zinc-950 flex items-center gap-2">
                  <span>📢</span>
                  <span>Publish Campus Notice</span>
                </h4>
                <button
                  onClick={() => setShowCreateNoticeModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                    placeholder="e.g. End Semester Exam Guidelines or Hackathon Results"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Category *</label>
                  <select
                    value={newNoticeCategory}
                    onChange={(e) => setNewNoticeCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="general">General Campus Notice</option>
                    <option value="academic">Academic & Classes</option>
                    <option value="exam">Examination Schedule</option>
                    <option value="placement">Placement & Careers</option>
                    <option value="holiday">Holiday Announcement</option>
                    <option value="event">Event & Winners</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Notice Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={newNoticeContent}
                    onChange={(e) => setNewNoticeContent(e.target.value)}
                    placeholder="Write announcement details..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateNoticeModal(false)}
                    className="flex-1 py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={noticeSubmitting}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {noticeSubmitting ? "Publishing..." : "Broadcast Notice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: REGISTERED PARTICIPANTS ROSTER (Faculty / Admin) */}
        {/* ============================================================== */}
        {selectedEventRoster && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] flex flex-col shadow-2xl border border-emerald-100">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-extrabold text-zinc-950">
                      {selectedEventRoster.title}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      👥 {rosterParticipants.length} Registered
                    </span>
                    {selectedEventRoster.maxParticipants && (
                      <span className="text-xs text-zinc-400">
                        (Capacity: {selectedEventRoster.maxParticipants})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    📍 {selectedEventRoster.venue} &bull; 📅 {new Date(selectedEventRoster.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <button
                    onClick={handleExportCSV}
                    disabled={rosterParticipants.length === 0}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Download attendee list as CSV"
                  >
                    <span>📥</span>
                    <span>Export Attendees CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      const ev = selectedEventRoster;
                      setSelectedEventRoster(null);
                      openWinnersModal(ev);
                    }}
                    className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Declare winners from this roster"
                  >
                    <span>🏆</span>
                    <span>Announce Winners</span>
                  </button>
                  <button
                    onClick={() => setSelectedEventRoster(null)}
                    className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Filter toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search student by name, enrollment no, or email..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {rosterSearch && (
                    <button
                      onClick={() => setRosterSearch("")}
                      className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto">
                  {(["all", "present", "absent"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setRosterFilterAttended(mode)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                        rosterFilterAttended === mode ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      {mode} ({mode === "all" ? rosterParticipants.length : mode === "present" ? rosterParticipants.filter(p => p.attended).length : rosterParticipants.filter(p => !p.attended).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants list/table */}
              <div className="flex-1 overflow-y-auto border border-zinc-100 rounded-2xl">
                {rosterLoading ? (
                  <div className="py-16 text-center text-xs text-zinc-400">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mb-2" />
                    <p>Loading registered participants...</p>
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="py-16 text-center text-xs text-zinc-400 italic">
                    {rosterParticipants.length === 0
                      ? "No students have registered for this event yet."
                      : "No students matching your search criteria."}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400 sticky top-0">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Student Details</th>
                        <th className="py-3 px-4">Branch & Sem</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4 text-center">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredParticipants.map((p, idx) => (
                        <tr key={p.userId || p._id || idx} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-3 px-4 text-zinc-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-zinc-900">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                                {p.rollNumber}
                              </span>
                              <span className="text-[10px] text-zinc-400">{p.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-800">{p.branch}</div>
                            <div className="text-[10px] text-zinc-400">Semester {p.semester}</div>
                          </td>
                          <td className="py-3 px-4">
                            {p.contact ? (
                              <a
                                href={`tel:${p.contact}`}
                                className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <span>📞</span>
                                <span>{p.contact}</span>
                              </a>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px]">Not provided</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleAttendance(p.userId || p._id)}
                              className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                                p.attended
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              {p.attended ? "✓ Present" : "Mark Present"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer Summary */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                <div>
                  Total Attendance:{" "}
                  <span className="font-bold text-emerald-700">
                    {rosterParticipants.filter((p) => p.attended).length} / {rosterParticipants.length}
                  </span>{" "}
                  Present
                </div>
                <button
                  onClick={() => setSelectedEventRoster(null)}
                  className="py-1.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: STUDENT EVENT REGISTRATION FORM */}
        {/* ============================================================== */}
        {eventToRegister && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-zinc-100 gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    Event Registration
                  </span>
                  <h4 className="text-lg font-extrabold text-zinc-950 mt-1.5">
                    {eventToRegister.title}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500 mt-1">
                    <span>📍 {eventToRegister.venue}</span>
                    <span>&bull;</span>
                    <span>📅 {new Date(eventToRegister.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEventToRegister(null);
                    setRegError("");
                    setRegSuccessMessage("");
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-sm transition-all cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Success Screen */}
              {regSuccessMessage ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">
                    ✓
                  </div>
                  <h5 className="text-base font-extrabold text-zinc-950">Registration Confirmed!</h5>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                    {regSuccessMessage}
                  </p>
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-[11px] text-zinc-600 max-w-xs mx-auto">
                    <span className="font-bold text-zinc-900">{regName}</span> &bull; {regRoll} &bull; {regBranch}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmRegistration} className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 text-emerald-800 rounded-2xl text-[11px] flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <span>Your academic credentials have been loaded from your verified Trellis profile.</span>
                  </div>

                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                          Enrollment / Roll No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={regRoll}
                          onChange={(e) => setRegRoll(e.target.value)}
                          placeholder="e.g. 21BCS101"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                          Branch / Department
                        </label>
                        <input
                          type="text"
                          value={regBranch}
                          onChange={(e) => setRegBranch(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                          Current Semester
                        </label>
                        <select
                          value={regSemester}
                          onChange={(e) => setRegSemester(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                        College Email ID
                      </label>
                      <input
                        type="email"
                        disabled
                        value={regEmail}
                        className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-zinc-700">
                          Mobile / WhatsApp Number *
                        </label>
                        <span className="text-[10px] text-emerald-700 font-bold">Required for event updates</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={regContact}
                        onChange={(e) => {
                          setRegContact(e.target.value);
                          if (regError) setRegError("");
                        }}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-xs text-zinc-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Faculty coordinators will use this number for urgent room assignments or result alerts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setEventToRegister(null)}
                      className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {regSubmitting ? (
                        <>
                          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <span>Confirm & Register</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* FULLSCREEN POSTER VIEWER LIGHTBOX MODAL */}
        {/* ============================================================== */}
        {viewingPoster && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setViewingPoster(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between text-white border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🖼️</span>
                  <h3 className="text-sm sm:text-base font-extrabold truncate max-w-md sm:max-w-xl">
                    {viewingPoster.title} - Official Poster
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingPoster.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>⬇️</span>
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => setViewingPoster(null)}
                    className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Poster Image */}
              <div className="flex items-center justify-center bg-black/50 rounded-2xl overflow-hidden p-2">
                <img
                  src={viewingPoster.url}
                  alt={viewingPoster.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg select-none"
                />
              </div>

              {/* Footer caption */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span>Tip: Click Download or open in full window for high-resolution print version.</span>
                <button
                  onClick={() => setViewingPoster(null)}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* UPLOAD / UPDATE EVENT POSTER MODAL (FACULTY / ADMIN) */}
        {/* ============================================================== */}
        {eventForPosterUpdate && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setEventForPosterUpdate(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📸</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-900">
                      {eventForPosterUpdate.posterUrl ? "Update Event Poster" : "Upload Event Poster"}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate max-w-xs sm:max-w-sm">
                      {eventForPosterUpdate.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEventForPosterUpdate(null)}
                  className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveUpdatedPoster} className="space-y-4">
                {updatePosterPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 max-h-56 bg-zinc-900 group">
                    <img
                      src={updatePosterPreview}
                      alt="Poster Preview"
                      className="w-full h-52 object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUpdatePosterFile(null);
                          setUpdatePosterPreview(null);
                          setUpdatePosterUrlInput("");
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                      >
                        ✕ Remove Poster
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-emerald-500 bg-zinc-50 hover:bg-emerald-50/30 rounded-2xl p-6 cursor-pointer transition">
                      <span className="text-3xl mb-2">🖼️</span>
                      <span className="text-xs font-bold text-zinc-800">Select Poster Image</span>
                      <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpdatePosterFileChange}
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="h-px bg-zinc-200 flex-1" />
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">or image URL</span>
                      <div className="h-px bg-zinc-200 flex-1" />
                    </div>

                    <input
                      type="url"
                      value={updatePosterUrlInput}
                      onChange={(e) => {
                        setUpdatePosterUrlInput(e.target.value);
                        if (e.target.value) {
                          setUpdatePosterPreview(e.target.value);
                        }
                      }}
                      placeholder="https://example.com/event-poster.jpg"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setEventForPosterUpdate(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUpdatedPoster}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    {savingUpdatedPoster ? (
                      <>
                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Poster</span>
                    )}
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
