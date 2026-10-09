"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BACKEND_URL } from "@/config/api";

export default function ComplaintsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("wifi");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Management Action Modals
  const [activeOngoingModal, setActiveOngoingModal] = useState<any | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [ongoingNotes, setOngoingNotes] = useState("");

  const [activeResolveModal, setActiveResolveModal] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Edit Complaint Modal
  const [activeEditModal, setActiveEditModal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [editDescription, setEditDescription] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editExistingImageUrl, setEditExistingImageUrl] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchComplaints();
      const interval = setInterval(fetchComplaints, 5000);
      return () => clearInterval(interval);
    }
  }, [token, userRole]);

  const fetchComplaints = async () => {
    try {
      const isMgmtOrAdmin = userRole === "management" || userRole === "admin";
      const url = isMgmtOrAdmin ? `${BACKEND_URL}/api/complaints` : `${BACKEND_URL}/api/complaints/my`;
        
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
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
              fileType: file.type.includes("pdf") ? "pdf" : "image"
            })
          });
          const data = await response.json();
          if (data.success) {
            resolve(data.url);
          } else {
            reject(new Error(data.message || "Upload failed"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !description) {
      alert("Please fill in Title, Location, and Description.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "";
      if (photoFile) {
        imageUrl = await uploadFile(photoFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          location,
          category,
          description,
          imageUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Complaint ticket submitted successfully to Campus Management!");
        setTitle("");
        setLocation("");
        setDescription("");
        setPhotoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchComplaints();
      } else {
        alert(data.message || "Error submitting complaint.");
      }
    } catch (err: any) {
      alert("Error filing complaint: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openOngoingModal = (complaint: any) => {
    setActiveOngoingModal(complaint);
    setAssignedTo(complaint.assignedTo || "Facilities Maintenance Team");
    setOngoingNotes(complaint.resolutionNotes || "Technician dispatched to inspect and resolve the issue.");
  };

  const handleSaveOngoing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOngoingModal) return;
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/complaints/${activeOngoingModal._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "in_progress",
          assignedTo,
          resolutionNotes: ongoingNotes
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Complaint status marked as Work Ongoing!");
        setActiveOngoingModal(null);
        fetchComplaints();
      } else {
        alert(data.message || "Failed to update complaint.");
      }
    } catch (err) {
      alert("Error updating status.");
    } finally {
      setLoading(false);
    }
  };

  const openResolveModal = (complaint: any) => {
    setActiveResolveModal(complaint);
    setResolutionNotes(complaint.resolutionNotes || "Issue inspected, repaired, and verified operational.");
  };

  const handleSaveResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolveModal) return;
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/complaints/${activeResolveModal._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "resolved",
          resolutionNotes
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Complaint successfully marked as Work Completed!");
        setActiveResolveModal(null);
        fetchComplaints();
      } else {
        alert(data.message || "Failed to resolve complaint.");
      }
    } catch (err) {
      alert("Error updating status.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (complaint: any) => {
    setActiveEditModal(complaint);
    setEditTitle(complaint.title || "");
    setEditLocation(complaint.location || "");
    setEditCategory(complaint.category || "other");
    setEditDescription(complaint.description || "");
    setEditExistingImageUrl(complaint.imageUrl || "");
    setEditPhotoFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditModal) return;
    if (!editTitle || !editLocation || !editDescription) {
      alert("Please fill in Title, Location, and Description.");
      return;
    }

    setEditSubmitting(true);
    try {
      let finalImageUrl = editExistingImageUrl;
      if (editPhotoFile) {
        finalImageUrl = await uploadFile(editPhotoFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/complaints/${activeEditModal._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          location: editLocation,
          category: editCategory,
          description: editDescription,
          imageUrl: finalImageUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Complaint ticket updated successfully!");
        setActiveEditModal(null);
        fetchComplaints();
      } else {
        alert(data.message || "Failed to update complaint.");
      }
    } catch (err: any) {
      alert("Error updating complaint: " + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    if (!confirm("Are you sure you want to delete this complaint ticket? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/complaints/${complaintId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert("Complaint ticket deleted successfully!");
        fetchComplaints();
      } else {
        alert(data.message || "Failed to delete complaint.");
      }
    } catch (err: any) {
      alert("Error deleting complaint: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isManagement = userRole === "management" || userRole === "admin";

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "wifi": return "📡 Wi-Fi & Network";
      case "washroom": return "🚻 Washroom Sanitation";
      case "projector": return "📽️ Projector & Lab AV";
      case "fan": return "🌀 Fan & Ventilation";
      case "light": return "💡 Lighting & Electrical";
      case "cleaning": return "🧹 Cleaning & Hygiene";
      case "electrical": return "⚡ Electrical Mains";
      case "lab_equipment": return "🔬 Lab Hardware";
      case "water_cooler": return "🚰 Water Dispenser";
      case "ragging": return "⚠️ Anti-Ragging Cell";
      default: return "🔧 General Maintenance";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-zinc-950 font-sans">
        {/* Header */}
        <div className="pb-4 border-b border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-emerald-800">Campus Facility Complaints Desk</h3>
              {isManagement && (
                <span className="bg-emerald-150 text-emerald-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Management Resolution Desk
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {isManagement
                ? "Review facility complaints across campus, dispatch technician teams, and mark work ongoing or completed."
                : "Submit maintenance tickets regarding campus utilities, washrooms, Wi-Fi, electrical fittings, and track resolution live."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchComplaints}
              className="py-2 px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>🔄</span> Refresh Status
            </button>
          </div>
        </div>

        {/* Management Overview Box */}
        {isManagement && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <div>
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  Campus Facilities Management Active
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Update complaints in real time to <strong>"Work Ongoing"</strong> with technician assignments or <strong>"Work Completed"</strong> with completion remarks.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Complaint Form (Visible for students and anyone filing) */}
          {!isManagement && (
            <div className="lg:col-span-5 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm self-start">
              <h4 className="text-base font-bold text-zinc-900 mb-4">File Maintenance Complaint</h4>
              <form onSubmit={handleFileComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Complaint Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Projector HDMI not displaying in Lab 4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Issue Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="wifi">📡 WiFi & Internet</option>
                      <option value="washroom">🚻 Washroom Sanitation</option>
                      <option value="projector">📽️ Projector / Lab AV</option>
                      <option value="fan">🌀 Fan / Electrical</option>
                      <option value="light">💡 Lighting & Bulbs</option>
                      <option value="cleaning">🧹 Classroom Cleaning</option>
                      <option value="water_cooler">🚰 Water Dispenser</option>
                      <option value="electrical">⚡ Electrical Wiring</option>
                      <option value="lab_equipment">🔬 Lab Hardware</option>
                      <option value="other">🔧 Other Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Location Details *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Block B, Room 204"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Detailed Description *</label>
                  <textarea
                    required
                    placeholder="Describe specific symptoms, equipment ID, or urgent hazards..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Photo Attachment (Optional)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPhotoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Submitting Ticket..." : "Submit Complaint Ticket"}
                </button>
              </form>
            </div>
          )}

          {/* Complaints List Panel */}
          <div className={`${!isManagement ? "lg:col-span-7" : "lg:col-span-12"} bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4`}>
            
            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-3">
              <h4 className="text-base font-bold text-zinc-900">
                {isManagement ? `All Campus Complaints (${filteredComplaints.length})` : `My Filed Complaints (${filteredComplaints.length})`}
              </h4>

              <div className="flex flex-wrap gap-2">
                <div className="flex bg-zinc-100 rounded-xl p-1 text-[10px] font-bold">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === "all" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === "pending" ? "bg-white text-rose-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    🟡 Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter("in_progress")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === "in_progress" ? "bg-white text-blue-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    🔵 Ongoing
                  </button>
                  <button
                    onClick={() => setStatusFilter("resolved")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === "resolved" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    🟢 Completed
                  </button>
                </div>
              </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-xs italic">
                No complaint tickets found matching the selected filter.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[680px] pr-1">
                {filteredComplaints.map((c) => {
                  const isPending = c.status === "pending";
                  const isOngoing = c.status === "in_progress";
                  const isResolved = c.status === "resolved";

                  return (
                    <div
                      key={c._id}
                      className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50 hover:bg-zinc-100/60 transition-all flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        {/* Status Badges */}
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                            {getCategoryLabel(c.category)}
                          </span>

                          {isPending && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>🟡</span> Pending Review
                            </span>
                          )}

                          {isOngoing && (
                            <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>🔵</span> Work Ongoing
                            </span>
                          )}

                          {isResolved && (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>🟢</span> Work Completed
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <h5 className="font-extrabold text-zinc-950 text-sm">{c.title || "Facility Issue"}</h5>
                          <p className="text-xs text-zinc-700 leading-relaxed font-medium mt-1">{c.description}</p>
                        </div>

                        {/* Photo attachment if available */}
                        {c.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={c.imageUrl}
                              alt="Complaint Attachment"
                              className="max-h-32 object-cover rounded-xl border border-zinc-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Meta tags */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500 font-semibold">
                          <span>📍 Location: {c.location || "Campus"}</span>
                          <span>📅 Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                          {c.student?.email && <span>👤 Student: {c.student.email}</span>}
                        </div>

                        {/* Work Ongoing Progress Box */}
                        {isOngoing && (
                          <div className="mt-2.5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-xs text-blue-950">
                            <div className="font-bold flex items-center gap-1 text-blue-900">
                              <span>🛠️</span> Work In-Progress Update:
                            </div>
                            <div className="text-[11px]">
                              <strong>Assigned To / Technician:</strong> {c.assignedTo || "Facilities Operations Staff"}
                            </div>
                            {c.resolutionNotes && (
                              <div className="text-[11px] text-blue-800">
                                <strong>Progress Note:</strong> {c.resolutionNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resolved Box */}
                        {isResolved && (
                          <div className="mt-2.5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-950">
                            <div className="font-bold flex items-center gap-1 text-emerald-900">
                              <span>✅</span> Work Completed Resolution:
                            </div>
                            <div className="text-[11px] text-emerald-800">
                              <strong>Resolution Note:</strong> {c.resolutionNotes || "Issue resolved and tested."}
                            </div>
                            <div className="text-[10px] text-emerald-700">
                              Resolved on: {c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : new Date(c.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions Toolbar: Edit, Delete, and Management Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-200/60 mt-1">
                        {/* Edit & Delete Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="py-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                            title="Edit complaint details"
                          >
                            <span>✏️</span> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComplaint(c._id)}
                            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                            title="Delete complaint ticket"
                          >
                            <span>🗑️</span> Delete
                          </button>
                        </div>

                        {/* Management Controls */}
                        {isManagement && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {!isOngoing && !isResolved && (
                              <button
                                onClick={() => openOngoingModal(c)}
                                className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                              >
                                <span>🛠️</span> Mark Work Ongoing
                              </button>
                            )}

                            {isOngoing && (
                              <button
                                onClick={() => openOngoingModal(c)}
                                className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition"
                              >
                                ✏️ Update Progress
                              </button>
                            )}

                            {!isResolved && (
                              <button
                                onClick={() => openResolveModal(c)}
                                className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                              >
                                <span>✅</span> Mark Work Completed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Management Set Ongoing Modal */}
        {activeOngoingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-emerald-100 shadow-2xl p-6 relative space-y-4">
              <button
                onClick={() => setActiveOngoingModal(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 text-lg"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛠️</span>
                <div>
                  <h3 className="text-base font-black text-blue-950">Mark Work Ongoing & Assign Staff</h3>
                  <p className="text-[11px] text-zinc-500">Ticket: {activeOngoingModal.title || activeOngoingModal.description || "Facility Issue"}</p>
                </div>
              </div>

              <form onSubmit={handleSaveOngoing} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Assigned Technician / Team *</label>
                  <input
                    type="text"
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Electrician Mr. Ramesh / IT Network Dept"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Progress / Work Notes</label>
                  <textarea
                    rows={3}
                    value={ongoingNotes}
                    onChange={(e) => setOngoingNotes(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Technician dispatched to replace switchboard fuse."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveOngoingModal(null)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {loading ? "Updating..." : "Confirm Work Ongoing"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Management Set Resolved Modal */}
        {activeResolveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-emerald-100 shadow-2xl p-6 relative space-y-4">
              <button
                onClick={() => setActiveResolveModal(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 text-lg"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-base font-black text-emerald-950">Mark Work Completed</h3>
                  <p className="text-[11px] text-zinc-500">Ticket: {activeResolveModal.title || activeResolveModal.description || "Facility Issue"}</p>
                </div>
              </div>

              <form onSubmit={handleSaveResolve} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Resolution Summary & Remarks *</label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Hardware cable replaced and projector display successfully tested with faculty."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveResolveModal(null)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {loading ? "Resolving..." : "Complete & Close Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Complaint Modal */}
        {activeEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-emerald-100 shadow-2xl p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveEditModal(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 text-lg"
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                <div>
                  <h3 className="text-base font-black text-zinc-900">Edit Complaint Ticket</h3>
                  <p className="text-[11px] text-zinc-500">Update issue details or attachments</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g. WiFi not connecting in Library"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Category *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="wifi">📡 Wi-Fi & Network</option>
                      <option value="washroom">🚻 Washroom Sanitation</option>
                      <option value="projector">📽️ Projector & Lab AV</option>
                      <option value="fan">🌀 Classroom Fan</option>
                      <option value="light">💡 Tube Light & Switch</option>
                      <option value="cleaning">🧹 Floor Cleaning</option>
                      <option value="water_cooler">🚰 Water Dispenser</option>
                      <option value="electrical">🔌 Electrical Socket</option>
                      <option value="lab_equipment">🔬 Lab Equipment</option>
                      <option value="ragging">🛡️ Campus Anti-Ragging</option>
                      <option value="other">📦 Other Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-semibold"
                      placeholder="e.g. Block B, 2nd Floor"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Issue Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="Provide specific details of what needs maintenance..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Photo Attachment (Optional)</label>
                  {editExistingImageUrl && !editPhotoFile && (
                    <div className="flex items-center gap-3 mb-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <img src={editExistingImageUrl} alt="Current Attachment" className="w-12 h-12 object-cover rounded-lg border border-zinc-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-zinc-700 truncate">Current Photo Attached</p>
                        <p className="text-[10px] text-zinc-400">Click remove if you wish to detach</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditExistingImageUrl("")}
                        className="text-xs text-rose-600 font-bold hover:underline px-2 py-1 bg-rose-50 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditPhotoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveEditModal(null)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
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
