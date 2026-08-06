import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./theme";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { UpgradeProvider } from "./context/UpgradeContext";
import UpgradeDialog from "./components/UpgradeDialog";

// Public Pages
const Home = lazy(() => import("./pages/Home"));
const Courses = lazy(() => import("./pages/Courses"));
const Certifications = lazy(() => import("./pages/Certifications"));
const Internship = lazy(() => import("./pages/Internship"));
const UpcomingBatches = lazy(() => import("./pages/UpcomingBatches"));
const Corporate = lazy(() => import("./pages/Corporate"));
const ToolsPreview = lazy(() => import("./pages/ToolsPreview"));
const Login = lazy(() => import("./pages/Login"));
const DesktopAuthorize = lazy(() => import("./pages/DesktopAuthorize"));

// Admin Modules (Slice 3)
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const BatchConfig = lazy(() => import("./pages/admin/BatchConfig"));
const ClassScheduler = lazy(() => import("./pages/admin/ClassScheduler"));
const StudyMaterials = lazy(() => import("./pages/admin/StudyMaterials"));
const CertInquiries = lazy(() => import("./pages/admin/CertInquiries"));
const ThemeAssetsManager = lazy(
  () => import("./pages/admin/ThemeAssetsManager"),
);
const AdminAIConfig = lazy(() => import("./pages/admin/AIConfig"));
const MenuEditor = lazy(() => import("./pages/admin/MenuEditor"));
const HeroBanners = lazy(() => import("./pages/admin/HeroBanners"));
const ResumeTemplates = lazy(() => import("./pages/admin/ResumeTemplates"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const InternshipsManager = lazy(
  () => import("./pages/admin/InternshipsManager"),
);
const CorporateCourses = lazy(() => import("./pages/admin/CorporateCourses"));
const CoursesManager = lazy(() => import("./pages/admin/CoursesManager"));
const UpcomingManager = lazy(() => import("./pages/admin/UpcomingManager"));
const CertificationsManager = lazy(
  () => import("./pages/admin/CertificationsManager"),
);

// Student Modules (Slice 4)
const StudentOverview = lazy(() => import("./pages/student/Overview"));
const ProtectedPlayer = lazy(() => import("./pages/student/ProtectedPlayer"));
const UnlockModal = lazy(() => import("./pages/student/UnlockModal"));
const StudentSchedule = lazy(() => import("./pages/student/Schedule"));
const StudentCertifications = lazy(
  () => import("./pages/student/Certifications"),
);

// AI Career Tools Suite (Phase 1B & Phase 2)
const ResumeBuilder = lazy(() => import("./pages/tools/ResumeBuilder"));
const ATSChecker = lazy(() => import("./pages/tools/ATSChecker"));
const JDTailor = lazy(() => import("./pages/tools/JDTailor"));
const LinkedInAnalyser = lazy(() => import("./pages/tools/LinkedInAnalyser"));
const CoverLetterBuilder = lazy(
  () => import("./pages/tools/CoverLetterBuilder"),
);
const InterviewPrepKit = lazy(() => import("./pages/tools/InterviewPrepKit"));
const UploadEnhance = lazy(() => import("./pages/tools/UploadEnhance"));
const StatusPage = lazy(() => import("./pages/StatusPage"));

// Phase 2 Real-Time Voice & Avatar Tools
const LiveInterviewStage = lazy(
  () => import("./pages/tools/LiveInterviewStage"),
);

// I-Assist Phase 3 + Phase 6
const IAssistPreview = lazy(() => import("./pages/tools/IAssistPreview"));
const IAssistDashboard = lazy(() => import("./pages/tools/iassist/Dashboard"));
const IAssistSessionDetail = lazy(
  () => import("./pages/tools/iassist/SessionDetail"),
);
const IAssistAssistants = lazy(
  () => import("./pages/tools/iassist/Assistants"),
);
const IAssistDocuments = lazy(() => import("./pages/tools/iassist/Documents"));

// Fallback for lazy loading
const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-bg-canvas text-white">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
  </div>
);

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-white">{title}</h1>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <UpgradeProvider>
              <UpgradeDialog />
              <BrowserRouter>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route
                        path="/certifications"
                        element={<Certifications />}
                      />
                      <Route path="/internship" element={<Internship />} />
                      <Route
                        path="/upcoming-batches"
                        element={<UpcomingBatches />}
                      />
                      <Route path="/corporate" element={<Corporate />} />
                      <Route path="/tools/:toolId" element={<ToolsPreview />} />
                      <Route path="/login" element={<Login />} />

                      {/* Direct Public Tool Routes */}
                      <Route
                        path="/tools/i-assist"
                        element={<IAssistPreview />}
                      />
                      <Route
                        path="/tools/live-interview"
                        element={<LiveInterviewStage />}
                      />
                    </Route>

                    {/* Admin Routes (Slice 3) */}
                    <Route
                      element={<ProtectedRoute allowedRoles={["admin"]} />}
                    >
                      <Route
                        path="/dashboard/admin"
                        element={<DashboardLayout variant="admin" />}
                      >
                        <Route index element={<AdminOverview />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="batches" element={<BatchConfig />} />
                        <Route path="scheduler" element={<ClassScheduler />} />
                        <Route path="materials" element={<StudyMaterials />} />
                        <Route
                          path="cert-inquiries"
                          element={<CertInquiries />}
                        />
                        <Route
                          path="theme-assets"
                          element={<ThemeAssetsManager />}
                        />
                        <Route path="ai-config" element={<AdminAIConfig />} />
                        <Route path="upcoming" element={<UpcomingManager />} />
                        <Route
                          path="certifications"
                          element={<CertificationsManager />}
                        />
                        <Route path="menu" element={<MenuEditor />} />
                        <Route path="banners" element={<HeroBanners />} />
                        <Route path="templates" element={<ResumeTemplates />} />
                        <Route path="logs" element={<AuditLogs />} />
                        <Route
                          path="internships"
                          element={<InternshipsManager />}
                        />
                        <Route
                          path="corporate"
                          element={<CorporateCourses />}
                        />
                        <Route path="courses" element={<CoursesManager />} />
                        <Route
                          path="*"
                          element={<Placeholder title="Admin Module Content" />}
                        />
                      </Route>
                    </Route>

                    {/* Career Toolkit — open to everyone, including signed-out
                    visitors. They get the full editing experience; saving and
                    exporting are gated inside the tools, which is the whole
                    point of the funnel. Without this group every /dashboard/tools
                    URL falls through to the 404 route. */}
                    <Route>
                      <Route
                        path="/dashboard/tools"
                        element={<DashboardLayout variant="tools" />}
                      >
                        <Route
                          index
                          element={<Navigate to="resume-builder" replace />}
                        />
                        <Route
                          path="resume-builder"
                          element={<ResumeBuilder />}
                        />
                        <Route path="ats-checker" element={<ATSChecker />} />
                        <Route path="tailor-resume" element={<JDTailor />} />
                        <Route
                          path="linkedin-analyser"
                          element={<LinkedInAnalyser />}
                        />
                        <Route
                          path="cover-letter"
                          element={<CoverLetterBuilder />}
                        />
                        <Route
                          path="interview-prep"
                          element={<InterviewPrepKit />}
                        />
                        <Route
                          path="upload-enhance"
                          element={<UploadEnhance />}
                        />
                        <Route path="i-assist" element={<IAssistPreview />} />
                        <Route
                          path="live-interview"
                          element={<LiveInterviewStage />}
                        />
                        <Route path="unlock" element={<UnlockModal />} />
                        <Route
                          path="*"
                          element={<StatusPage kind="notFound" />}
                        />
                      </Route>
                    </Route>

                    {/* Student Routes (Slice 4, Phase 1B & Phase 2 Tools) */}
                    <Route
                      element={
                        <ProtectedRoute allowedRoles={["student", "admin"]} />
                      }
                    >
                      <Route
                        path="/dashboard/student"
                        element={<DashboardLayout variant="student" />}
                      >
                        <Route index element={<StudentOverview />} />
                        <Route path="materials" element={<ProtectedPlayer />} />
                        <Route path="schedule" element={<StudentSchedule />} />
                        <Route
                          path="certifications"
                          element={<StudentCertifications />}
                        />
                        <Route path="unlock" element={<UnlockModal />} />

                        {/* AI Career Tools Suite */}
                        <Route
                          path="tools/resume-builder"
                          element={<ResumeBuilder />}
                        />
                        <Route
                          path="tools/ats-checker"
                          element={<ATSChecker />}
                        />
                        <Route
                          path="tools/tailor-resume"
                          element={<JDTailor />}
                        />
                        <Route
                          path="tools/linkedin-analyser"
                          element={<LinkedInAnalyser />}
                        />
                        <Route
                          path="tools/cover-letter"
                          element={<CoverLetterBuilder />}
                        />
                        <Route
                          path="tools/interview-prep"
                          element={<InterviewPrepKit />}
                        />

                        {/* Phase 2 Real-Time Voice & Avatar Tools */}
                        <Route
                          path="tools/live-interview"
                          element={<LiveInterviewStage />}
                        />

                        {/* I-Assist Phase 3 */}
                        <Route
                          path="tools/i-assist"
                          element={<IAssistDashboard />}
                        />
                        <Route
                          path="tools/i-assist/session/:id"
                          element={<IAssistSessionDetail />}
                        />
                        <Route
                          path="tools/i-assist/assistants"
                          element={<IAssistAssistants />}
                        />
                        <Route
                          path="tools/i-assist/documents"
                          element={<IAssistDocuments />}
                        />

                        <Route
                          path="*"
                          element={
                            <Placeholder title="Student Module Content" />
                          }
                        />
                      </Route>
                    </Route>

                    {/* Desktop Auth (standalone — no layout wrapper) */}
                    <Route
                      path="/desktop-authorize"
                      element={<DesktopAuthorize />}
                    />

                    <Route
                      path="/unauthorized"
                      element={<StatusPage kind="unauthorized" />}
                    />
                    <Route path="*" element={<StatusPage kind="notFound" />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </UpgradeProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
