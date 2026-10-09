"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BACKEND_URL } from "@/config/api";

export default function LostFoundPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States
  const [lostFoundItems, setLostFoundItems] = useState<any[]>([]);
  const [lfTitle, setLfTitle] = useState("");
  const [lfType, setLfType] = useState<"lost" | "found">("lost");
  const [lfDesc, setLfDesc] = useState("");
  const [lfLocation, setLfLocation] = useState("");
  const [lfContact, setLfContact] = useState("");
  
  // Files
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);

  // Filter
  const [selectedTagFilter, setSelectedTagFilter] = useState<"all" | "lost" | "found" | "ready_for_pickup" | "claimed" | "my_items">("all");

  // Management Pickup Modal State
  const [selectedItemForPickup, setSelectedItemForPickup] = useState<any | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("Central Management Office - Room 102");
  const [managementNotes, setManagementNotes] = useState("");

  // Claim Modal State
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<any | null>(null);
  const [claimedByName, setClaimedByName] = useState("");
  const [claimNotes, setClaimNotes] = useState("");

  // Edit Modal State
  const [activeEditModal, setActiveEditModal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<"lost" | "found">("lost");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editExistingImageUrl, setEditExistingImageUrl] = useState("");
  const [editExistingProofUrl, setEditExistingProofUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editProofFile, setEditProofFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editProofInputRef = useRef<HTMLInputElement>(null);

  const proofInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      fetchLostFoundItems();
      const interval = setInterval(fetchLostFoundItems, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchLostFoundItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lostfound`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLostFoundItems(data.items || []);
      }
    } catch (err) {
      console.error("Error fetching lost/found items:", err);
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

  const handleReportLostFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lfTitle || !lfDesc || !lfLocation) {
      alert("Please fill in all required fields (title, description, location).");
      return;
    }

    if (lfType === "lost" && !proofFile) {
      alert("Ownership proof (bill or receipt) is required when reporting a lost item.");
      return;
    }

    setUploading(true);
    setLoading(true);

    try {
      let proofUrl = "";
      let imageUrl = "";

      if (proofFile) {
        proofUrl = await uploadFile(proofFile);
      }
      if (itemImageFile) {
        imageUrl = await uploadFile(itemImageFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/lostfound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: lfTitle,
          description: lfDesc,
          type: lfType,
          location: lfLocation,
          contact: lfContact || userEmail || "",
          proofUrl,
          imageUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(
          lfType === "found"
            ? "Found item bulletin created! Please submit the item physically to the Management Office so they can log its pickup schedule."
            : "Lost item reported successfully! Management and campus security have been notified."
        );
        setLfTitle("");
        setLfDesc("");
        setLfLocation("");
        setLfContact("");
        setProofFile(null);
        setItemImageFile(null);
        if (proofInputRef.current) proofInputRef.current.value = "";
        if (imageInputRef.current) imageInputRef.current.value = "";
        fetchLostFoundItems();
      } else {
        alert(data.message || "Error reporting item.");
      }
    } catch (err: any) {
      alert("Error reporting item: " + err.message);
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  const openPickupModal = (item: any) => {
    setSelectedItemForPickup(item);
    // Default pickup date to tomorrow formatted YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split("T")[0]);
    setPickupLocation("Campus Facilities Management Office - Room 102");
    setManagementNotes("Item safely stored in Facilities Locker. Please bring your College ID card to claim.");
  };

  const handleSetReadyForPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForPickup) return;
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/lostfound/${selectedItemForPickup._id}/management-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "ready_for_pickup",
          pickupDate,
          pickupLocation,
          managementNotes
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Item marked as received and ready for pickup!");
        setSelectedItemForPickup(null);
        fetchLostFoundItems();
      } else {
        alert(data.message || "Failed to update status.");
      }
    } catch (err) {
      alert("Error updating status.");
    } finally {
      setLoading(false);
    }
  };

  const openClaimModal = (item: any) => {
    setSelectedItemForClaim(item);
    setClaimedByName("");
    setClaimNotes("");
  };

  const handleConfirmClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForClaim) return;
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/lostfound/${selectedItemForClaim._id}/management-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "claimed",
          claimedBy: claimedByName || "Verified Owner",
          managementNotes: claimNotes || "Handed over to verified owner upon physical ID verification."
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Item marked as claimed & handed over!");
        setSelectedItemForClaim(null);
        fetchLostFoundItems();
      } else {
        alert(data.message || "Failed to update item.");
      }
    } catch (err) {
      alert("Error updating item.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: any) => {
    setActiveEditModal(item);
    setEditTitle(item.title || "");
    setEditType(item.type || "lost");
    setEditDesc(item.description || "");
    setEditLocation(item.location || "");
    setEditContact(item.contact || "");
    setEditExistingImageUrl(item.imageUrl || "");
    setEditExistingProofUrl(item.proofUrl || "");
    setEditImageFile(null);
    setEditProofFile(null);
    if (editImageInputRef.current) editImageInputRef.current.value = "";
    if (editProofInputRef.current) editProofInputRef.current.value = "";
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditModal) return;
    if (!editTitle || !editType || !editDesc || !editLocation || !editContact) {
      alert("Please fill in Title, Type, Description, Location, and Contact details.");
      return;
    }

    setEditSubmitting(true);
    try {
      let finalImageUrl = editExistingImageUrl;
      if (editImageFile) {
        finalImageUrl = await uploadFile(editImageFile);
      }

      let finalProofUrl = editExistingProofUrl;
      if (editProofFile) {
        finalProofUrl = await uploadFile(editProofFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/lostfound/${activeEditModal._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          type: editType,
          description: editDesc,
          location: editLocation,
          contact: editContact,
          imageUrl: finalImageUrl,
          proofUrl: finalProofUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Lost & Found report updated successfully!");
        setActiveEditModal(null);
        fetchLostFoundItems();
      } else {
        alert(data.message || "Failed to update report.");
      }
    } catch (err: any) {
      alert("Error updating report: " + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this Lost & Found report? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/lostfound/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert("Lost & Found report deleted successfully!");
        fetchLostFoundItems();
      } else {
        alert(data.message || "Failed to delete report.");
      }
    } catch (err: any) {
      alert("Error deleting report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isManagement = userRole === "management" || userRole === "admin";

  // Color-coded status notifications (Student & Faculty)
  // 1. Red: Items still missing / not found yet
  const notFoundItems = lostFoundItems.filter((i) => i.type === "lost" && i.status === "open");
  const notFoundCount = notFoundItems.length;

  // 2. Amber: Found and ready at office, awaiting owner claim
  const foundUnclaimedItems = lostFoundItems.filter(
    (i) => i.status === "ready_for_pickup" || (i.type === "found" && i.status === "awaiting_handover")
  );
  const foundUnclaimedCount = foundUnclaimedItems.length;

  // 3. Green: Successfully claimed and returned to owner
  const claimedItems = lostFoundItems.filter((i) => i.status === "claimed");
  const claimedCount = claimedItems.length;

  // Personal items for current logged-in student or faculty
  const myItems = lostFoundItems.filter((i) => {
    if (!userEmail) return false;
    const repEmail = typeof i.reporter === "object" && i.reporter !== null ? i.reporter.email : "";
    return repEmail && repEmail.toLowerCase() === userEmail.toLowerCase();
  });
  const myFoundReadyItems = myItems.filter((i) => i.type === "lost" && i.status === "ready_for_pickup");
  const myStillSearchingItems = myItems.filter((i) => i.type === "lost" && i.status === "open");

  // Filter items
  const filteredItems = lostFoundItems.filter((item) => {
    if (selectedTagFilter === "all") return true;
    if (selectedTagFilter === "lost") return item.type === "lost" && item.status === "open";
    if (selectedTagFilter === "found") return item.type === "found";
    if (selectedTagFilter === "ready_for_pickup") {
      return item.status === "ready_for_pickup" || (item.type === "found" && item.status === "awaiting_handover");
    }
    if (selectedTagFilter === "claimed") return item.status === "claimed";
    if (selectedTagFilter === "my_items") {
      if (!userEmail) return false;
      const repEmail = typeof item.reporter === "object" && item.reporter !== null ? item.reporter.email : "";
      return repEmail && repEmail.toLowerCase() === userEmail.toLowerCase();
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 text-zinc-950 font-sans">
        {/* Header Bar */}
        <div className="pb-4 border-b border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-emerald-800">Campus Lost & Found Operations</h3>
              {isManagement && (
                <span className="bg-emerald-150 text-emerald-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Management Desk
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {isManagement
                ? "Manage item handovers, log received items, schedule pickup dates, and verify owner claims."
                : "Report lost possessions, track real-time status (Still Missing vs. Found & Claimed), and coordinate pickup with Management."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLostFoundItems}
              className="py-2 px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span> Refresh Feed
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PERSONAL NOTIFICATION ALERT BANNER FOR STUDENT & FACULTY */}
        {/* ============================================================== */}
        {myFoundReadyItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-emerald-50 border-2 border-amber-300 rounded-3xl p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Action Required: Your Reported Lost Item Has Been FOUND!
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed font-medium">
                  Great news! <strong>{myFoundReadyItems.length}</strong> of your reported lost possession(s) have been found and received by Campus Management.
                  Status: <strong>Found & Ready for Pickup (Awaiting Claim)</strong>. Please visit Room 102 with your ID to collect.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {myFoundReadyItems.map((fi: any) => (
                    <span
                      key={fi._id}
                      className="text-[10px] font-black bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-amber-950 shadow-xs"
                    >
                      📍 {fi.title} - Pickup at {fi.pickupLocation || "Room 102"} {fi.pickupDate ? `(by ${new Date(fi.pickupDate).toLocaleDateString()})` : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedTagFilter("my_items")}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow whitespace-nowrap cursor-pointer transition shrink-0"
            >
              View My Found Items
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* COLOR-CODED STATUS NOTIFICATION OVERVIEW CARDS */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: 🔴 Red - Still Missing / Searching */}
          <div
            onClick={() => setSelectedTagFilter(selectedTagFilter === "lost" ? "all" : "lost")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 ${
              selectedTagFilter === "lost"
                ? "bg-rose-100 border-rose-400 ring-2 ring-rose-200"
                : "bg-rose-50/80 border-rose-200 hover:bg-rose-100/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-200/70 px-2.5 py-0.5 rounded-full">
                🔴 Still Missing
              </span>
              <span className="text-xl">🔍</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-950">{notFoundCount}</span>
              <span className="text-xs font-bold text-rose-800">Items Still Missing</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-tight">
              Reported lost by students or faculty that have <strong>not been found yet</strong>. Campus search is active.
            </p>
          </div>

          {/* Card 2: 🟡 Amber - Found & Awaiting Claim */}
          <div
            onClick={() => setSelectedTagFilter(selectedTagFilter === "ready_for_pickup" ? "all" : "ready_for_pickup")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 ${
              selectedTagFilter === "ready_for_pickup"
                ? "bg-amber-100 border-amber-400 ring-2 ring-amber-200"
                : "bg-amber-50/80 border-amber-200 hover:bg-amber-100/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                🟡 Found (Awaiting Claim)
              </span>
              <span className="text-xl">📦</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-950">{foundUnclaimedCount}</span>
              <span className="text-xs font-bold text-amber-800">Found & Ready for Pickup</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Possessions <strong>found & stored at office</strong> waiting for rightful owners to claim.
            </p>
          </div>

          {/* Card 3: 🟢 Green - Claimed & Returned */}
          <div
            onClick={() => setSelectedTagFilter(selectedTagFilter === "claimed" ? "all" : "claimed")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 ${
              selectedTagFilter === "claimed"
                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200"
                : "bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-full">
                🟢 Claimed & Returned
              </span>
              <span className="text-xl">✅</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-950">{claimedCount}</span>
              <span className="text-xs font-bold text-emerald-800">Successfully Returned</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-tight">
              Items verified and <strong>claimed by owners</strong>. Successfully resolved cases.
            </p>
          </div>
        </div>

        {/* Notice for Management */}
        {isManagement && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <div>
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Management Control Active</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  When students submit a found item physically to your office, click <strong>"Mark Received & Set Pickup Schedule"</strong> to assign an official pickup date and room for the owner.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Report Form */}
          <div className="lg:col-span-5 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm self-start">
            <h4 className="text-base font-bold text-zinc-900 mb-3">Report Item to Campus Desk</h4>
            
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setLfType("lost");
                  setProofFile(null);
                  if (proofInputRef.current) proofInputRef.current.value = "";
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  lfType === "lost" ? "bg-rose-100 border-rose-300 text-rose-800 shadow-sm" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                🔴 I Lost an Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setLfType("found");
                  setProofFile(null);
                  if (proofInputRef.current) proofInputRef.current.value = "";
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  lfType === "found" ? "bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                🟢 I Found an Item
              </button>
            </div>

            {lfType === "found" && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>ℹ️</span> Physical Handover Process
                </div>
                <p>
                  After submitting this form, please physically hand over the found item to the <strong>Campus Management Office</strong>. Management will confirm receipt and schedule it for owner collection.
                </p>
              </div>
            )}

            <form onSubmit={handleReportLostFound} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Item Title / Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue HP Laptop, Car Key, Leather Wallet, Scientific Calculator"
                  value={lfTitle}
                  onChange={(e) => setLfTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Item Description & Identifying Marks *</label>
                <textarea
                  required
                  placeholder="Describe color, brand, stickers, unique scratches, or contents inside..."
                  value={lfDesc}
                  onChange={(e) => setLfDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Found/Lost Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block A Room 204"
                    value={lfLocation}
                    onChange={(e) => setLfLocation(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Contact Details *</label>
                  <input
                    type="text"
                    required
                    placeholder="Phone or Email"
                    value={lfContact}
                    onChange={(e) => setLfContact(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Bill/Receipt File Uploader (LOST ONLY) */}
              {lfType === "lost" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Ownership Proof (Purchase Bill, Serial No. Receipt, or ID) *
                  </label>
                  <input
                    type="file"
                    ref={proofInputRef}
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setProofFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Proof confirms ownership to prevent fraudulent claims.</p>
                </div>
              )}

              {/* Optional Item Image (BOTH) */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Item Photo (Optional)</label>
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setItemImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all disabled:opacity-50"
              >
                {uploading ? "Uploading media..." : "Post Item Report"}
              </button>
            </form>
          </div>

          {/* Bulletin Board Feed */}
          <div className="lg:col-span-7 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col space-y-4">
            
            {/* Tag Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2">
              <h4 className="text-base font-bold text-zinc-900">Campus Bulletins ({filteredItems.length})</h4>
              <div className="flex flex-wrap bg-zinc-100 rounded-xl p-1 text-[10px] font-bold">
                <button
                  onClick={() => setSelectedTagFilter("all")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedTagFilter === "all" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  All ({lostFoundItems.length})
                </button>
                <button
                  onClick={() => setSelectedTagFilter("lost")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedTagFilter === "lost" ? "bg-white text-rose-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  🔴 Still Missing ({notFoundCount})
                </button>
                <button
                  onClick={() => setSelectedTagFilter("ready_for_pickup")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedTagFilter === "ready_for_pickup" ? "bg-white text-amber-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  🟡 Found / Unclaimed ({foundUnclaimedCount})
                </button>
                <button
                  onClick={() => setSelectedTagFilter("claimed")}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedTagFilter === "claimed" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  🟢 Claimed ({claimedCount})
                </button>
                {myItems.length > 0 && (
                  <button
                    onClick={() => setSelectedTagFilter("my_items")}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      selectedTagFilter === "my_items" ? "bg-white text-indigo-800 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    👤 My Reported ({myItems.length})
                  </button>
                )}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-xs italic">
                No items found matching the selected filter.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[680px] pr-1">
                {filteredItems.map((item) => {
                  const isAwaitingHandover = item.status === "awaiting_handover" || (item.type === "found" && item.status === "open" && !item.receivedByManagement);
                  const isReadyForPickup = item.status === "ready_for_pickup";
                  const isClaimed = item.status === "claimed";

                  return (
                    <div
                      key={item._id}
                      className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50 hover:bg-zinc-100/60 transition-all flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2.5">
                        {/* Top Badge Row with explicit Color-Coding */}
                        <div className="flex items-center flex-wrap gap-2">
                          <span
                            className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md ${
                              item.type === "lost" ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {item.type === "lost" ? "🔴 Lost Report" : "🟢 Found Item"}
                          </span>

                          {/* Status 1: 🔴 Still Missing / Searching */}
                          {item.type === "lost" && item.status === "open" && (
                            <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>🔴</span>
                              <span>Still Missing</span>
                            </span>
                          )}

                          {/* Status 2: 🟡 Found (Ready for Pickup) */}
                          {isReadyForPickup && (
                            <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                              <span>🟡</span>
                              <span>Found (Ready for Pickup) - Room {item.pickupLocation || "102"}</span>
                            </span>
                          )}

                          {isAwaitingHandover && (
                            <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <span>⏳</span>
                              <span>Found (Awaiting Office Handover)</span>
                            </span>
                          )}

                          {/* Status 3: 🟢 Claimed & Returned */}
                          {isClaimed && (
                            <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                              <span>🟢</span>
                              <span>Claimed & Returned ({item.claimedBy || "Verified Owner"})</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <h5 className="font-extrabold text-zinc-950 text-sm">{item.title}</h5>
                          <p className="text-xs text-zinc-700 leading-relaxed font-medium mt-1">{item.description}</p>
                        </div>

                        {/* Image preview */}
                        {item.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="max-h-32 object-cover rounded-xl border border-zinc-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Meta tags */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500 font-semibold">
                          <span>📍 Location: {item.location}</span>
                          <span>📞 Contact: {item.contact}</span>
                          <span>📅 Reported: {new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.reporter?.email && <span>👤 Reporter: {item.reporter.email}</span>}
                        </div>

                        {/* Proof link for lost item */}
                        {item.proofUrl && (
                          <div className="mt-1">
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-rose-700 hover:underline font-bold flex items-center gap-1"
                            >
                              📄 View Ownership Proof (Bill/Receipt)
                            </a>
                          </div>
                        )}

                        {/* Ready for Pickup Schedule Box */}
                        {isReadyForPickup && (
                          <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-950">
                            <div className="font-bold flex items-center gap-1 text-emerald-900">
                              <span>🗓️</span> Pickup Schedule Details:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                              <div>
                                <strong>Pickup Date:</strong>{" "}
                                {item.pickupDate ? new Date(item.pickupDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "Available Immediately"}
                              </div>
                              <div>
                                <strong>Office Location:</strong> {item.pickupLocation || "Campus Admin Office"}
                              </div>
                            </div>
                            {item.managementNotes && (
                              <div className="text-[11px] text-emerald-800 pt-1">
                                <strong>Management Instructions:</strong> {item.managementNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Claimed Box */}
                        {isClaimed && (
                          <div className="mt-2 p-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-700 space-y-0.5">
                            <div className="font-bold text-zinc-900">🎉 Claimed & Resolved</div>
                            <p className="text-[11px]">
                              Claimed by: <strong>{item.claimedBy || "Verified Owner"}</strong> on{" "}
                              {item.claimedAt ? new Date(item.claimedAt).toLocaleDateString() : new Date(item.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions: Edit, Delete, and Management Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-200/60 mt-1">
                        {/* Edit & Delete Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="py-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                            title="Edit report details"
                          >
                            <span>✏️</span> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                            title="Delete report"
                          >
                            <span>🗑️</span> Delete
                          </button>
                        </div>

                        {/* Management & User Actions */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          {isManagement && !isClaimed && (
                            <>
                              {isAwaitingHandover && (
                                <button
                                  onClick={() => openPickupModal(item)}
                                  className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                                >
                                  <span>📥</span> Mark Received
                                </button>
                              )}
                              
                              <button
                                onClick={() => openClaimModal(item)}
                                className="py-1.5 px-3.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                              >
                                <span>✅</span> Mark Claimed
                              </button>
                            </>
                          )}

                          {!isManagement && !isClaimed && item.type === "lost" && (
                            <button
                              onClick={() => openClaimModal(item)}
                              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                            >
                              Mark as Found / Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Management Set Pickup Date & Location Modal */}
        {selectedItemForPickup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-emerald-100 shadow-2xl p-6 relative space-y-4">
              <button
                onClick={() => setSelectedItemForPickup(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 text-lg"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="text-base font-black text-emerald-950">Receive Item & Schedule Pickup</h3>
                  <p className="text-[11px] text-zinc-500">Item: {selectedItemForPickup.title}</p>
                </div>
              </div>

              <form onSubmit={handleSetReadyForPickup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Pickup Date (When owner can collect) *</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Office / Collection Location *</label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Central Admin Office - Room 102"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Management Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={managementNotes}
                    onChange={(e) => setManagementNotes(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Item locked in Cabinet #3. Must present student ID."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForPickup(null)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {loading ? "Updating..." : "Save & Set Pickup"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Claim Item Verification Modal */}
        {selectedItemForClaim && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-emerald-100 shadow-2xl p-6 relative space-y-4">
              <button
                onClick={() => setSelectedItemForClaim(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 text-lg"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-base font-black text-emerald-950">Mark Item Claimed & Handed Over</h3>
                  <p className="text-[11px] text-zinc-500">Item: {selectedItemForClaim.title}</p>
                </div>
              </div>

              <form onSubmit={handleConfirmClaim} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Claimed By (Student Name / Roll / Email) *</label>
                  <input
                    type="text"
                    required
                    value={claimedByName}
                    onChange={(e) => setClaimedByName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Rahul Sharma (0108CS211045)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Handover Verification Remarks</label>
                  <textarea
                    rows={2}
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Identity verified via Student ID card & purchase receipt matching."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForClaim(null)}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {loading ? "Completing..." : "Confirm Handover & Resolve"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Lost & Found Item Modal */}
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
                  <h3 className="text-base font-black text-zinc-900">Edit Lost & Found Report</h3>
                  <p className="text-[11px] text-zinc-500">Update item details, location, or attachments</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Item Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g. Blue HP Laptop Charger"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Report Type *</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as "lost" | "found")}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="lost">🔴 Lost Item</option>
                      <option value="found">🟢 Found Item</option>
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
                      placeholder="e.g. Library 1st Floor"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Contact Phone / Email *</label>
                  <input
                    type="text"
                    required
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-semibold"
                    placeholder="e.g. 9876543210 / student@ips.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Item Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="Describe specific marks, colors, brand, serial, or where last seen..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">Item Photo (Optional)</label>
                  {editExistingImageUrl && !editImageFile && (
                    <div className="flex items-center gap-3 mb-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <img src={editExistingImageUrl} alt="Item" className="w-12 h-12 object-cover rounded-lg border border-zinc-200" />
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
                    ref={editImageInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditImageFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>

                {editType === "lost" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 mb-1">Ownership Proof (Bill/Receipt/Box)</label>
                    {editExistingProofUrl && !editProofFile && (
                      <div className="flex items-center gap-3 mb-2 p-2 bg-rose-50/70 border border-rose-200 rounded-xl">
                        <span className="text-lg">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-rose-900 truncate">Current Proof Attached</p>
                          <a href={editExistingProofUrl} target="_blank" rel="noreferrer" className="text-[10px] text-rose-700 underline">View current document</a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditExistingProofUrl("")}
                          className="text-xs text-rose-600 font-bold hover:underline px-2 py-1 bg-rose-100/60 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={editProofInputRef}
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditProofFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                    />
                  </div>
                )}

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
