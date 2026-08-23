import API from './axios';

export const login = (data) => API.post('/auth/login', data);
export const googleLogin = (data) => API.post('/auth/google-login', data);
export const getMe = () => API.get('/auth/me');
export const changePassword = (data) => API.put('/auth/change-password', data);
export const updateProfile = (data) => API.put('/auth/profile', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);

export const getPartners = () => API.get('/partners');
export const getPublicPartners = () => API.get('/partners/public');
export const applyPartner = (data) => API.post('/partners/public/apply', data);
export const checkPartnerEmail = (email) => API.get('/partners/public/check-email', { params: { email } });
export const createFranchiseOrder = (data) => API.post('/partners/public/create-franchise-order', data);
export const getFranchiseReceipt = (franchiseId) => API.get(`/partners/public/receipt/${franchiseId}`);
export const getPartner = (id) => API.get(`/partners/${id}`);
export const getPartnerBySlug = (slug) => API.get(`/partners/slug/${slug}`);
export const createPartner = (data) => API.post('/partners', data);
export const updatePartner = (id, data) => API.put(`/partners/${id}`, data);
export const uploadPartnerLogo = (id, formData) => API.post(`/partners/${id}/upload-logo`, formData);
export const updatePartnerStatus = (id, status) => API.put(`/partners/${id}/status`, { status });
export const deletePartner = (id) => API.delete(`/partners/${id}`);

export const getStudents = (params) => API.get('/students', { params });
export const getStudent = (id) => API.get(`/students/${id}`);
export const createStudent = (data) => API.post('/students', data);
export const updateStudent = (id, data) => API.put(`/students/${id}`, data);
export const deleteStudent = (id) => API.delete(`/students/${id}`);
export const uploadStudentDocument = (id, formData) => API.post(`/students/${id}/upload-document`, formData);
export const createAdmissionOrder = (data) => API.post('/students/public/create-admission-order', data);
export const submitPublicAdmission = (formData) => API.post('/students/public/apply', formData);
export const getPublicAdmissionReceipt = (applicationNo) => API.get(`/students/public/receipt/${applicationNo}`);

export const getCourses = (params) => API.get('/courses', { params });
export const getPublicCourses = (params) => API.get('/courses/public', { params });
export const getStoreCourses = (params) => API.get('/courses/store', { params });
export const getStoreCourse = (id) => API.get(`/courses/store/${id}`);
export const getCourse = (id) => API.get(`/courses/${id}`);
export const createCourse = (data) => API.post('/courses', data);
export const createStandardCourse = (data) => API.post('/courses/standard', data);
export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const updatePartnerCourseFee = (id, customStudentFee) => API.put(`/courses/${id}/partner-fee`, { customStudentFee });
export const approveCourse = (id, status) => API.put(`/courses/${id}/approve`, { approvalStatus: status });
export const deleteCourse = (id) => API.delete(`/courses/${id}`);
export const uploadCourseVideo = (formData) => API.post('/courses/upload-video', formData);
export const updateCourseChapters = (id, chapters) => API.put(`/courses/${id}/chapters`, { chapters });
export const updateCourseAssessment = (id, assessment) => API.put(`/courses/${id}/assessment`, { assessment });

// Store Orders & Coupons APIs
export const validateCoupon = (data) => API.post('/coupons/validate', data);
export const getAdminCoupons = () => API.get('/coupons');
export const createAdminCoupon = (data) => API.post('/coupons', data);
export const updateAdminCoupon = (id, data) => API.put(`/coupons/${id}`, data);
export const deleteAdminCoupon = (id) => API.delete(`/coupons/${id}`);

export const createOrder = (data) => API.post('/orders/create', data);
export const verifyOrder = (data) => API.post('/orders/verify', data);
export const getOrderInvoice = (orderNumberOrId) => API.get(`/orders/invoice/${orderNumberOrId}`);
export const getMyOrders = () => API.get('/orders/my-orders');
export const getAdminOrders = (params) => API.get('/orders/admin/all', { params });
export const updateAdminOrderStatus = (id, data) => API.put(`/orders/admin/${id}/status`, data);

