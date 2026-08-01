import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const Certifications = lazy(() => import('./pages/Certifications'));
const Internship = lazy(() => import('./pages/Internship'));
const UpcomingBatches = lazy(() => import('./pages/UpcomingBatches'));
const Corporate = lazy(() => import('./pages/Corporate'));
const ToolsPreview = lazy(() => import('./pages/ToolsPreview'));
const Login = lazy(() => import('./pages/Login'));

// Admin Modules (Slice 3)
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const BatchConfig = lazy(() => import('./pages/admin/BatchConfig'));
const ClassScheduler = lazy(() => import('./pages/admin/ClassScheduler'));
const StudyMaterials = lazy(() => import('./pages/admin/StudyMaterials'));
const CertInquiries = lazy(() => import('./pages/admin/CertInquiries'));
const AIConfig = lazy(() => import('./pages/admin/AIConfig'));

// Student Modules (Slice 4)
const StudentOverview = lazy(() => import('./pages/student/Overview'));
const ProtectedPlayer = lazy(() => import('./pages/student/ProtectedPlayer'));
const UnlockModal = lazy(() => import('./pages/student/UnlockModal'));

// AI Career Tools Suite (Phase 1B & Phase 2)
const ResumeBuilder = lazy(() => import('./pages/tools/ResumeBuilder'));
const ATSChecker = lazy(() => import('./pages/tools/ATSChecker'));
const JDTailor = lazy(() => import('./pages/tools/JDTailor'));
const LinkedInAnalyser = lazy(() => import('./pages/tools/LinkedInAnalyser'));
const CoverLetterBuilder = lazy(() => import('./pages/tools/CoverLetterBuilder'));
const InterviewPrepKit = lazy(() => import('./pages/tools/InterviewPrepKit'));

// Phase 2 Real-Time Voice & Avatar Tools
const LiveInterviewStage = lazy(() => import('./pages/tools/LiveInterviewStage'));

// I-Assist Phase 3
const IAssistDashboard = lazy(() => import('./pages/tools/iassist/Dashboard'));
const IAssistSessionDetail = lazy(() => import('./pages/tools/iassist/SessionDetail'));
const IAssistAssistants = lazy(() => import('./pages/tools/iassist/Assistants'));
const IAssistDocuments = lazy(() => import('./pages/tools/iassist/Documents'));

// Fallback for lazy loading
const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-bg-canvas text-white">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
  </div>
);

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-center"><h1 className="text-2xl font-bold text-white">{title}</h1></div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/certifications" element={<Certifications />} />
                  <Route path="/internship" element={<Internship />} />
                  <Route path="/upcoming-batches" element={<UpcomingBatches />} />
                  <Route path="/corporate" element={<Corporate />} />
                  <Route path="/tools/:toolId" element={<ToolsPreview />} />
                  <Route path="/login" element={<Login />} />

                  {/* Direct Public Tool Routes */}
                  <Route path="/tools/live-interview" element={<LiveInterviewStage />} />
                </Route>

                {/* Admin Routes (Slice 3) */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/dashboard/admin" element={<DashboardLayout variant="admin" />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="batches" element={<BatchConfig />} />
                    <Route path="scheduler" element={<ClassScheduler />} />
                    <Route path="upcoming" element={<UpcomingBatches />} />
                    <Route path="materials" element={<StudyMaterials />} />
                    <Route path="certifications" element={<Certifications />} />
                    <Route path="cert-inquiries" element={<CertInquiries />} />
                    <Route path="ai-config" element={<AIConfig />} />
                    <Route path="*" element={<Placeholder title="Admin Module Content" />} />
                  </Route>
                </Route>

                {/* Student Routes (Slice 4, Phase 1B & Phase 2 Tools) */}
                <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
                  <Route path="/dashboard/student" element={<DashboardLayout variant="student" />}>
                    <Route index element={<StudentOverview />} />
                    <Route path="materials" element={<ProtectedPlayer />} />
                    <Route path="schedule" element={<ClassScheduler />} />
                    <Route path="certifications" element={<Certifications />} />
                    <Route path="unlock" element={<UnlockModal />} />

                    {/* AI Career Tools Suite */}
                    <Route path="tools/resume-builder" element={<ResumeBuilder />} />
                    <Route path="tools/ats-checker" element={<ATSChecker />} />
                    <Route path="tools/tailor-resume" element={<JDTailor />} />
                    <Route path="tools/linkedin-analyser" element={<LinkedInAnalyser />} />
                    <Route path="tools/cover-letter" element={<CoverLetterBuilder />} />
                    <Route path="tools/interview-prep" element={<InterviewPrepKit />} />

                    {/* Phase 2 Real-Time Voice & Avatar Tools */}
                    <Route path="tools/live-interview" element={<LiveInterviewStage />} />

                    {/* I-Assist Phase 3 */}
                    <Route path="tools/i-assist" element={<IAssistDashboard />} />
                    <Route path="tools/i-assist/session/:id" element={<IAssistSessionDetail />} />
                    <Route path="tools/i-assist/assistants" element={<IAssistAssistants />} />
                    <Route path="tools/i-assist/documents" element={<IAssistDocuments />} />

                    <Route path="*" element={<Placeholder title="Student Module Content" />} />
                  </Route>
                </Route>

                <Route path="/unauthorized" element={<Placeholder title="Unauthorized Access" />} />
                <Route path="*" element={<Placeholder title="404 Not Found" />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
