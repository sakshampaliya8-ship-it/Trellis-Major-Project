"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Link from "next/link";
import ResumeBuilder from "../../components/resume/ResumeBuilder";

import { BACKEND_URL } from "@/config/api";

export default function CareerPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // M4 Tab States
  const [careerHubTab, setCareerHubTab] = useState<"profile" | "resume" | "achievements" | "discovery" | "verifications">("profile");
  const [activeResumeTemplate, setActiveResumeTemplate] = useState<string>("minimal");
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [newResumeName, setNewResumeName] = useState("My Main Resume");
  const [facultyRecommendationText, setFacultyRecommendationText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilterBranch, setSearchFilterBranch] = useState("");
  const [searchFilterYear, setSearchFilterYear] = useState("");
  const [searchFilterTag, setSearchFilterTag] = useState("");
  const [discoveredProfiles, setDiscoveredProfiles] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [feedScope, setFeedScope] = useState<"campus" | "following">("campus");
  const [publicProfileData, setPublicProfileData] = useState<any>(null);
  const [isPublicProfileOpen, setIsPublicProfileOpen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Student Credential Lookup States (Faculty/Admin)
  const [searchedStudentCred, setSearchedStudentCred] = useState("");
  const [searchedStudentProfile, setSearchedStudentProfile] = useState<any>(null);
  const [searchedStudentStats, setSearchedStudentStats] = useState<any>(null);
  const [searchStudentLoading, setSearchStudentLoading] = useState(false);
  const [searchStudentError, setSearchStudentError] = useState("");

  // Student Profile fields
  const [profile, setProfile] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Onboarding & Editable fields
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [semester, setSemester] = useState<number>(1);
  const [contact, setContact] = useState("");
  const [bio, setBio] = useState("");
  // Education sub-states
  const [tenthPercentageOrCgpa, setTenthPercentageOrCgpa] = useState("");
  const [tenthBoard, setTenthBoard] = useState("");
  const [tenthSchoolName, setTenthSchoolName] = useState("");
  const [tenthYearOfPassing, setTenthYearOfPassing] = useState("");

  const [twelfthPercentageOrCgpa, setTwelfthPercentageOrCgpa] = useState("");
  const [twelfthBoard, setTwelfthBoard] = useState("");
  const [twelfthSchoolName, setTwelfthSchoolName] = useState("");
  const [twelfthYearOfPassing, setTwelfthYearOfPassing] = useState("");

  const [gradCourseBranch, setGradCourseBranch] = useState("");
  const [gradUniversityName, setGradUniversityName] = useState("");
  const [gradCurrentCgpa, setGradCurrentCgpa] = useState("");
  const [gradCurrentSemester, setGradCurrentSemester] = useState<number>(1);

  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [skills, setSkills] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);

  // Manual Resume Edits state
  const [resumeEdits, setResumeEdits] = useState<any>({
    name: "",
    branch: "",
    graduationYear: "",
    education: "",
    bio: "",
    contact: "",
    github: "",
    linkedin: "",
    portfolio: "",
    skills: [],
    projects: [],
    experience: [],
    certifications: []
  });

  // Profile additions
  const [newProject, setNewProject] = useState({ title: "", description: "", techStack: "", link: "", semester: 1 });
  const [newCert, setNewCert] = useState({ name: "", issuer: "", date: "", proofUrl: "", semester: 1 });
  const [newExp, setNewExp] = useState({ title: "", org: "", duration: "", description: "", semester: 1, type: "Internship" });

  // Achievements fields
  const [achTitle, setAchTitle] = useState("");
  const [achCategory, setAchCategory] = useState("technical");
  const [achLevel, setAchLevel] = useState("college");
  const [achDescription, setAchDescription] = useState("");
  const [achProofUrl, setAchProofUrl] = useState("");
  const [achSemester, setAchSemester] = useState<number>(1);
  const [myAchievementsList, setMyAchievementsList] = useState<any[]>([]);

  // Faculty views
  const [facultyDashboardStudents, setFacultyDashboardStudents] = useState<any[]>([]);
  const [facultyDashboardPendingAch, setFacultyDashboardPendingAch] = useState<any[]>([]);
  const [facultyDashboardVerifiedAch, setFacultyDashboardVerifiedAch] = useState<any[]>([]);
  const [facultyDashboardRejectedAch, setFacultyDashboardRejectedAch] = useState<any[]>([]);
  const [facultyAchTab, setFacultyAchTab] = useState<"pending" | "rejected" | "verified">("pending");

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole);
      setUserEmail(savedEmail);
      if (savedRole === "faculty" || savedRole === "admin") {
        setCareerHubTab("verifications");
      }
    }
  }, []);

  useEffect(() => {
    if (token && userEmail) {
      if (userRole === "admin" || userRole === "faculty") {
        fetchFacultyDashboardData();
        setCareerHubTab((prev) => (prev === "profile" || prev === "resume" || prev === "achievements" ? "verifications" : prev));
      } else {
        fetchStudentProfileData();
      }
      fetchActivityFeed(feedScope);
      handleDiscoverSearch("");
    }
  }, [token, userEmail, userRole, feedScope]);

  useEffect(() => {
    if (profile?._id) {
      fetchMyAchievements();
      fetchSavedResumes();
      // Initialize resume edits snapshot
      setResumeEdits({
        name: profile.name || "",
        branch: profile.branch || "",
        graduationYear: profile.graduationYear || "",
        education: profile.education || "",
        bio: profile.bio || "",
        contact: profile.contact || "",
        github: profile.github || "",
        linkedin: profile.linkedin || "",
        portfolio: profile.portfolio || "",
        skills: profile.skills || [],
        projects: profile.projects || [],
        experience: profile.experience || [],
        certifications: profile.certifications || []
      });
    }
  }, [profile]);

  const handleStudentCredentialLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchedStudentCred.trim();
    if (!query) return;

    setSearchStudentLoading(true);
    setSearchStudentError("");
    setSearchedStudentProfile(null);
    setSearchedStudentStats(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/students/profile/${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        setSearchedStudentProfile(data.profile);
        setSearchedStudentStats(data.stats || null);
      } else {
        setSearchStudentError(data.message || `No student profile found for "${query}". Please check the roll number or email.`);
      }
    } catch (err) {
      setSearchStudentError("Could not reach backend to lookup student profile.");
    } finally {
      setSearchStudentLoading(false);
    }
  };

  const fetchStudentProfileData = async () => {
    if (userRole === "faculty" || userRole === "admin") return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        if (data.needsOnboarding) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
          setProfile(data.profile);
          setHasProfile(true);
          if (data.profile) {
            setName(data.profile.name || "");
            setRollNumber(data.profile.rollNumber || "");
            setBranch(data.profile.branch || "");
            setGraduationYear(data.profile.graduationYear?.toString() || "2026");
            setSemester(data.profile.semester || 1);
            setContact(data.profile.contact || "");
            setBio(data.profile.bio || "");
            const edu = data.profile.education || {};
            setTenthPercentageOrCgpa(edu.tenth?.percentageOrCgpa || "");
            setTenthBoard(edu.tenth?.board || "");
            setTenthSchoolName(edu.tenth?.schoolName || "");
            setTenthYearOfPassing(edu.tenth?.yearOfPassing?.toString() || "");

            setTwelfthPercentageOrCgpa(edu.twelfth?.percentageOrCgpa || "");
            setTwelfthBoard(edu.twelfth?.board || "");
            setTwelfthSchoolName(edu.twelfth?.schoolName || "");
            setTwelfthYearOfPassing(edu.twelfth?.yearOfPassing?.toString() || "");

            setGradCourseBranch(edu.graduation?.courseBranch || "");
            setGradUniversityName(edu.graduation?.universityName || "");
            setGradCurrentCgpa(edu.graduation?.currentCgpa?.toString() || "");
            setGradCurrentSemester(edu.graduation?.currentSemester || 1);

            setGithub(data.profile.github || "");
            setLinkedin(data.profile.linkedin || "");
            setPortfolio(data.profile.portfolio || "");
            setSkills((data.profile.skills || []).join(", "));
            setPhotoUrl(data.profile.photoUrl || "");
            setBannerImage(data.profile.bannerImage || "");
            setIsPublic(data.profile.isPublic !== false);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyAchievements = async () => {
    if (!profile?._id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/achievements/${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setMyAchievementsList(data.achievements);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSavedResumes = async () => {
    if (!profile?._id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/resume/${profile._id}/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSavedResumes(data.resumes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivityFeed = async (scopeQuery = "campus") => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/feed?scope=${scopeQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setActivityFeed(data.feed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDiscoverSearch = async (val: string, br = "", yr = "", tg = "") => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/discover/search?skill=${val}&branch=${br}&year=${yr}&tag=${tg}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setDiscoveredProfiles(data.profiles);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFacultyDashboardData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/faculty/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFacultyDashboardStudents(data.students || []);
        setFacultyDashboardPendingAch(data.pendingAchievements || []);
        setFacultyDashboardVerifiedAch(data.verifiedAchievements || []);
        setFacultyDashboardRejectedAch(data.rejectedAchievements || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNumber || !branch) return;
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          rollNumber,
          branch,
          graduationYear: parseInt(graduationYear),
          semester: semester,
          contact,
          bio,
          education: {
            tenth: {
              percentageOrCgpa: tenthPercentageOrCgpa,
              board: tenthBoard,
              schoolName: tenthSchoolName,
              yearOfPassing: tenthYearOfPassing ? parseInt(tenthYearOfPassing) : undefined
            },
            twelfth: {
              percentageOrCgpa: twelfthPercentageOrCgpa,
              board: twelfthBoard,
              schoolName: twelfthSchoolName,
              yearOfPassing: twelfthYearOfPassing ? parseInt(twelfthYearOfPassing) : undefined
            },
            graduation: {
              courseBranch: gradCourseBranch,
              universityName: gradUniversityName,
              currentCgpa: gradCurrentCgpa ? parseFloat(gradCurrentCgpa) : undefined,
              currentSemester: gradCurrentSemester ? parseInt(gradCurrentSemester.toString()) : undefined
            }
          },
          github,
          linkedin,
          portfolio,
          isPublic,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean)
        })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setHasProfile(true);
        setNeedsOnboarding(false);
        fetchStudentProfileData();
      } else {
        alert(data.message || "Error creating profile");
      }
    } catch (err) {
      alert("Error creating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          rollNumber,
          branch,
          graduationYear: parseInt(graduationYear),
          semester: semester,
          contact,
          bio,
          education: {
            tenth: {
              percentageOrCgpa: tenthPercentageOrCgpa,
              board: tenthBoard,
              schoolName: tenthSchoolName,
              yearOfPassing: tenthYearOfPassing ? parseInt(tenthYearOfPassing) : undefined
            },
            twelfth: {
              percentageOrCgpa: twelfthPercentageOrCgpa,
              board: twelfthBoard,
              schoolName: twelfthSchoolName,
              yearOfPassing: twelfthYearOfPassing ? parseInt(twelfthYearOfPassing) : undefined
            },
            graduation: {
              courseBranch: gradCourseBranch,
              universityName: gradUniversityName,
              currentCgpa: gradCurrentCgpa ? parseFloat(gradCurrentCgpa) : undefined,
              currentSemester: gradCurrentSemester ? parseInt(gradCurrentSemester.toString()) : undefined
            }
          },
          github,
          linkedin,
          portfolio,
          isPublic,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          projects: profile?.projects || [],
          certifications: profile?.certifications || [],
          experience: profile?.experience || []
        })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setIsEditingIntro(false);
        alert("Intro details saved!");
      } else {
        alert(data.message || "Error saving profile");
      }
    } catch (err) {
      alert("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          rollNumber,
          branch,
          graduationYear: parseInt(graduationYear),
          semester: semester,
          contact,
          bio,
          github,
          linkedin,
          portfolio,
          isPublic,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          projects: profile?.projects || [],
          certifications: profile?.certifications || [],
          experience: profile?.experience || [],
          education: {
            tenth: {
              percentageOrCgpa: tenthPercentageOrCgpa,
              board: tenthBoard,
              schoolName: tenthSchoolName,
              yearOfPassing: tenthYearOfPassing ? parseInt(tenthYearOfPassing) : undefined
            },
            twelfth: {
              percentageOrCgpa: twelfthPercentageOrCgpa,
              board: twelfthBoard,
              schoolName: twelfthSchoolName,
              yearOfPassing: twelfthYearOfPassing ? parseInt(twelfthYearOfPassing) : undefined
            },
            graduation: {
              courseBranch: gradCourseBranch,
              universityName: gradUniversityName,
              currentCgpa: gradCurrentCgpa ? parseFloat(gradCurrentCgpa) : undefined,
              currentSemester: gradCurrentSemester ? parseInt(gradCurrentSemester.toString()) : undefined
            }
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setIsEditingEducation(false);
        alert("Education details saved successfully!");
      } else {
        alert(data.message || "Error saving education details");
      }
    } catch (err) {
      alert("Error saving education details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      alert("Allowed formats: JPG, JPEG, PNG, WEBP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Max size is 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      try {
        const payload = type === "avatar" ? { photoUrl: base64 } : { bannerImage: base64 };
        const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          if (type === "avatar") setPhotoUrl(data.profile.photoUrl);
          else setBannerImage(data.profile.bannerImage);
          alert("Image uploaded successfully!");
        }
      } catch (err) {
        alert("Upload failed.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Allowed formats: JPG, JPEG, PNG, WEBP, PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Max size is 5MB");
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
          setAchProofUrl(data.url);
          alert("Certificate file uploaded successfully!");
        } else {
          alert(data.message || "Failed to upload certificate file.");
        }
      } catch (err) {
        alert("Certificate upload connection error.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (type: "avatar" | "banner") => {
    setLoading(true);
    try {
      const payload = type === "avatar" ? { photoUrl: "" } : { bannerImage: "" };
      const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        if (type === "avatar") setPhotoUrl("");
        else setBannerImage("");
        alert("Image removed.");
      }
    } catch (err) {
      alert("Removal failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title) return;
    const updatedProjects = [...(profile?.projects || []), newProject];
    await handleUpdateProfileArrays(updatedProjects, profile?.certifications, profile?.experience);
    setNewProject({ title: "", description: "", techStack: "", link: "", semester: 1 });
  };

  const handleDeleteProject = async (index: number) => {
    const updated = (profile?.projects || []).filter((_: any, i: number) => i !== index);
    await handleUpdateProfileArrays(updated, profile?.certifications, profile?.experience);
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.issuer) return;
    const updatedCerts = [...(profile?.certifications || []), newCert];
    await handleUpdateProfileArrays(profile?.projects, updatedCerts, profile?.experience);
    setNewCert({ name: "", issuer: "", date: "", proofUrl: "", semester: 1 });
  };

  const handleDeleteCertification = async (index: number) => {
    const updated = (profile?.certifications || []).filter((_: any, i: number) => i !== index);
    await handleUpdateProfileArrays(profile?.projects, updated, profile?.experience);
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title || !newExp.org) return;
    const updatedExps = [...(profile?.experience || []), newExp];
    await handleUpdateProfileArrays(profile?.projects, profile?.certifications, updatedExps);
    setNewExp({ title: "", org: "", duration: "", description: "", semester: 1, type: "Internship" });
  };

  const handleDeleteExperience = async (index: number) => {
    const updated = (profile?.experience || []).filter((_: any, i: number) => i !== index);
    await handleUpdateProfileArrays(profile?.projects, profile?.certifications, updated);
  };

  const handleUpdateProfileArrays = async (pList: any, cList: any, eList: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projects: pList,
          certifications: cList,
          experience: eList
        })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      alert("Error saving profile details.");
    }
  };

  const submitAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achTitle || !achDescription) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/achievements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: achTitle,
          category: achCategory,
          level: achLevel,
          description: achDescription,
          proofUrl: achProofUrl,
          semester: achSemester
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Achievement submitted for verification!");
        setAchTitle("");
        setAchDescription("");
        setAchProofUrl("");
        fetchMyAchievements();
      }
    } catch (err) {
      alert("Failed to submit achievement.");
    }
  };

  const handleVerifyAchievementAction = async (achId: string, status: "verified" | "rejected") => {
    let rejectionReason = "";
    if (status === "rejected") {
      const reasonInput = prompt("Enter the reason for declining this achievement claim:");
      if (reasonInput === null) return; // User cancelled
      rejectionReason = reasonInput.trim() || "Declined by faculty (Criteria not met)";
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/achievements/${achId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejectionReason })
      });
      const data = await response.json();
      if (data.success) {
        alert(status === "verified" ? "Achievement approved successfully!" : "Achievement claim declined.");
        fetchFacultyDashboardData();
        if (profile?._id) fetchMyAchievements();
      } else {
        alert(data.message || "Verification update failed.");
      }
    } catch (err) {
      alert("Verification update failed. Network or server error.");
    }
  };

  const handleToggleFollow = async (targetProfileId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/follow/${targetProfileId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert(data.followed ? "Followed!" : "Unfollowed!");
        if (isPublicProfileOpen && publicProfileData?.profile?._id === targetProfileId) {
          fetchPublicProfileView(targetProfileId);
        }
        handleDiscoverSearch(searchQuery, searchFilterBranch, searchFilterYear, searchFilterTag);
      }
    } catch (err) {
      alert("Follow failed.");
    }
  };

  const handleEndorseSkill = async (targetUserId: string, skillName: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/endorse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId: targetUserId, skill: skillName })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Skill ${skillName} endorsed!`);
        if (isPublicProfileOpen) {
          fetchPublicProfileView(publicProfileData.profile._id);
        }
      } else {
        alert(data.message || "Failed to endorse.");
      }
    } catch (err) {
      alert("Endorsement failed.");
    }
  };

  const fetchPublicProfileView = async (targetProfileId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${targetProfileId}/public`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPublicProfileData(data);
        setIsPublicProfileOpen(true);
      }
    } catch (err) {
      alert("Failed to load public profile.");
    }
  };

  const saveResumeVersion = async () => {
    if (!profile?._id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/resume/${profile._id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: activeResumeTemplate,
          name: newResumeName,
          generatedContent: resumeEdits
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Resume snapshot version saved!");
        fetchSavedResumes();
      }
    } catch (err) {
      alert("Failed to save resume version.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!profile?._id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/resume/${profile._id}/generate?template=${activeResumeTemplate}&token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: resumeEdits })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${resumeEdits.name.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error compiling PDF resume.");
    }
  };

  const handleAddFacultyRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyRecommendationText || !publicProfileData?.profile?._id) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/faculty/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: publicProfileData.profile._id,
          text: facultyRecommendationText
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Faculty recommendation posted!");
        setFacultyRecommendationText("");
        fetchPublicProfileView(publicProfileData.profile._id);
      }
    } catch (err) {
      alert("Failed to add recommendation.");
    }
  };

  // Timeline Compiler
  const compileTimeline = () => {
    const itemsBySemester: { [key: number]: any[] } = {};
    for (let s = 1; s <= 8; s++) {
      itemsBySemester[s] = [];
    }

    if (profile) {
      (profile.projects || []).forEach((p: any) => {
        if (p.semester >= 1 && p.semester <= 8) {
          itemsBySemester[p.semester].push({ type: "Project", title: p.title, subtitle: p.techStack, desc: p.description });
        }
      });
      (profile.certifications || []).forEach((c: any) => {
        if (c.semester >= 1 && c.semester <= 8) {
          itemsBySemester[c.semester].push({ type: "Certification", title: c.name, subtitle: c.issuer, desc: c.proofUrl });
        }
      });
      (profile.experience || []).forEach((e: any) => {
        if (e.semester >= 1 && e.semester <= 8) {
          itemsBySemester[e.semester].push({ type: "Experience", title: `${e.title} at ${e.org}`, subtitle: `${e.duration} (${e.type})`, desc: e.description });
        }
      });
    }

    myAchievementsList.forEach((a: any) => {
      if (a.verificationStatus === "verified" && a.semester >= 1 && a.semester <= 8) {
        itemsBySemester[a.semester].push({ type: "Achievement", title: a.title, subtitle: `${a.category} - ${a.level}`, desc: a.description });
      }
    });

    return itemsBySemester;
  };

  const timelineData = compileTimeline();
  const isFaculty = userRole === "faculty" || userRole === "admin";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                {isFaculty ? "Campus Faculty Portal" : "Student Portfolio OS"}
              </span>
            </div>
            <h3 className="text-xl font-black text-emerald-850">
              {isFaculty ? "Student Records & Verifications" : "Professional Identity & Career Hub"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {isFaculty
                ? "Verify student achievement certificates, look up student profiles by roll number or email, and discover campus talent."
                : "Design portfolio, timeline, verified records, and chat with colleagues."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/chat"
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow flex items-center gap-2"
            >
              💬 Messenger Chats
            </Link>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-between items-center bg-zinc-100 p-2 rounded-2xl border border-zinc-200/50">
          <div className="flex gap-2">
            {isFaculty ? (
              <>
                <button
                  onClick={() => setCareerHubTab("verifications")}
                  className={`py-2 px-6 rounded-xl text-xs font-bold transition-all ${
                    careerHubTab === "verifications" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  🎖️ Student Verifications
                </button>
                <button
                  onClick={() => setCareerHubTab("discovery")}
                  className={`py-2 px-6 rounded-xl text-xs font-bold transition-all ${
                    careerHubTab === "discovery" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  🔍 Student Discovery & Lookup
                </button>
              </>
            ) : (
              (["profile", "resume", "achievements", "discovery"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCareerHubTab(tab)}
                  className={`py-2 px-6 rounded-xl text-xs font-bold transition-all ${
                    careerHubTab === tab ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {tab === "profile" && "👤 My Profile"}
                  {tab === "resume" && "📄 Resume Builder"}
                  {tab === "achievements" && "🎖️ Achievements"}
                  {tab === "discovery" && "🔍 Student Discovery"}
                </button>
              ))
            )}
          </div>
          {!isFaculty && profile && (
            <div className="text-xs text-zinc-500 pr-4">
              Profile Completion: <span className="font-extrabold text-emerald-600">{profile.profileCompletionPercent || 0}%</span>
            </div>
          )}
          {isFaculty && (
            <div className="text-xs text-zinc-500 pr-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Faculty Verification Desk
            </div>
          )}
        </div>

        {/* Section 1 for Faculty: Student Verifications */}
        {isFaculty && careerHubTab === "verifications" && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-4">
              <div>
                <h4 className="text-base font-extrabold text-zinc-900">Faculty Verification & Achievement Claims</h4>
                <p className="text-[11px] text-zinc-500">Review student co-curricular certificates, approve points, or decline invalid submissions.</p>
              </div>

              {/* Sub-Tabs: Pending, Declined, Approved */}
              <div className="flex bg-zinc-100 p-1 rounded-xl self-start sm:self-auto gap-1">
                <button
                  onClick={() => setFacultyAchTab("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    facultyAchTab === "pending"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <span>Pending</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    facultyDashboardPendingAch.length > 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {facultyDashboardPendingAch.length}
                  </span>
                </button>

                <button
                  onClick={() => setFacultyAchTab("rejected")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    facultyAchTab === "rejected"
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-zinc-600 hover:text-rose-700"
                  }`}
                >
                  <span>Declined</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    facultyDashboardRejectedAch.length > 0 ? "bg-rose-100 text-rose-800" : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {facultyDashboardRejectedAch.length}
                  </span>
                </button>

                <button
                  onClick={() => setFacultyAchTab("verified")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    facultyAchTab === "verified"
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-zinc-600 hover:text-emerald-800"
                  }`}
                >
                  <span>Approved</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    facultyDashboardVerifiedAch.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {facultyDashboardVerifiedAch.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="space-y-3">
              {facultyAchTab === "pending" && (
                facultyDashboardPendingAch.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-4 text-center">No pending achievement claims awaiting verification.</p>
                ) : (
                  facultyDashboardPendingAch.map((ach) => (
                    <div key={ach._id} className="border border-amber-100 rounded-2xl p-4 bg-amber-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-zinc-900 text-xs">{ach.title}</h5>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1">
                          Submitted by: <span className="font-bold text-zinc-800">{ach.studentId?.name || "Student"}</span> | Branch: <span className="font-semibold">{ach.studentId?.branch || "N/A"}</span> | Category: <span className="uppercase font-bold text-emerald-700">{ach.category}</span> | Level: <span className="uppercase font-bold text-indigo-700">{ach.level}</span>
                        </p>
                        <p className="text-[11px] text-zinc-700 mt-1.5 italic">"{ach.description}"</p>
                        {ach.proofUrl && (
                          <a href={ach.proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 hover:underline font-bold inline-flex items-center gap-1 mt-1.5">
                            📄 View Uploaded Certificate / Proof
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleVerifyAchievementAction(ach._id, "verified")}
                          className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleVerifyAchievementAction(ach._id, "rejected")}
                          className="py-1.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {facultyAchTab === "rejected" && (
                facultyDashboardRejectedAch.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-4 text-center">No declined achievement claims.</p>
                ) : (
                  facultyDashboardRejectedAch.map((ach) => (
                    <div key={ach._id} className="border border-rose-100 rounded-2xl p-4 bg-rose-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-zinc-900 text-xs">{ach.title}</h5>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                            Declined
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1">
                          Submitted by: <span className="font-bold text-zinc-800">{ach.studentId?.name || "Student"}</span> | Category: <span className="uppercase font-bold">{ach.category}</span> | Level: <span className="uppercase font-bold">{ach.level}</span>
                        </p>
                        <p className="text-[11px] text-zinc-700 mt-1 italic">"{ach.description}"</p>
                        <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                          <span className="font-bold">Decline Reason:</span> {ach.rejectionReason || "Criteria not met"}
                        </div>
                        {ach.proofUrl && (
                          <a href={ach.proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 hover:underline font-bold inline-flex items-center gap-1 mt-1.5">
                            📄 View Attached Proof
                          </a>
                        )}
                      </div>
                      <div className="shrink-0">
                        <button
                          onClick={() => handleVerifyAchievementAction(ach._id, "verified")}
                          className="py-1.5 px-3.5 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600 rounded-xl text-xs font-bold border border-zinc-200 transition-all cursor-pointer"
                          title="Re-evaluate and approve"
                        >
                          Re-approve
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {facultyAchTab === "verified" && (
                facultyDashboardVerifiedAch.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-4 text-center">No approved achievement claims yet.</p>
                ) : (
                  facultyDashboardVerifiedAch.map((ach) => (
                    <div key={ach._id} className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-zinc-900 text-xs">{ach.title}</h5>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            Approved
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1">
                          Student: <span className="font-bold text-zinc-800">{ach.studentId?.name || "Student"}</span> | Category: <span className="uppercase font-bold text-emerald-700">{ach.category}</span> | Level: <span className="uppercase font-bold text-indigo-700">{ach.level}</span>
                        </p>
                        <p className="text-[11px] text-zinc-700 mt-1">"{ach.description}"</p>
                        {ach.proofUrl && (
                          <a href={ach.proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 hover:underline font-bold inline-flex items-center gap-1 mt-1.5">
                            📄 View Verified Certificate
                          </a>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-400 block">
                          Verified on {ach.verifiedAt ? new Date(ach.verifiedAt).toLocaleDateString() : "N/A"}
                        </span>
                        {ach.verifiedBy?.email && (
                          <span className="text-[9px] text-emerald-700 font-semibold block">
                            By {ach.verifiedBy.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}

        {/* Tab 1 (Students Only): Profile Display & Timelines */}
        {!isFaculty && careerHubTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {needsOnboarding || !hasProfile ? (
                /* Onboarding setup screen */
                <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-sm">
                  <h4 className="text-base font-bold text-zinc-900 mb-4">Onboard Student Career Profile</h4>
                  <form onSubmit={handleCreateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Roll Number *</label>
                        <input
                          type="text"
                          required
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Branch *</label>
                        <input
                          type="text"
                          required
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Graduation Year *</label>
                        <input
                          type="number"
                          required
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow mt-2"
                    >
                      Onboard Profile
                    </button>
                  </form>
                </div>
              ) : (
                /* Profile Display card */
                <div className="space-y-6">
                  {/* Banner & Circular DP Box layout */}
                  <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm relative">
                    <div className="h-44 bg-zinc-100 relative group overflow-hidden">
                      {bannerImage ? (
                        <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-emerald-700 to-teal-800" />
                      )}
                      <div className="absolute right-4 top-4 flex gap-2">
                        <label className="cursor-pointer bg-black/50 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-black/75">
                          Change Cover
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "banner")} />
                        </label>
                        {bannerImage && (
                          <button
                            onClick={() => handleRemoveImage("banner")}
                            className="bg-red-600/70 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6 relative -mt-16 flex justify-between items-end">
                      <div className="flex gap-4 items-end">
                        <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-md relative overflow-hidden flex items-center justify-center font-bold text-4xl text-emerald-800">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            name ? name[0].toUpperCase() : "S"
                          )}
                          <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                            Upload DP
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "avatar")} />
                          </label>
                        </div>
                        <div className="pb-2">
                          <h4 className="text-xl font-black text-zinc-950">{name}</h4>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(profile.careerTags || []).map((t: string, i: number) => (
                              <span key={i} className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
                                💼 {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditingIntro(!isEditingIntro)}
                          className="py-2 px-5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold shadow-sm"
                        >
                          {isEditingIntro ? "Close" : "Edit Profile"}
                        </button>
                      </div>
                    </div>

                    <div className="px-6 pb-6 border-t border-zinc-100 pt-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase">Biography</p>
                        <p className="text-xs text-zinc-700 leading-relaxed mt-1">{bio || "Add a bio to outline your professional path."}</p>
                      </div>
                      {skills && (
                        <div className="pt-3 border-t border-zinc-100">
                          <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {skills.split(/[|,]/).map((s, i) => s.trim() && (
                              <span key={i} className="bg-emerald-50/50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-100/50">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-zinc-500 pt-2 flex-wrap pb-3">
                        {branch && <span>🌿 Branch: {branch}</span>}
                        {graduationYear && <span>📅 Class of: {graduationYear}</span>}
                        {semester && <span>📈 Semester: {semester}</span>}
                        {userEmail && <span>📧 Email: {userEmail}</span>}
                        {contact && <span>📞 {contact}</span>}
                        {github && <span>🌐 GitHub: {github}</span>}
                        {linkedin && <span>🌐 LinkedIn: {linkedin}</span>}
                        {portfolio && <span>🌐 Portfolio: {portfolio}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Edit intro details form */}
                  {isEditingIntro && (
                    <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
                      <h4 className="text-sm font-bold text-zinc-950 mb-3">Edit Details</h4>
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Graduation Course/Branch</label>
                            <input
                              type="text"
                              value={gradCourseBranch}
                              onChange={(e) => setGradCourseBranch(e.target.value)}
                              placeholder="e.g. B.Tech Computer Science"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Contact Number</label>
                            <input
                              type="text"
                              value={contact}
                              onChange={(e) => setContact(e.target.value)}
                              placeholder="e.g. +91 999999999"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Email Address (Read-only)</label>
                            <input
                              type="email"
                              value={userEmail || ""}
                              disabled
                              className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-400 cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">GitHub URL</label>
                            <input
                              type="text"
                              value={github}
                              onChange={(e) => setGithub(e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">LinkedIn URL</label>
                            <input
                              type="text"
                              value={linkedin}
                              onChange={(e) => setLinkedin(e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Portfolio Link</label>
                            <input
                              type="text"
                              value={portfolio}
                              onChange={(e) => setPortfolio(e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Semester (1-8)</label>
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={semester}
                              onChange={(e) => setSemester(parseInt(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">Skills (comma separated)</label>
                            <input
                              type="text"
                              value={skills}
                              onChange={(e) => setSkills(e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">Bio Description</label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={2}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Save Changes
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Semester Timeline Growth View */}
                  <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
                    <h4 className="text-base font-bold text-zinc-950 mb-6">Career Growth Timeline 📈</h4>
                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((semNo) => {
                        const items = timelineData[semNo] || [];
                        if (items.length === 0) return null;
                        return (
                          <div key={semNo} className="relative pl-8">
                            <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                            <h5 className="font-extrabold text-emerald-800 text-xs uppercase tracking-wider mb-2">Semester {semNo}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {items.map((it, idx) => (
                                <div key={idx} className="border border-zinc-150 rounded-2xl p-4 bg-zinc-50">
                                  <span className="text-[9px] uppercase font-black text-zinc-400 block mb-1">{it.type}</span>
                                  <h6 className="font-extrabold text-zinc-900 text-xs">{it.title}</h6>
                                  {it.subtitle && <p className="text-[10px] text-zinc-500 mt-0.5">{it.subtitle}</p>}
                                  {it.desc && <p className="text-[11px] text-zinc-600 mt-2 italic">"{it.desc}"</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Standalone Education Background Section */}
                  <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                      <h4 className="text-base font-bold text-zinc-950">Education Background 🎓</h4>
                      <button
                        onClick={() => setIsEditingEducation(!isEditingEducation)}
                        className="py-1.5 px-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold shadow-sm"
                      >
                        {isEditingEducation ? "Cancel" : "Edit Education"}
                      </button>
                    </div>

                    {isEditingEducation ? (
                      <form onSubmit={handleSaveEducation} className="space-y-4">
                        {/* Graduation Details */}
                        <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-2xl space-y-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Graduation Details (Single Latest Value)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">University Name</label>
                              <input type="text" value={gradUniversityName} onChange={(e) => setGradUniversityName(e.target.value)} placeholder="e.g. IPS Academy" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Course & Branch</label>
                              <input type="text" value={gradCourseBranch} onChange={(e) => setGradCourseBranch(e.target.value)} placeholder="e.g. B.Tech Computer Science" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Semester</label>
                                <input type="number" value={gradCurrentSemester} onChange={(e) => setGradCurrentSemester(parseInt(e.target.value) || 1)} placeholder="e.g. 6" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1">CGPA</label>
                                <input type="number" step="0.01" value={gradCurrentCgpa} onChange={(e) => setGradCurrentCgpa(e.target.value)} placeholder="e.g. 8.2" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 12th/Diploma Details */}
                        <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-2xl space-y-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">12th Standard / Diploma Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">School/College Name</label>
                              <input type="text" value={twelfthSchoolName} onChange={(e) => setTwelfthSchoolName(e.target.value)} placeholder="e.g. DPS Indore" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Board / University</label>
                              <input type="text" value={twelfthBoard} onChange={(e) => setTwelfthBoard(e.target.value)} placeholder="e.g. CBSE / MP Board" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Year</label>
                                <input type="number" value={twelfthYearOfPassing} onChange={(e) => setTwelfthYearOfPassing(e.target.value)} placeholder="e.g. 2020" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Marks</label>
                                <input type="text" value={twelfthPercentageOrCgpa} onChange={(e) => setTwelfthPercentageOrCgpa(e.target.value)} placeholder="e.g. 85%" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 10th Details */}
                        <div className="bg-zinc-50/50 p-4 border border-zinc-200 rounded-2xl space-y-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">10th Standard Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">School Name</label>
                              <input type="text" value={tenthSchoolName} onChange={(e) => setTenthSchoolName(e.target.value)} placeholder="e.g. DPS Indore" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Board</label>
                              <input type="text" value={tenthBoard} onChange={(e) => setTenthBoard(e.target.value)} placeholder="e.g. CBSE" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Year</label>
                                <input type="number" value={tenthYearOfPassing} onChange={(e) => setTenthYearOfPassing(e.target.value)} placeholder="e.g. 2018" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Marks</label>
                                <input type="text" value={tenthPercentageOrCgpa} onChange={(e) => setTenthPercentageOrCgpa(e.target.value)} placeholder="e.g. 9.8 CGPA" className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Save Education Details
                        </button>
                      </form>
                    ) : (
                      /* Display read-only structured blocks */
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-700 bg-zinc-50/50 p-4 border border-zinc-150 rounded-2xl">
                        {profile?.education?.graduation && (profile.education.graduation.courseBranch || profile.education.graduation.universityName) ? (
                          <div>
                            <p className="font-extrabold text-[10px] text-zinc-400 uppercase mb-0.5">Graduation</p>
                            <p className="font-bold text-emerald-800">{profile.education.graduation.courseBranch || "N/A"}</p>
                            <p className="text-zinc-500">{profile.education.graduation.universityName || "N/A"}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Sem: {profile.education.graduation.currentSemester || "N/A"} | CGPA: {profile.education.graduation.currentCgpa || "N/A"}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-extrabold text-[10px] text-zinc-400 uppercase mb-0.5">Graduation</p>
                            <p className="text-zinc-400 italic">No graduation details filled yet.</p>
                          </div>
                        )}

                        {profile?.education?.twelfth && (profile.education.twelfth.schoolName || profile.education.twelfth.percentageOrCgpa) ? (
                          <div>
                            <p className="font-extrabold text-[10px] text-zinc-400 uppercase mb-0.5">12th Standard / Diploma</p>
                            <p className="font-bold text-zinc-800">{profile.education.twelfth.schoolName || "N/A"}</p>
                            <p className="text-zinc-500">{profile.education.twelfth.board || "N/A"}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Year: {profile.education.twelfth.yearOfPassing || "N/A"} | Marks: {profile.education.twelfth.percentageOrCgpa || "N/A"}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-extrabold text-[10px] text-zinc-400 uppercase mb-0.5">12th Standard / Diploma</p>
                            <p className="text-zinc-400 italic">No 12th details filled yet.</p>
                          </div>
                        )}

                        {profile?.education?.tenth && (profile.education.tenth.schoolName || profile.education.tenth.percentageOrCgpa) ? (
                          <div>
                            <p className="font-extrabold text-[10px] text-zinc-400 uppercase mb-0.5">10th Standard</p>
                            <p className="font-bold text-zinc-800">{profile.education.tenth.schoolName || "N/A"}</p>
                            <p className="text-zinc-500">{profile.education.tenth.board || "N/A"}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Year: {profile.education.tenth.yearOfPassing || "N/A"} | Marks: {profile.education.tenth.percentageOrCgpa || "N/A"}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-extrabold text-[10px] text-zinc-400 uppercase mb-0.5">10th Standard</p>
                            <p className="text-zinc-400 italic">No 10th details filled yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Portfolio components management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Projects */}
                    <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                      <h5 className="text-sm font-bold text-zinc-900">Manage Projects</h5>
                      <form onSubmit={handleAddProject} className="space-y-2 border-b border-zinc-100 pb-4">
                        <input
                          type="text"
                          placeholder="Project Title"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Tech Stack"
                          value={newProject.techStack}
                          onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Demo Link"
                            value={newProject.link}
                            onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Semester (1-8)"
                            value={newProject.semester}
                            onChange={(e) => setNewProject({ ...newProject, semester: parseInt(e.target.value) || 1 })}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                            min={1}
                            max={8}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Description Details"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <button type="submit" className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                          Add Project
                        </button>
                      </form>
                      <div className="space-y-2">
                        {(profile.projects || []).map((p: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                            <div>
                              <p className="text-xs font-extrabold text-zinc-950">{p.title} (Sem {p.semester})</p>
                              <p className="text-[10px] text-zinc-500">{p.techStack}</p>
                            </div>
                            <button onClick={() => handleDeleteProject(index)} className="text-xs text-red-600 font-bold hover:underline">Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experiences */}
                    <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
                      <h5 className="text-sm font-bold text-zinc-900">Manage Experience</h5>
                      <form onSubmit={handleAddExperience} className="space-y-2 border-b border-zinc-100 pb-4">
                        <input
                          type="text"
                          placeholder="Role/Title"
                          value={newExp.title}
                          onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Organization"
                          value={newExp.org}
                          onChange={(e) => setNewExp({ ...newExp, org: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                          required
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Duration (e.g. 3 months)"
                            value={newExp.duration}
                            onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                          />
                          <select
                            value={newExp.type}
                            onChange={(e) => setNewExp({ ...newExp, type: e.target.value })}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                          >
                            <option value="Internship">Internship</option>
                            <option value="Work Experience">Work Experience</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Research">Research</option>
                            <option value="Volunteer">Volunteer</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Semester"
                            value={newExp.semester}
                            onChange={(e) => setNewExp({ ...newExp, semester: parseInt(e.target.value) || 1 })}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                            min={1}
                            max={8}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Description Details"
                          value={newExp.description}
                          onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <button type="submit" className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                          Add Experience
                        </button>
                      </form>
                      <div className="space-y-2">
                        {(profile.experience || []).map((exp: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                            <div>
                              <p className="text-xs font-extrabold text-zinc-950">{exp.title} at {exp.org}</p>
                              <p className="text-[10px] text-zinc-500">{exp.duration} ({exp.type}) | Sem {exp.semester}</p>
                            </div>
                            <button onClick={() => handleDeleteExperience(index)} className="text-xs text-red-600 font-bold hover:underline">Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2 (Students Only): Resume builder */}
        {!isFaculty && careerHubTab === "resume" && (
          <ResumeBuilder />
        )}

        {/* Tab 3 (Students Only): Achievements */}
        {!isFaculty && careerHubTab === "achievements" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm self-start space-y-4">
              <h4 className="text-base font-bold text-zinc-900">Log Co-curricular / Achievements</h4>
              <form onSubmit={submitAchievement} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Achievement Title *</label>
                  <input
                    type="text"
                    required
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs"
                    placeholder="e.g. Indore Inter-college Basketball Gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Category *</label>
                    <select
                      value={achCategory}
                      onChange={(e) => setAchCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="technical">Technical</option>
                      <option value="academic">Academic</option>
                      <option value="sports">Sports</option>
                      <option value="cultural">Cultural</option>
                      <option value="leadership">Leadership</option>
                      <option value="social-work">Social Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Level *</label>
                    <select
                      value={achLevel}
                      onChange={(e) => setAchLevel(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="college">College</option>
                      <option value="state">State</option>
                      <option value="national">National</option>
                      <option value="international">International</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Semester (1-8) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={8}
                      value={achSemester}
                      onChange={(e) => setAchSemester(parseInt(e.target.value) || 1)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Upload Certificate File</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleCertificateFileUpload}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">Certificate Code / Link</label>
                    <input
                      type="text"
                      value={achProofUrl}
                      onChange={(e) => setAchProofUrl(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs"
                      placeholder="e.g. CERT-12345 or drive.google.com/cert"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">Detailed Description *</label>
                  <textarea
                    required
                    value={achDescription}
                    onChange={(e) => setAchDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Submit Achievement
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-zinc-900 mb-2">My Submissions</h4>
              {myAchievementsList.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-6 text-center">No achievements logged yet.</p>
              ) : (
                myAchievementsList.map((ach) => (
                  <div key={ach._id} className="border border-zinc-150 rounded-2xl p-4 bg-zinc-50 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-zinc-900 text-xs">{ach.title}</h5>
                        <span className="text-[9px] font-extrabold bg-zinc-250 text-zinc-600 rounded px-2 py-0.5 uppercase">{ach.level}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{ach.description}</p>
                      {ach.proofUrl && (
                        <a href={ach.proofUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline font-extrabold block mt-2">
                          🔗 View Proof Document
                        </a>
                      )}
                      {ach.status === "rejected" && ach.rejectionReason && (
                        <p className="text-[10px] text-red-600 font-extrabold mt-1">Rejection Reason: {ach.rejectionReason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full ${ach.status === "verified" ? "bg-emerald-100 text-emerald-800" : ach.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                        {ach.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Discovery Directory & Student Lookup */}
        {careerHubTab === "discovery" && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
              <div>
                <h4 className="text-base font-extrabold text-zinc-900">
                  {isFaculty ? "Student Discovery & Credential Lookup" : "Student Talent Directory"}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isFaculty
                    ? "Look up complete verified student credentials or discover student talent across campus."
                    : "Discover peers, connect with fellow campus innovators, and explore student achievements."}
                </p>
              </div>
            </div>

            {/* Student Credential Lookup Section */}
            <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                    <span>🪪</span>
                    <span>Student Credential Lookup</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Lookup complete student records, verified achievements, and CGPA by entering their College Roll Number or registered Email ID.
                  </p>
                </div>
                {searchedStudentProfile && (
                  <button
                    onClick={() => {
                      setSearchedStudentProfile(null);
                      setSearchedStudentStats(null);
                      setSearchedStudentCred("");
                      setSearchStudentError("");
                    }}
                    className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 underline self-start sm:self-auto cursor-pointer"
                  >
                    Clear Lookup
                  </button>
                )}
              </div>

              <form onSubmit={handleStudentCredentialLookup} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter Student Roll Number or Email (e.g. 21BCS101 or student@college.edu)"
                    value={searchedStudentCred}
                    onChange={(e) => {
                      setSearchedStudentCred(e.target.value);
                      if (searchStudentError) setSearchStudentError("");
                    }}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner"
                  />
                  {searchedStudentCred && (
                    <button
                      type="button"
                      onClick={() => setSearchedStudentCred("")}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searchStudentLoading || !searchedStudentCred.trim()}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {searchStudentLoading ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Find Student Record
                    </>
                  )}
                </button>
              </form>

              {searchStudentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{searchStudentError}</span>
                </div>
              )}

              {/* Searched Student Info Card */}
              {searchedStudentProfile && (
                <div className="mt-4 bg-white border-2 border-emerald-300/80 rounded-2xl p-5 shadow-md">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 overflow-hidden flex items-center justify-center font-black text-xl text-emerald-800 shrink-0 shadow-sm">
                        {searchedStudentProfile.photoUrl ? (
                          <img src={searchedStudentProfile.photoUrl} alt={searchedStudentProfile.name} className="w-full h-full object-cover" />
                        ) : (
                          searchedStudentProfile.name?.[0]?.toUpperCase() || "S"
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-base font-extrabold text-zinc-950">{searchedStudentProfile.name}</h5>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {searchedStudentProfile.rollNumber}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {searchedStudentProfile.branch} &bull; Class of {searchedStudentProfile.graduationYear} &bull; Semester {searchedStudentProfile.semester || 1}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          ✉️ {searchedStudentProfile.user?.email || searchedStudentProfile.email || "No email"} {searchedStudentProfile.contact ? `| 📞 ${searchedStudentProfile.contact}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => fetchPublicProfileView(searchedStudentProfile._id)}
                        className="flex-1 md:flex-initial py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📜</span>
                        View Full Portfolio Card
                      </button>
                      {searchedStudentProfile.user?._id && (
                        <Link
                          href={`/chat?recipient=${searchedStudentProfile.user._id}`}
                          className="py-2 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>💬</span>
                          Message
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-zinc-100">
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">CGPA</span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {searchedStudentProfile.cgpa || searchedStudentProfile.education?.graduation?.currentCgpa || "N/A"}
                      </span>
                    </div>
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Verified Badges</span>
                      <span className="text-sm font-extrabold text-indigo-700">
                        {searchedStudentStats?.verifiedAchievementsCount ?? (searchedStudentProfile.verifiedAchievementsCount || 0)}
                      </span>
                    </div>
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Projects</span>
                      <span className="text-sm font-extrabold text-zinc-800">
                        {searchedStudentProfile.projects?.length || 0}
                      </span>
                    </div>
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Certificates</span>
                      <span className="text-sm font-extrabold text-zinc-800">
                        {searchedStudentProfile.certifications?.length || 0}
                      </span>
                    </div>
                  </div>

                  {searchedStudentProfile.bio && (
                    <p className="text-xs text-zinc-600 italic pt-3">
                      "{searchedStudentProfile.bio}"
                    </p>
                  )}

                  {searchedStudentProfile.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {searchedStudentProfile.skills.map((skill: string, sIdx: number) => (
                        <span key={sIdx} className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-emerald-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search skills (e.g. React)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleDiscoverSearch(e.target.value, searchFilterBranch, searchFilterYear, searchFilterTag);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
              />
              <input
                type="text"
                placeholder="Filter Branch"
                value={searchFilterBranch}
                onChange={(e) => {
                  setSearchFilterBranch(e.target.value);
                  handleDiscoverSearch(searchQuery, e.target.value, searchFilterYear, searchFilterTag);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
              />
              <input
                type="text"
                placeholder="Filter Graduation Year"
                value={searchFilterYear}
                onChange={(e) => {
                  setSearchFilterYear(e.target.value);
                  handleDiscoverSearch(searchQuery, searchFilterBranch, e.target.value, searchFilterTag);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
              />
              <input
                type="text"
                placeholder="Filter Career Tag"
                value={searchFilterTag}
                onChange={(e) => {
                  setSearchFilterTag(e.target.value);
                  handleDiscoverSearch(searchQuery, searchFilterBranch, searchFilterYear, e.target.value);
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoveredProfiles.length === 0 ? (
                <p className="text-xs text-zinc-400 italic col-span-3 text-center py-10">No students matched search filters.</p>
              ) : (
                discoveredProfiles.map((p) => {
                  // Don't show private profiles of others
                  if (!p.isPublic && p.user?._id !== profile?.user?._id) return null;
                  return (
                    <div key={p._id} className="border border-zinc-150 rounded-2xl p-5 bg-zinc-50 space-y-4 relative overflow-hidden flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center font-bold text-emerald-800 text-lg">
                            {p.photoUrl ? <img src={p.photoUrl} alt="Avatar" className="w-full h-full object-cover" /> : p.name[0].toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-zinc-950 text-sm">{p.name}</h5>
                            <p className="text-[10px] text-zinc-500">{p.rollNumber} | Branch: {p.branch} | Class of {p.graduationYear}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(p.careerTags || []).map((tg: string, idx: number) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-100">
                              💼 {tg}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-zinc-600 line-clamp-2">{p.bio}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50">
                        <button
                          onClick={() => fetchPublicProfileView(p._id)}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow text-center"
                        >
                          View Profile Card
                        </button>
                        {p.user?._id !== profile?.user?._id && (
                          <Link
                            href={`/chat?recipient=${p.user?._id}`}
                            className="py-1.5 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg text-[10px] font-bold text-center flex items-center justify-center"
                          >
                            💬 Send Message
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Public Profile View Overlay Modal */}
      {isPublicProfileOpen && publicProfileData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-emerald-100 shadow-2xl relative flex flex-col max-h-[85vh]">

            {/* Banner cover overlay */}
            <div className="h-28 bg-emerald-700 relative shrink-0">
              {publicProfileData.profile.bannerImage && (
                <img src={publicProfileData.profile.bannerImage} alt="Cover" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => setIsPublicProfileOpen(false)}
                className="absolute right-4 top-4 text-white bg-black/30 hover:bg-black/50 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 relative -mt-10 overflow-y-auto space-y-4">
              <div className="flex gap-3 items-end">
                <div className="w-20 h-20 rounded-full bg-white border-2 border-white shadow overflow-hidden flex items-center justify-center font-bold text-2xl text-emerald-800 shrink-0">
                  {publicProfileData.profile.photoUrl ? (
                    <img src={publicProfileData.profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    publicProfileData.profile.name[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-950">{publicProfileData.profile.name}</h4>
                  <p className="text-[10px] text-zinc-500">{publicProfileData.profile.branch} | Class of {publicProfileData.profile.graduationYear} | Sem {publicProfileData.profile.semester}</p>
                </div>
              </div>

              {/* Follow Button */}
              {publicProfileData.profile.user?._id !== profile?.user?._id && (
                <button
                  onClick={() => handleToggleFollow(publicProfileData.profile._id)}
                  className={`w-full py-2 rounded-xl text-xs font-bold shadow-sm ${publicProfileData.isFollowing ? "bg-zinc-100 text-zinc-700" : "bg-emerald-600 text-white"
                    }`}
                >
                  {publicProfileData.isFollowing ? "✓ Following" : "Follow"}
                </button>
              )}

              {/* Bio details */}
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Bio</p>
                <p className="text-xs text-zinc-700 leading-relaxed">{publicProfileData.profile.bio || "No biography provided."}</p>
              </div>

              {/* Career tags */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Career Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {publicProfileData.profile.careerTags?.map((tg: string, i: number) => (
                    <span key={i} className="bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
                      💼 {tg}
                    </span>
                  ))}
                  {(!publicProfileData.profile.careerTags || publicProfileData.profile.careerTags.length === 0) && (
                    <span className="text-xs text-zinc-400 italic">No career tags calculated.</span>
                  )}
                </div>
              </div>

              {/* Education details */}
              {publicProfileData.profile.education && typeof publicProfileData.profile.education === "object" && (
                <div className="space-y-2 border-t border-zinc-100 pt-3">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Education</p>
                  <div className="space-y-2 text-xs text-zinc-700 bg-zinc-50 p-3 border border-zinc-200 rounded-2xl">
                    {publicProfileData.profile.education.graduation && (publicProfileData.profile.education.graduation.courseBranch || publicProfileData.profile.education.graduation.universityName) && (
                      <div>
                        <p className="font-extrabold text-[9px] text-zinc-450 uppercase">Graduation</p>
                        <p className="font-bold text-emerald-800">{publicProfileData.profile.education.graduation.courseBranch}</p>
                        <p className="text-zinc-500">{publicProfileData.profile.education.graduation.universityName} | Sem {publicProfileData.profile.education.graduation.currentSemester} | CGPA: {publicProfileData.profile.education.graduation.currentCgpa}</p>
                      </div>
                    )}
                    {publicProfileData.profile.education.twelfth && (publicProfileData.profile.education.twelfth.schoolName || publicProfileData.profile.education.twelfth.percentageOrCgpa) && (
                      <div className="border-t border-zinc-200/50 pt-1.5">
                        <p className="font-extrabold text-[9px] text-zinc-450 uppercase">12th Standard</p>
                        <p className="font-bold text-zinc-800">{publicProfileData.profile.education.twelfth.schoolName}</p>
                        <p className="text-zinc-500">{publicProfileData.profile.education.twelfth.board} (Passing Year: {publicProfileData.profile.education.twelfth.yearOfPassing}) | Marks: {publicProfileData.profile.education.twelfth.percentageOrCgpa}</p>
                      </div>
                    )}
                    {publicProfileData.profile.education.tenth && (publicProfileData.profile.education.tenth.schoolName || publicProfileData.profile.education.tenth.percentageOrCgpa) && (
                      <div className="border-t border-zinc-200/50 pt-1.5">
                        <p className="font-extrabold text-[9px] text-zinc-450 uppercase">10th Standard</p>
                        <p className="font-bold text-zinc-800">{publicProfileData.profile.education.tenth.schoolName}</p>
                        <p className="text-zinc-500">{publicProfileData.profile.education.tenth.board} (Passing Year: {publicProfileData.profile.education.tenth.yearOfPassing}) | Marks: {publicProfileData.profile.education.tenth.percentageOrCgpa}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills & Endorsements */}
              <div className="space-y-2 border-t border-zinc-100 pt-3">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Skills & Endorsements</p>
                <div className="space-y-1.5">
                  {publicProfileData.profile.skills?.map((skill: string, i: number) => {
                    const count = publicProfileData.endorsements?.filter((e: any) => e.skill === skill).length || 0;
                    return (
                      <div key={i} className="flex justify-between items-center bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                        <span className="text-xs font-bold text-zinc-800">{skill}</span>
                        {publicProfileData.profile.user?._id !== profile?.user?._id ? (
                          <button
                            onClick={() => handleEndorseSkill(publicProfileData.profile.user?._id, skill)}
                            className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-200"
                          >
                            Endorse ({count})
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-bold">({count} Endorsements)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Faculty recommendations */}
              <div className="space-y-3 border-t border-zinc-100 pt-3">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Faculty Recommendations</p>
                <div className="space-y-2">
                  {publicProfileData.recommendations?.map((rec: any) => (
                    <div key={rec._id} className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs text-zinc-700 leading-relaxed">"{rec.text}"</p>
                      <span className="text-[9px] text-emerald-800 font-extrabold block mt-2">Recommended by: {rec.facultyId?.email}</span>
                    </div>
                  ))}
                  {(!publicProfileData.recommendations || publicProfileData.recommendations.length === 0) && (
                    <p className="text-xs text-zinc-400 italic">No recommendations left yet.</p>
                  )}
                </div>

                {/* Faculty add recommendation form */}
                {(userRole === "faculty" || userRole === "admin") && (
                  <form onSubmit={handleAddFacultyRecommendation} className="space-y-2 border-t border-zinc-100 pt-2">
                    <textarea
                      placeholder="Write a recommendation for this student..."
                      value={facultyRecommendationText}
                      onChange={(e) => setFacultyRecommendationText(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs"
                      required
                    />
                    <button type="submit" className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm">
                      Post Recommendation
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
