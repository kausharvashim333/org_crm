import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { SuperAdminRoute, PartnerRoute } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollProgress from './components/ui/ScrollProgress';
import ScrollToTop from './components/ui/ScrollToTop';
import Spotlight from './components/ui/Spotlight';

// Public Pages (Lazy)
const PublicHomepage = lazy(() => import('./pages/public/Homepage'));
const OrgHomepage = lazy(() => import('./pages/public/OrgHomepage'));
const OrgAboutPage = lazy(() => import('./pages/public/OrgAboutPage'));
const OrgContactPage = lazy(() => import('./pages/public/OrgContactPage'));
const OrgServicesPage = lazy(() => import('./pages/public/OrgServicesPage'));
const OrgCoursesPage = lazy(() => import('./pages/public/OrgCoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/public/CourseDetailPage'));
const CourseCheckoutPage = lazy(() => import('./pages/public/CourseCheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/public/OrderSuccessPage'));
const OrgFranchisePage = lazy(() => import('./pages/public/OrgFranchisePage'));
const PartnerApplyPage = lazy(() => import('./pages/public/PartnerApplyPage'));
const PartnerReceiptPage = lazy(() => import('./pages/public/PartnerReceiptPage'));
const PartnerAboutPage = lazy(() => import('./pages/public/PartnerAboutPage'));
const PartnerContactPage = lazy(() => import('./pages/public/PartnerContactPage'));
const FranchisesList = lazy(() => import('./pages/public/FranchisesList'));
const CertificateVerify = lazy(() => import('./pages/public/CertificateVerify'));
const OrgNoticesPage = lazy(() => import('./pages/public/OrgNoticesPage'));
const OrgGalleryPage = lazy(() => import('./pages/public/OrgGalleryPage'));
const UniversalAdmissionPage = lazy(() => import('./pages/public/UniversalAdmissionPage'));
const PublicPartnerAdmissionPage = lazy(() => import('./pages/public/PublicPartnerAdmissionPage'));
const AdmissionReceiptPage = lazy(() => import('./pages/public/AdmissionReceiptPage'));
const StudentVerifyPage = lazy(() => import('./pages/public/StudentVerifyPage'));
const FranchiseVerificationPage = lazy(() => import('./pages/public/FranchiseVerificationPage'));
const PartnerCoursesPage = lazy(() => import('./pages/public/PartnerCoursesPage'));
const PartnerFacultyPage = lazy(() => import('./pages/public/PartnerFacultyPage'));
const PartnerGalleryPage = lazy(() => import('./pages/public/PartnerGalleryPage'));
const PartnerNoticesPage = lazy(() => import('./pages/public/PartnerNoticesPage'));