// Student LMS APIs
export const getStudentLmsDashboard = () => API.get('/student-lms/dashboard');
export const getStudentLmsCourses = () => API.get('/student-lms/courses');
export const getStudentLmsCourse = (courseId) => API.get(`/student-lms/course/${courseId}`);
export const markChapterWatched = (data) => API.post('/student-lms/watch-chapter', data);
export const submitStudentAssessment = (data) => API.post('/student-lms/submit-assessment', data);
export const getStudentCertificate = (id) => API.get(`/student-lms/certificate/${id}`);
export const updateStudentLmsProfile = (data) => API.put('/student-lms/profile', data);

export const getBatches = (params) => API.get('/batches', { params });
export const getBatch = (id) => API.get(`/batches/${id}`);
export const createBatch = (data) => API.post('/batches', data);
export const updateBatch = (id, data) => API.put(`/batches/${id}`, data);
export const enrollStudent = (id, studentId) => API.post(`/batches/${id}/enroll`, { studentId });
export const deleteBatch = (id) => API.delete(`/batches/${id}`);

export const getFees = (params) => API.get('/fees', { params });
export const getFee = (id) => API.get(`/fees/${id}`);
export const createFee = (data) => API.post('/fees', data);
export const addFeePayment = (id, data) => API.post(`/fees/${id}/payment`, data);
export const updateFee = (id, data) => API.put(`/fees/${id}`, data);

