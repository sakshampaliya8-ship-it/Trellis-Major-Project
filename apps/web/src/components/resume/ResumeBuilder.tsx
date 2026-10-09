"use client";

import React, { useState, useEffect, useCallback } from "react";
import PersonalInfoForm, { PersonalInfo } from "./PersonalInfoForm";
import EducationForm, { EducationItem } from "./EducationForm";
import SkillsForm, { SkillsData } from "./SkillsForm";
import ProjectsForm, { ProjectItem } from "./ProjectsForm";
import ExperienceForm, { ExperienceItem } from "./ExperienceForm";
import CertificationsForm, { CertificationItem } from "./CertificationsForm";
import AchievementsForm, { AchievementItem } from "./AchievementsForm";
import TemplateSelector, { ResumeTemplateType } from "./TemplateSelector";
import ResumePreview, { ResumeData } from "./ResumePreview";

import { BACKEND_URL } from "@/config/api";

const defaultResumeData: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: ""
  },
  summary: "",
  education: [],
  skills: {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    tools: [],
    otherSkills: []
  },
  projects: [],
  experience: [],
  certifications: [],
  achievements: []
};

export default function ResumeBuilder() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeTitle, setResumeTitle] = useState<string>("My Professional Resume");
  const [template, setTemplate] = useState<ResumeTemplateType>("modern");
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  
  // Section Navigation
  const [activeSection, setActiveSection] = useState<
    "personal" | "summary" | "education" | "skills" | "experience" | "projects" | "certifications" | "achievements"
  >("personal");

  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [savedResumesList, setSavedResumesList] = useState<any[]>([]);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Load Auth Token
  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedEmail = localStorage.getItem("trellis_email");
    if (savedToken) {
      setToken(savedToken);
      setUserEmail(savedEmail);
    }
  }, []);

  const showStatus = (text: string, type: "success" | "error" | "info" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const prefillFromCareerProfile = useCallback(async () => {
    if (!token || !userEmail) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.profile) {
        const p = data.profile;
        
        // Map education
        const initialEducation: EducationItem[] = [];
        if (p.education?.graduation && (p.education.graduation.courseBranch || p.education.graduation.universityName)) {
          initialEducation.push({
            level: "graduation",
            institution: p.education.graduation.universityName || "IPS Academy Institute of Engineering",
            degree: "Bachelor of Technology",
            branch: p.education.graduation.courseBranch || p.branch || "",
            startYear: (p.graduationYear ? (p.graduationYear - 4).toString() : "2022"),
            endYear: p.graduationYear?.toString() || "2026",
            cgpa: p.education.graduation.currentCgpa ? p.education.graduation.currentCgpa.toString() : (p.cgpa?.toString() || "")
          });
        }
        if (p.education?.twelfth && (p.education.twelfth.schoolName || p.education.twelfth.percentageOrCgpa)) {
          initialEducation.push({
            level: "12th",
            institution: p.education.twelfth.schoolName || "",
            degree: "Class XII (Senior Secondary)",
            branch: p.education.twelfth.board || "CBSE / State Board",
            startYear: (p.education.twelfth.yearOfPassing ? (p.education.twelfth.yearOfPassing - 2).toString() : ""),
            endYear: p.education.twelfth.yearOfPassing?.toString() || "",
            cgpa: p.education.twelfth.percentageOrCgpa || ""
          });
        }
        if (p.education?.tenth && (p.education.tenth.schoolName || p.education.tenth.percentageOrCgpa)) {
          initialEducation.push({
            level: "10th",
            institution: p.education.tenth.schoolName || "",
            degree: "Class X (Secondary School)",
            branch: p.education.tenth.board || "CBSE / State Board",
            startYear: "",
            endYear: p.education.tenth.yearOfPassing?.toString() || "",
            cgpa: p.education.tenth.percentageOrCgpa || ""
          });
        }

        // Map skills
        const rawSkills = Array.isArray(p.skills) ? p.skills : [];
        const initialSkills: SkillsData = {
          programmingLanguages: rawSkills.filter((s: string) => 
            /c\+\+|java|python|javascript|typescript|c#|golang|rust|php|ruby|c\b/i.test(s)
          ),
          frameworks: rawSkills.filter((s: string) => 
            /react|node|express|next|vue|angular|django|flask|spring|tailwind|bootstrap/i.test(s)
          ),
          databases: rawSkills.filter((s: string) => 
            /sql|mongo|postgres|redis|firebase|oracle|dynamo/i.test(s)
          ),
          tools: rawSkills.filter((s: string) => 
            /git|github|docker|linux|postman|vscode|aws|azure|figma|jira/i.test(s)
          ),
          otherSkills: rawSkills.filter((s: string) => 
            !/c\+\+|java|python|javascript|typescript|c#|golang|rust|php|ruby|c\b|react|node|express|next|vue|angular|django|flask|spring|tailwind|bootstrap|sql|mongo|postgres|redis|firebase|oracle|dynamo|git|github|docker|linux|postman|vscode|aws|azure|figma|jira/i.test(s)
          )
        };

        // If categories are empty but skills exist, put them into languages or other
        if (rawSkills.length > 0 && Object.values(initialSkills).every(arr => arr.length === 0)) {
          initialSkills.programmingLanguages = rawSkills;
        }

        // Map projects
        const initialProjects: ProjectItem[] = (p.projects || []).map((proj: any) => ({
          name: proj.title || "",
          description: proj.description || "",
          technologies: proj.techStack || "",
          githubUrl: proj.link?.includes("github") ? proj.link : "",
          liveDemoUrl: !proj.link?.includes("github") ? (proj.link || "") : ""
        }));

        // Map experience
        const initialExperience: ExperienceItem[] = (p.experience || []).map((exp: any) => ({
          company: exp.org || "",
          role: exp.title || "",
          startDate: "",
          endDate: exp.duration || "",
          description: exp.description || ""
        }));

        // Map certifications
        const initialCerts: CertificationItem[] = (p.certifications || []).map((cert: any) => ({
          name: cert.name || "",
          organization: cert.issuer || "",
          date: cert.date ? new Date(cert.date).toLocaleDateString() : "",
          credentialUrl: cert.proofUrl || ""
        }));

        // Fetch verified achievements
        let initialAchievements: AchievementItem[] = [];
        try {
          const achRes = await fetch(`${BACKEND_URL}/api/achievements/${p._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const achData = await achRes.json();
          if (achData.success && Array.isArray(achData.achievements)) {
            initialAchievements = achData.achievements.map((a: any) => ({
              title: a.title || "",
              description: a.description || "",
              date: a.createdAt ? new Date(a.createdAt).getFullYear().toString() : ""
            }));
          }
        } catch (e) {
          console.warn("Could not fetch achievements:", e);
        }

        setResumeData({
          personalInfo: {
            fullName: p.name || "",
            email: p.user?.email || userEmail || "",
            phone: p.contact || "",
            location: "Indore, MP, India",
            linkedin: p.linkedin || "",
            github: p.github || "",
            portfolio: p.portfolio || ""
          },
          summary: p.bio || `Motivated ${p.branch || "Engineering"} student with hands-on project experience in full-stack development, algorithms, and collaborative problem-solving.`,
          education: initialEducation,
          skills: initialSkills,
          projects: initialProjects,
          experience: initialExperience,
          certifications: initialCerts,
          achievements: initialAchievements
        });

        showStatus("Imported profile data into Resume Builder!", "info");
      }
    } catch (err) {
      console.error("Error prefilling from profile:", err);
    }
  }, [token, userEmail]);

  const loadInitialData = useCallback(async () => {
    try {
      // 1. Check for existing saved resumes
      const resResumes = await fetch(`${BACKEND_URL}/api/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataResumes = await resResumes.json();
      
      if (dataResumes.success && dataResumes.resumes && dataResumes.resumes.length > 0) {
        setSavedResumesList(dataResumes.resumes);
        const latestResume = dataResumes.resumes[0];
        setResumeId(latestResume._id);
        setResumeTitle(latestResume.title || "My Professional Resume");
        setTemplate(latestResume.template || "modern");
        setResumeData({
          personalInfo: latestResume.personalInfo || defaultResumeData.personalInfo,
          summary: latestResume.summary || "",
          education: latestResume.education || [],
          skills: latestResume.skills || defaultResumeData.skills,
          projects: latestResume.projects || [],
          experience: latestResume.experience || [],
          certifications: latestResume.certifications || [],
          achievements: latestResume.achievements || []
        });
        showStatus("Loaded your saved resume!", "info");
      } else {
        // 2. Pre-fill from Student Career Profile
        await prefillFromCareerProfile();
      }
    } catch (err) {
      console.error("Failed to load initial resume data:", err);
      prefillFromCareerProfile();
    }
  }, [token, prefillFromCareerProfile]);

  // Fetch initial profile & saved resumes
  useEffect(() => {
    if (token && userEmail) {
      loadInitialData();
    }
  }, [token, userEmail, loadInitialData]);

  const handleSaveResume = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const payload = {
        title: resumeTitle,
        template,
        ...resumeData
      };

      const url = resumeId ? `${BACKEND_URL}/api/resume/${resumeId}` : `${BACKEND_URL}/api/resume`;
      const method = resumeId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setResumeId(data.resume._id);
        showStatus("Resume saved successfully!", "success");
        // refresh list
        const resList = await fetch(`${BACKEND_URL}/api/resume`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataList = await resList.json();
        if (dataList.success && dataList.resumes) {
          setSavedResumesList(dataList.resumes);
        }
      } else {
        showStatus(data.message || "Failed to save resume", "error");
      }
    } catch (err) {
      console.error("Save resume error:", err);
      showStatus("Error saving resume to server", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token) return;
    setIsDownloading(true);
    try {
      const payload = {
        template,
        ...resumeData
      };

      const res = await fetch(`${BACKEND_URL}/api/resume/preview-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("PDF generation failed");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = (resumeData.personalInfo.fullName || "Resume").replace(/\s+/g, "_");
      link.href = downloadUrl;
      link.download = `${name}_${template}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showStatus("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF Download error:", err);
      showStatus("Failed to download PDF. Please try again.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const sectionsList: {
    id: typeof activeSection;
    label: string;
    icon: string;
    count?: number;
  }[] = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "summary", label: "Summary", icon: "📝" },
    { id: "education", label: "Education", icon: "🎓", count: resumeData.education.length },
    { id: "skills", label: "Skills", icon: "⚡", count: Object.values(resumeData.skills).reduce((acc, curr) => acc + (curr?.length || 0), 0) },
    { id: "experience", label: "Experience", icon: "💼", count: resumeData.experience.length },
    { id: "projects", label: "Projects", icon: "🚀", count: resumeData.projects.length },
    { id: "certifications", label: "Certifications", icon: "📜", count: resumeData.certifications.length },
    { id: "achievements", label: "Achievements", icon: "🏆", count: resumeData.achievements.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="font-black text-lg text-emerald-900 bg-transparent border-b border-dashed border-emerald-300 focus:border-emerald-600 outline-none px-1"
              title="Click to rename resume"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Customize, live preview, and download your professional resume.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={prefillFromCareerProfile}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            title="Import all data again from your Career Profile"
          >
            <span>🔄</span> Sync Profile
          </button>

          <button
            type="button"
            onClick={handleSaveResume}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>💾</span>
            <span>{isSaving ? "Saving..." : "Save Resume"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>📥</span>
            <span>{isDownloading ? "Preparing PDF..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : statusMessage.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Toggle: Editor vs Preview */}
      <div className="lg:hidden flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileView === "editor" ? "bg-white text-emerald-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          ✏️ Edit Resume
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileView === "preview" ? "bg-white text-emerald-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          👁️ Live Preview
        </button>
      </div>

      {/* Main Grid: Left Editor & Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Form Editor */}
        <div className={`lg:col-span-6 space-y-6 ${mobileView === "preview" ? "hidden lg:block" : "block"}`}>
          {/* 1. Template Selector */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm">
            <TemplateSelector
              selectedTemplate={template}
              onSelect={(tpl) => setTemplate(tpl)}
            />
          </div>

          {/* 2. Section Selector Tabs */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-100">
              {sectionsList.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <span>{sec.icon}</span>
                    <span>{sec.label}</span>
                    {sec.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-emerald-700 text-white" : "bg-zinc-200 text-zinc-700"
                      }`}>
                        {sec.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Section Form Rendering */}
            <div>
              {activeSection === "personal" && (
                <PersonalInfoForm
                  data={resumeData.personalInfo}
                  onChange={(updated) => setResumeData({ ...resumeData, personalInfo: updated })}
                />
              )}

              {activeSection === "summary" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Professional Summary</h4>
                      <p className="text-[11px] text-zinc-500">2-4 sentence overview of your career goals, skills, and background.</p>
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows={5}
                      value={resumeData.summary}
                      onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                      placeholder="e.g. Dedicated Computer Science student with a strong foundation in full-stack web development and problem solving..."
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-3.5 text-xs outline-none transition-colors leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {activeSection === "education" && (
                <EducationForm
                  education={resumeData.education}
                  onChange={(updated) => setResumeData({ ...resumeData, education: updated })}
                  onAutoFillFromProfile={prefillFromCareerProfile}
                />
              )}

              {activeSection === "skills" && (
                <SkillsForm
                  skills={resumeData.skills}
                  onChange={(updated) => setResumeData({ ...resumeData, skills: updated })}
                />
              )}

              {activeSection === "experience" && (
                <ExperienceForm
                  experience={resumeData.experience}
                  onChange={(updated) => setResumeData({ ...resumeData, experience: updated })}
                />
              )}

              {activeSection === "projects" && (
                <ProjectsForm
                  projects={resumeData.projects}
                  onChange={(updated) => setResumeData({ ...resumeData, projects: updated })}
                />
              )}

              {activeSection === "certifications" && (
                <CertificationsForm
                  certifications={resumeData.certifications}
                  onChange={(updated) => setResumeData({ ...resumeData, certifications: updated })}
                />
              )}

              {activeSection === "achievements" && (
                <AchievementsForm
                  achievements={resumeData.achievements}
                  onChange={(updated) => setResumeData({ ...resumeData, achievements: updated })}
                />
              )}
            </div>

            {/* Quick Next/Previous Navigation */}
            <div className="flex justify-between border-t border-zinc-100 pt-4">
              <button
                type="button"
                disabled={activeSection === "personal"}
                onClick={() => {
                  const idx = sectionsList.findIndex(s => s.id === activeSection);
                  if (idx > 0) setActiveSection(sectionsList[idx - 1].id);
                }}
                className="px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
              >
                ← Previous Section
              </button>

              <button
                type="button"
                disabled={activeSection === "achievements"}
                onClick={() => {
                  const idx = sectionsList.findIndex(s => s.id === activeSection);
                  if (idx < sectionsList.length - 1) setActiveSection(sectionsList[idx + 1].id);
                }}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold disabled:opacity-30"
              >
                Next Section →
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Preview Paper */}
        <div className={`lg:col-span-6 sticky top-6 ${mobileView === "editor" ? "hidden lg:block" : "block"}`}>
          <ResumePreview
            data={resumeData}
            template={template}
            onDownloadPdf={handleDownloadPdf}
            isDownloading={isDownloading}
          />
        </div>
      </div>
    </div>
  );
}