// SuperAdmin Pages (Lazy)
const SuperAdminLogin = lazy(() => import('./pages/superadmin/Login'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const Franchises = lazy(() => import('./pages/superadmin/Franchises'));
const AllStudents = lazy(() => import('./pages/superadmin/AllStudents'));
const AdminCourses = lazy(() => import('./pages/superadmin/Courses'));
const AdminOrders = lazy(() => import('./pages/superadmin/AdminOrders'));
const AdminCoupons = lazy(() => import('./pages/superadmin/AdminCoupons'));
const AdminProjects = lazy(() => import('./pages/superadmin/Projects'));
const Royalty = lazy(() => import('./pages/superadmin/Royalty'));
const AdminCertificates = lazy(() => import('./pages/superadmin/Certificates'));
const AdminMaterials = lazy(() => import('./pages/superadmin/Materials'));
const AdminNotifications = lazy(() => import('./pages/superadmin/Notifications'));
const AdminSettings = lazy(() => import('./pages/superadmin/Settings'));
const OrgHomepageEditor = lazy(() => import('./pages/superadmin/OrgHomepageEditor'));
const AdminInquiries = lazy(() => import('./pages/superadmin/AdminInquiries'));
const RolesAndPermissions = lazy(() => import('./pages/superadmin/RolesAndPermissions'));
const SubAdminStaff = lazy(() => import('./pages/superadmin/SubAdminStaff'));
const AuditLogs = lazy(() => import('./pages/superadmin/AuditLogs'));
const SecurityAndBackup = lazy(() => import('./pages/superadmin/SecurityAndBackup'));
const AdminAddons = lazy(() => import('./pages/superadmin/AdminAddons'));

// Partner Pages (Lazy)
const PartnerLogin = lazy(() => import('./pages/partner/Login'));
const PartnerDashboard = lazy(() => import('./pages/partner/Dashboard'));
const PartnerStudents = lazy(() => import('./pages/partner/Students'));
const PartnerCourses = lazy(() => import('./pages/partner/Courses'));
const PartnerBatches = lazy(() => import('./pages/partner/Batches'));
const PartnerFees = lazy(() => import('./pages/partner/Fees'));
const PartnerStaff = lazy(() => import('./pages/partner/Staff'));
const PartnerAttendance = lazy(() => import('./pages/partner/Attendance'));
const PartnerExams = lazy(() => import('./pages/partner/Exams'));
const PartnerProjects = lazy(() => import('./pages/partner/Projects'));
const PartnerMaterials = lazy(() => import('./pages/partner/Materials'));
const PartnerCertificates = lazy(() => import('./pages/partner/Certificates'));
const PartnerInquiries = lazy(() => import('./pages/partner/Inquiries'));
const PartnerHomepage = lazy(() => import('./pages/partner/HomepageEditor'));
const PartnerSettings = lazy(() => import('./pages/partner/Settings'));
const PartnerAdmissionPage = lazy(() => import('./pages/partner/PartnerAdmissionPage'));
const PartnerPendingApprovals = lazy(() => import('./pages/partner/PendingApprovals'));
const PartnerAddons = lazy(() => import('./pages/partner/Addons'));

// Student Pages (Lazy)
const StudentLogin = lazy(() => import('./pages/student/Login'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentCoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const StudentAssessment = lazy(() => import('./pages/student/Assessment'));
const CertificateView = lazy(() => import('./pages/student/CertificateView'));
const StudentTakeExam = lazy(() => import('./pages/student/TakeExam'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Loading page...</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    let ticking = false;
    const handleGlobalMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const target = e.target?.closest ? e.target.closest('.mirror-shine') : null;
          if (target) {
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            target.style.setProperty('--x', `${x}px`);
            target.style.setProperty('--y', `${y}px`);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  return (
    <ErrorBoundary>
    <ScrollProgress />
    <Spotlight />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<OrgHomepage />} />
        <Route path="/about" element={<OrgAboutPage />} />
        <Route path="/contact" element={<OrgContactPage />} />
        <Route path="/services" element={<OrgServicesPage />} />
        <Route path="/courses" element={<OrgCoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/checkout/:courseId" element={<CourseCheckoutPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/franchise" element={<OrgFranchisePage />} />
        <Route path="/franchise/apply" element={<PartnerApplyPage />} />
        <Route path="/franchise/receipt/:franchiseId" element={<PartnerReceiptPage />} />
        <Route path="/franchise-receipt/:franchiseId" element={<PartnerReceiptPage />} />
        <Route path="/verify-franchise/:franchiseId" element={<FranchiseVerificationPage />} />
        <Route path="/franchises" element={<FranchisesList />} />
        <Route path="/verify-certificate" element={<CertificateVerify />} />
        <Route path="/notices" element={<OrgNoticesPage />} />
        <Route path="/gallery" element={<OrgGalleryPage />} />
        <Route path="/admission" element={<UniversalAdmissionPage />} />
        <Route path="/apply" element={<UniversalAdmissionPage />} />
        <Route path="/admission-receipt/:applicationNo" element={<AdmissionReceiptPage />} />
        <Route path="/admission/receipt/:applicationNo" element={<AdmissionReceiptPage />} />
        <Route path="/verify-student/:applicationNo" element={<StudentVerifyPage />} />
        <Route path="/institute/:slug" element={<PublicHomepage />} />
        <Route path="/institute/:slug/admission" element={<PublicPartnerAdmissionPage />} />
        <Route path="/institute/:slug/apply" element={<PublicPartnerAdmissionPage />} />
        <Route path="/institute/:slug/courses" element={<PartnerCoursesPage />} />
        <Route path="/institute/:slug/faculty" element={<PartnerFacultyPage />} />
        <Route path="/institute/:slug/gallery" element={<PartnerGalleryPage />} />
        <Route path="/institute/:slug/notices" element={<PartnerNoticesPage />} />
        <Route path="/institute/:slug/about" element={<PartnerAboutPage />} />
        <Route path="/institute/:slug/contact" element={<PartnerContactPage />} />
        <Route path="/institute/:slug/login" element={<PartnerLogin />} />

        {/* Super Admin Routes */}
        <Route path="/admin/login" element={<SuperAdminLogin />} />
        <Route path="/admin/*" element={
          <SuperAdminRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="franchises" element={<Franchises />} />
                <Route path="students" element={<AllStudents />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="royalty" element={<Royalty />} />
                <Route path="certificates" element={<AdminCertificates />} />
                <Route path="materials" element={<AdminMaterials />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="homepage" element={<OrgHomepageEditor />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="roles" element={<RolesAndPermissions />} />
                <Route path="staff-users" element={<SubAdminStaff />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="security" element={<SecurityAndBackup />} />
                <Route path="addons" element={<AdminAddons />} />
                <Route path="settings" element={<AdminSettings />} />
              </Routes>
            </AdminLayout>
          </SuperAdminRoute>
        } />

        {/* Partner Routes */}
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/*" element={
          <PartnerRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<PartnerDashboard />} />
                <Route path="admission" element={<PartnerAdmissionPage />} />
                <Route path="students" element={<PartnerStudents />} />
                <Route path="courses" element={<PartnerCourses />} />
                <Route path="batches" element={<PartnerBatches />} />
                <Route path="fees" element={<PartnerFees />} />
                <Route path="staff" element={<PartnerStaff />} />
                <Route path="attendance" element={<PartnerAttendance />} />
                <Route path="exams" element={<PartnerExams />} />
                <Route path="projects" element={<PartnerProjects />} />
                <Route path="materials" element={<PartnerMaterials />} />
                <Route path="certificates" element={<PartnerCertificates />} />
                <Route path="inquiries" element={<PartnerInquiries />} />
                <Route path="homepage" element={<PartnerHomepage />} />
                <Route path="settings" element={<PartnerSettings />} />
                <Route path="pending-approvals" element={<PartnerPendingApprovals />} />
                <Route path="addons" element={<PartnerAddons />} />
              </Routes>
            </AdminLayout>
          </PartnerRoute>
        } />

        {/* Student LMS Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/course/:courseId" element={<StudentCoursePlayer />} />
        <Route path="/student/courses/:courseId" element={<StudentCoursePlayer />} />
        <Route path="/student/course/:courseId/assessment" element={<StudentAssessment />} />
        <Route path="/student/certificate/:certificateId" element={<CertificateView />} />
        <Route path="/student/exam/:examId" element={<StudentTakeExam />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
    <ScrollToTop />
    </ErrorBoundary>
  );
}
