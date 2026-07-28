// NxtGen Academy — Shared TypeScript Types

// ─── User Types ───

export type UserRole = 'ADMIN' | 'STUDENT' | 'SITE_USER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  tokens: AuthTokens;
}

// ─── Course Types ───

export type CourseCategory = 'AI' | 'DATABASE';

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  topics: string[];
  duration: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  category: CourseCategory;
  description: string;
  shortDesc: string | null;
  modules: CourseModule[] | null;
  thumbnail: string | null;
  duration: string | null;
  prerequisites: string | null;
  careerOutcomes: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ─── Batch Types ───

export type BatchStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  driveFolder: string | null;
  status: BatchStatus;
  course?: Course;
}

// ─── Certification Types ───

export interface Certification {
  id: string;
  name: string;
  provider: string | null;
  link: string | null;
  prerequisite: string | null;
  isActive: boolean;
  ctaEnabled: boolean;
}

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

export interface CertificationInquiry {
  id: string;
  certificationId: string | null;
  certificationName: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  message: string | null;
  status: InquiryStatus;
  createdAt: string;
}

// ─── Internship Types ───

export type InternshipType = 'GENERATIVE_AI' | 'AGENTIC_AI';

export interface ProjectHighlight {
  title: string;
  description: string;
  icon?: string;
}

export interface Internship {
  id: string;
  title: string;
  description: string;
  programType: InternshipType;
  duration: string;
  eligibility: string | null;
  learningOutcomes: string[] | null;
  projectHighlights: ProjectHighlight[] | null;
  isActive: boolean;
  applicationLink: string | null;
  startDate: string | null;
}

// ─── Subscription Types ───

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string | null;
}

// ─── Study Material Types ───

export type MaterialType = 'NOTES' | 'RECORDING' | 'ASSIGNMENT' | 'QUIZ';

export interface StudyMaterial {
  id: string;
  batchId: string;
  type: MaterialType;
  title: string;
  driveFileId: string | null;
  driveUrl: string | null;
  description: string | null;
  createdAt: string;
}

// ─── Class Schedule Types ───

export interface ClassSchedule {
  id: string;
  batchId: string;
  title: string;
  dateTime: string;
  zoomLink: string | null;
  duration: number | null;
  status: string;
}

// ─── Menu & Config Types ───

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  icon: string | null;
  children?: MenuItem[];
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ─── API Response Types ───

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