export const getStaff = (params) => API.get('/staff', { params });
export const getPublicStaff = (params) => API.get('/staff/public', { params });
export const getStaffMember = (id) => API.get(`/staff/${id}`);
export const createStaff = (data) => API.post('/staff', data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const deleteStaff = (id) => API.delete(`/staff/${id}`);

export const getStudentAttendance = (params) => API.get('/attendance/student', { params });
export const markStudentAttendance = (data) => API.post('/attendance/student', data);
export const getStaffAttendance = (params) => API.get('/attendance/staff', { params });
export const markStaffAttendance = (data) => API.post('/attendance/staff', data);

export const getExams = (params) => API.get('/exams', { params });
export const getExam = (id) => API.get(`/exams/${id}`);
export const createExam = (data) => API.post('/exams', data);
export const updateExam = (id, data) => API.put(`/exams/${id}`, data);
export const deleteExam = (id) => API.delete(`/exams/${id}`);
export const submitExamResults = (id, results) => API.post(`/exams/${id}/results`, { results });
export const getStudentAvailableExams = () => API.get('/exams/student/available');
export const getExamQuestions = (id) => API.get(`/exams/${id}/questions`);
export const submitExamAnswers = (id, data) => API.post(`/exams/${id}/submit`, data);
export const getExamAnalytics = (id) => API.get(`/exams/${id}/analytics`);
export const gradeSubmission = (examId, studentId, grades) => API.put(`/exams/${examId}/submissions/${studentId}/grade`, { grades });

// Question Bank
export const getQuestionBank = (params) => API.get('/question-bank', { params });
export const getQuestionCategories = () => API.get('/question-bank/categories');
export const getQuestionTags = () => API.get('/question-bank/tags');
export const createQuestion = (data) => API.post('/question-bank', data);
export const bulkCreateQuestions = (questions) => API.post('/question-bank/bulk', { questions });
export const updateQuestion = (id, data) => API.put(`/question-bank/${id}`, data);
export const deleteQuestion = (id) => API.delete(`/question-bank/${id}`);

export const getProjects = (params) => API.get('/projects', { params });
export const getProject = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const assignProject = (id, data) => API.post(`/projects/${id}/assign`, data);
export const acceptProject = (id) => API.post(`/projects/${id}/accept`);
export const declineProject = (id, reason) => API.post(`/projects/${id}/decline`, { reason });
export const uploadProjectDoc = (id, data) => API.post(`/projects/${id}/document`, data);
export const approveProjectDoc = (id, docId, data) => API.put(`/projects/${id}/document/${docId}/approve`, data);
export const addPlacement = (id, data) => API.post(`/projects/${id}/placement`, data);
export const addProjectNotice = (id, data) => API.post(`/projects/${id}/notice`, data);

export const getRoyalties = (params) => API.get('/royalty', { params });
export const generateRoyalty = (data) => API.post('/royalty/generate', data);
export const payRoyalty = (id, data) => API.post(`/royalty/${id}/payment`, data);

export const getHomepage = () => API.get('/homepage');
export const getPublicHomepage = (slug) => API.get(`/homepage/public/${slug}`);
export const updateHomepage = (data) => API.put('/homepage', data);
export const updateHomepageSection = (section, data) => API.put(`/homepage/section/${section}`, data);
export const publishHomepage = (isPublished) => API.put('/homepage/publish', { isPublished });
export const uploadHomepageBanner = (formData) => API.post('/homepage/upload-banner', formData);
export const uploadGalleryPhoto = (data) => API.post('/homepage/gallery/upload', data);
export const deleteGalleryPhoto = (index) => API.delete(`/homepage/gallery/${index}`);
export const addTestimonial = (data) => API.post('/homepage/testimonials', data);
export const deleteTestimonial = (index) => API.delete(`/homepage/testimonials/${index}`);
export const addHomepageNotice = (data) => API.post('/homepage/notices', data);
export const deleteHomepageNotice = (index) => API.delete(`/homepage/notices/${index}`);
export const addFacility = (data) => API.post('/homepage/facilities', data);
export const deleteFacility = (index) => API.delete(`/homepage/facilities/${index}`);

export const submitInquiry = (partnerId, data) => API.post(`/inquiries/public/${partnerId}`, data);
export const submitCentralInquiry = (data) => API.post('/inquiries/public/central', data);
export const submitPartnerInquiry = (data) => API.post('/inquiries/public/partner', data);
export const getInquiries = (params) => API.get('/inquiries', { params });
export const updateInquiryStatus = (id, status) => API.put(`/inquiries/${id}/status`, { status });
export const addFollowUp = (id, note) => API.post(`/inquiries/${id}/followup`, { note });

export const getMaterials = (params) => API.get('/materials', { params });
export const uploadMaterial = (formData) => API.post('/materials/upload', formData);
export const updateMaterial = (id, data) => API.put(`/materials/${id}`, data);
export const approveMaterial = (id, status) => API.put(`/materials/${id}/approve`, { approvalStatus: status });
export const deleteMaterial = (id) => API.delete(`/materials/${id}`);

export const getCertificates = (params) => API.get('/certificates', { params });
export const requestCertificate = (data) => API.post('/certificates', data);
export const approveCertificate = (id, data) => API.put(`/certificates/${id}/approve`, data);
export const bulkApproveCertificates = (data) => API.put('/certificates/bulk-approve', data);
export const rejectCertificate = (id, reason) => API.put(`/certificates/${id}/reject`, { rejectionReason: reason });
export const verifyCertificate = (code) => API.get(`/certificates/verify/${code}`);

export const getNotifications = () => API.get('/notifications');
export const broadcastNotification = (data) => API.post('/notifications/broadcast', data);
export const sendIndividualNotification = (data) => API.post('/notifications/individual', data);
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

export const getSuperAdminDashboard = () => API.get('/dashboard/super-admin');
export const getPartnerDashboard = () => API.get('/dashboard/partner');

export const getOrgHomepagePublic = () => API.get('/org-homepage/public');
export const getOrgHomepage = () => API.get('/org-homepage');
export const updateOrgHomepage = (data) => API.put('/org-homepage', data);
export const updateOrgHomepageSection = (section, data) => API.put(`/org-homepage/section/${section}`, data);
export const publishOrgHomepage = (isPublished) => API.put('/org-homepage/publish', { isPublished });
export const addOrgGalleryPhoto = (data) => API.post('/org-homepage/gallery', data);
export const deleteOrgGalleryPhoto = (index) => API.delete(`/org-homepage/gallery/${index}`);
export const toggleOrgGalleryFeatured = (index) => API.put(`/org-homepage/gallery/${index}/featured`);
export const addOrgTestimonial = (data) => API.post('/org-homepage/testimonials', data);
export const updateOrgTestimonial = (index, data) => API.put(`/org-homepage/testimonials/${index}`, data);
export const deleteOrgTestimonial = (index) => API.delete(`/org-homepage/testimonials/${index}`);
export const addOrgStat = (data) => API.post('/org-homepage/stats', data);
export const deleteOrgStat = (index) => API.delete(`/org-homepage/stats/${index}`);
export const addOrgFeature = (data) => API.post('/org-homepage/features', data);
export const deleteOrgFeature = (index) => API.delete(`/org-homepage/features/${index}`);
export const uploadOrgLogo = (formData) => API.post('/org-homepage/upload-logo', formData);
export const uploadOrgFavicon = (formData) => API.post('/org-homepage/upload-favicon', formData);
export const uploadOrgImage = (formData) => API.post('/org-homepage/upload-image', formData);
export const uploadOrgPdf = (formData) => API.post('/org-homepage/upload-pdf', formData);
export const addOrgVertical = (data) => API.post('/org-homepage/verticals', data);
export const deleteOrgVertical = (index) => API.delete(`/org-homepage/verticals/${index}`);
export const updateOrgVertical = (index, data) => API.put(`/org-homepage/verticals/${index}`, data);
export const addOrgNotice = (data) => API.post('/org-homepage/notices', data);
export const deleteOrgNotice = (index) => API.delete(`/org-homepage/notices/${index}`);
export const updateOrgNotice = (index, data) => API.put(`/org-homepage/notices/${index}`, data);
export const addOrgCertification = (data) => API.post('/org-homepage/certifications', data);
export const deleteOrgCertification = (index) => API.delete(`/org-homepage/certifications/${index}`);
export const addOrgService = (data) => API.post('/org-homepage/services', data);
export const deleteOrgService = (index) => API.delete(`/org-homepage/services/${index}`);

export const addOrgCustomSection = (data) => API.post('/org-homepage/custom-sections', data);
export const updateOrgCustomSection = (id, data) => API.put(`/org-homepage/custom-sections/${id}`, data);
export const deleteOrgCustomSection = (id) => API.delete(`/org-homepage/custom-sections/${id}`);
export const addOrgCustomCard = (sectionId, data) => API.post(`/org-homepage/custom-sections/${sectionId}/cards`, data);
export const deleteOrgCustomCard = (sectionId, cardIndex) => API.delete(`/org-homepage/custom-sections/${sectionId}/cards/${cardIndex}`);

export const updateOrgCentersStrip = (data) => API.put('/org-homepage/centers-strip', data);
export const addOrgCenter = (data) => API.post('/org-homepage/centers-strip/centers', data);
export const deleteOrgCenter = (index) => API.delete(`/org-homepage/centers-strip/centers/${index}`);

// RBAC & Security APIs
export const getRoles = () => API.get('/rbac/roles');
export const createRole = (data) => API.post('/rbac/roles', data);
export const updateRole = (id, data) => API.put(`/rbac/roles/${id}`, data);
export const deleteRole = (id) => API.delete(`/rbac/roles/${id}`);

export const getStaffUsers = () => API.get('/rbac/staff-users');
export const createStaffUser = (data) => API.post('/rbac/staff-users', data);

export const getAuditLogs = () => API.get('/rbac/audit-logs');
export const getSecurityExport = () => API.get('/rbac/security/export');

// Add-ons
export const getAddons = () => API.get('/addons');
export const getMyAddons = () => API.get('/addons/my');
export const purchaseAddonOrder = (data) => API.post('/addons/purchase-order', data);
export const verifyAddonPayment = (data) => API.post('/addons/verify-payment', data);
export const getAdminAddons = () => API.get('/addons/admin');
export const createAddon = (data) => API.post('/addons/admin', data);
export const updateAddon = (id, data) => API.put(`/addons/admin/${id}`, data);
export const deleteAddon = (id) => API.delete(`/addons/admin/${id}`);
export const getAddonPurchases = () => API.get('/addons/admin/purchases');
export const adminActivateAddon = (data) => API.post('/addons/admin/activate', data);
export const adminDeactivateAddon = (id) => API.put(`/addons/admin/deactivate/${id}`);
