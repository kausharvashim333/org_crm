const express = require('express');
const multer = require('multer');
const path = require('path');
const OrgHomepage = require('../models/OrgHomepage');
const { protect, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'org-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const createDefaultIfMissing = async (lean = false) => {
  let homepage = lean ? await OrgHomepage.findOne().lean() : await OrgHomepage.findOne();
  if (!homepage) {
    homepage = await OrgHomepage.create({
      layoutOrder: ['hero', 'verticals', 'about', 'stats', 'courses', 'franchise', 'certifications', 'gallery', 'testimonials', 'notices', 'cta', 'contact'],
      hero: {
        heading: 'Building Careers in Paramedical, IT, Finance & Skills',
        subheading: 'Paramedical | Computer Training | Skill Development | Stock Market Training',
        description: 'Empowering India through quality education and practical training across multiple fields',
        ctaButtonText: 'Explore Courses',
        ctaButtonLink: '/#courses',
        cta2ButtonText: 'Become a Partner',
        cta2ButtonLink: '/#franchise',
      },
      verticals: {
        title: 'Fields We Offer',
        subtitle: 'We provide specialized training across four major verticals',
        show: true,
        items: [
          { icon: 'heart', title: 'Paramedical', shortDesc: 'Healthcare training courses', description: 'Comprehensive paramedical courses including nursing, lab technician, and healthcare assistance.', coursesCount: '15+ Courses', link: '/#courses' },
          { icon: 'monitor', title: 'Computer Training', shortDesc: 'IT & software courses', description: 'From basic computer skills to advanced programming, web development, and hardware training.', coursesCount: '25+ Courses', link: '/#courses' },
          { icon: 'briefcase', title: 'Skill Development', shortDesc: 'Govt skill programs', description: 'Government-recognized skill development programs for employment and entrepreneurship.', coursesCount: '10+ Courses', link: '/#courses' },
          { icon: 'trending', title: 'Stock Market Training', shortDesc: 'Finance & trading courses', description: 'Learn stock market analysis, trading strategies, and investment fundamentals.', coursesCount: '8+ Courses', link: '/#courses' },
        ],
      },
      about: {
        title: 'About Our Organization',
        description: 'We are a premier vocational training organization dedicated to delivering top-tier educational certifications and career pathways across our four core segments: Paramedical Training, Computer Education, Government Skill Development Projects, and Stock Market Training. Through our unified partner center network, we equip candidates with hands-on labs, expert coaching, and verified employment opportunities.',
        mission: 'To provide accessible, quality education that leads to meaningful employment and entrepreneurship opportunities.',
        vision: 'To be the most trusted training network in India, transforming lives through skill development.',
        features: [
          { icon: 'award', title: 'Certified Courses', description: 'Government recognized certifications for career growth' },
          { icon: 'users', title: 'Expert Faculty', description: 'Experienced and qualified trainers' },
          { icon: 'building', title: 'Pan-India Network', description: 'Partner centers across the country' },
          { icon: 'target', title: 'Placement Assistance', description: 'Dedicated placement support for students' },
          { icon: 'briefcase', title: 'Job Placement Drive', description: 'Regular campus placement drives and job fairs with leading employers.' },
          { icon: 'users', title: 'Social Activity', description: 'Engaging in community development, awareness campaigns, and social welfare.' },
        ],
        show: true,
      },
      stats: {
        title: 'Our Impact in Numbers',
        show: true,
        items: [
          { label: 'Partner Centers', value: '50+', icon: 'building' },
          { label: 'Students Trained', value: '10,000+', icon: 'users' },
          { label: 'Courses Offered', value: '60+', icon: 'book' },
          { label: 'Placement Rate', value: '85%', icon: 'award' },
        ],
      },
      courses: {
        title: 'Popular Courses',
        subtitle: 'Explore our most sought-after courses across all fields',
        show: true,
        fieldTabs: [
          {
            fieldName: 'Paramedical',
            fieldKey: 'paramedical',
            courses: [
              { name: 'Diploma in Nursing', duration: '2 Years', fee: 'Rs 50,000', description: 'Comprehensive nursing training program' },
              { name: 'Lab Technician Course', duration: '1 Year', fee: 'Rs 25,000', description: 'Medical laboratory technology training' },
            ],
          },
          {
            fieldName: 'Computer Training',
            fieldKey: 'computer',
            courses: [
              { name: 'DCA - Diploma in Computer Applications', duration: '6 Months', fee: 'Rs 8,000', description: 'Complete computer applications course' },
              { name: 'Web Development', duration: '4 Months', fee: 'Rs 15,000', description: 'Full-stack web development training' },
              { name: 'Tally with GST', duration: '3 Months', fee: 'Rs 6,000', description: 'Accounting with Tally software' },
            ],
          },
          {
            fieldName: 'Skill Development',
            fieldKey: 'skill',
            courses: [
              { name: 'Electrician Training', duration: '6 Months', fee: 'Rs 5,000', description: 'Government skill development program' },
              { name: 'Tailoring & Fashion Design', duration: '4 Months', fee: 'Rs 4,000', description: 'Fashion design and tailoring skills' },
            ],
          },
          {
            fieldName: 'Stock Market',
            fieldKey: 'stock',
            courses: [
              { name: 'Stock Market Basics', duration: '2 Months', fee: 'Rs 10,000', description: 'Fundamentals of stock market investing' },
              { name: 'Technical Analysis', duration: '3 Months', fee: 'Rs 15,000', description: 'Advanced trading strategies and analysis' },
            ],
          },
        ],
      },
      franchise: {
        title: 'Partner With Us',
        subtitle: 'Join our growing network of training institutes across India',
        description: 'Become a partner center and start your own training institute with our established brand, proven curriculum, and ongoing support. We provide everything you need to succeed.',
        benefits: [
          { icon: 'building', title: 'Established Brand', description: 'Use our recognized brand name and logo' },
          { icon: 'book', title: 'Ready Curriculum', description: 'Get access to our proven course materials' },
          { icon: 'users', title: 'Training & Support', description: 'Complete staff training and ongoing support' },
          { icon: 'monitor', title: 'Software Access', description: 'Complete management software for your institute' },
        ],
        steps: [
          { step: 1, title: 'Apply', description: 'Submit your partner application with required details' },
          { step: 2, title: 'Review', description: 'Our team reviews your application and conducts verification' },
          { step: 3, title: 'Agreement', description: 'Sign the partnership agreement and pay the center setup fee' },
          { step: 4, title: 'Setup', description: 'Set up your institute with our guidance and support' },
          { step: 5, title: 'Launch', description: 'Start operations and begin enrolling students' },
        ],
        buttonText: 'Apply to Become a Partner',
        buttonLink: '/admin/login',
        show: true,
      },
      certifications: {
        title: 'Certifications & Affiliations',
        subtitle: 'Our courses are recognized by leading organizations',
        show: true,
        items: [
          { name: 'ISO Certified', logo: '', description: 'Quality management certified' },
          { name: 'NSDC Partner', logo: '', description: 'National Skill Development Corporation' },
          { name: 'Skill India', logo: '', description: 'Government of India initiative' },
        ],
      },
      cta: {
        title: 'Ready to Start Your Journey?',
        description: 'Join thousands of students who have transformed their careers with us',
        buttonText: 'Contact Us',
        buttonLink: '/#contact',
        show: true,
      },
      testimonials: {
        title: 'What People Say',
        subtitle: 'Success stories from our students and partner centers',
        show: true,
        items: [
          { name: 'Rajesh Kumar', role: 'Student', field: 'Computer Training', rating: 5, review: 'The DCA course helped me get a job as a computer operator. Great faculty and practical training.' },
          { name: 'Priya Sharma', role: 'Partner Center Owner', field: 'Paramedical', rating: 5, review: 'Becoming a partner was the best decision. The support from the team is excellent.' },
        ],
      },
      notices: {
        title: 'Notices & Announcements',
        show: true,
        items: [
          { title: 'New Batch Starting', date: new Date(), description: 'Admissions open for new batch starting next month', badge: 'New' },
        ],
      },
      services: {
        title: 'Our Training Services',
        subtitle: 'Explore our specialized vocational certification and coaching pathways',
        show: true,
        items: [
          {
            title: 'Paramedical Training',
            duration: '1 to 2 Years Diploma / Certificate',
            desc: 'Specialized healthcare courses designed to train students in clinical support, diagnostic laboratories, and patient care systems.',
            topics: [
              'Anatomy & Physiology',
              'Clinical Biochemistry',
              'Hematology & Blood Banking',
              'Medical Lab Technology (MLT)',
              'Patient Care & Nursing Assistance',
              'First Aid & Emergency Management',
              'Pharmacology Basics',
              'Pathology & Microbiology'
            ],
            careers: ['Medical Lab Assistant', 'Nursing Assistant', 'Dialysis Technician', 'Health Care Coordinator'],
            tools: ['Centrifuge', 'Microscope', 'Hemocytometer', 'Autoclave']
          },
          {
            title: 'Health & Yoga Training',
            duration: '3 Months to 1 Year Certificate',
            desc: 'Professional training in yoga therapy, naturopathy, holistic health sciences, and physical wellness education.',
            topics: [
              'Pranayama & Meditation Techniques',
              'Yoga Sutras & History of Yoga',
              'Human Anatomy in Yoga Practice',
              'Naturopathy & Dietetics',
              'Asana Postures & Teaching Methodology',
              'Therapeutic Yoga for Diseases',
              'Stress Management & Wellness',
              'Mental Health & Mindfulness'
            ],
            careers: ['Certified Yoga Instructor', 'Wellness Coach', 'Naturopathy Advisor', 'Fitness Consultant'],
            tools: ['Yoga Mats', 'Meditation Cushions', 'Anatomy Charts', 'Physiology Monitors']
          },
          {
            title: 'Computer & IT Training',
            duration: '3 Months to 1 Year Programs',
            desc: 'From fundamental digital literacy to advanced software engineering, database administration, and accounting software.',
            topics: [
              'Office Automation (Word, Excel, PPT)',
              'Advanced Diploma in Computer Applications (ADCA)',
              'Full Stack Web Development (MERN)',
              'Financial Accounting (Tally Prime & GST)',
              'Python Programming & SQL Databases',
              'Graphic Designing (Photoshop & Illustrator)',
              'Cyber Security & Networking',
              'Hardware & Troubleshooting'
            ],
            careers: ['Software Developer', 'GST & Tally Operator', 'Office Administrator', 'Graphic Designer'],
            tools: ['VS Code', 'Tally Prime', 'Photoshop', 'Git & GitHub']
          },
          {
            title: 'UG & PG Courses',
            duration: '3 to 5 Years Degree Programs',
            desc: 'Affiliated undergraduate and postgraduate courses in Computer Applications, Business Administration, and Vocational studies.',
            topics: [
              'BCA (Bachelor of Computer Applications)',
              'MCA (Master of Computer Applications)',
              'BBA (Bachelor of Business Administration)',
              'MBA (Master of Business Administration)',
              'B.Sc (Information Technology)',
              'M.Sc (Computer Science)',
              'B.Voc (Vocational Degree Courses)',
              'Academic Research & Project Thesis'
            ],
            careers: ['Systems Analyst', 'Corporate Business Manager', 'Academic Lecturer', 'Database Administrator'],
            tools: ['E-Library Access', 'Project Thesis Templates', 'Development IDEs', 'Academic Portals']
          },
          {
            title: 'Skill Development Projects',
            duration: '3 to 6 Months Vocational Certificates',
            desc: 'Vocational training courses aligned with national skill development benchmarks to foster employment and entrepreneurship.',
            topics: [
              'Personality Development & Grooming',
              'Spoken English & Communication Skills',
              'Retail Operations & Management',
              'Customer Relationship Management (CRM)',
              'Basic Electrical & Electronics Repair',
              'Digital Marketing Fundamentals',
              'Sales & Business Development',
              'Self-Employment Initiatives'
            ],
            careers: ['Customer Support Executive', 'Retail Store Manager', 'Sales Specialist', 'Independent Contractor'],
            tools: ['Excel Dashboard', 'Canva Pro', 'Presentation Decks', 'Communication Aids']
          },
          {
            title: 'Stock Market & Finance',
            duration: '1 to 3 Months Intensive Modules',
            desc: 'Practical training in financial literacy, market analysis tools, risk profiling, and trading strategies.',
            topics: [
              'Basics of Financial Markets',
              'Technical Analysis (Chart Patterns & Indicators)',
              'Fundamental Analysis (Balance Sheet & Valuations)',
              'Options Trading & Derivatives Strategies',
              'Risk Management & Capital Protection',
              'Commodity & Currency Markets',
              'Mutual Funds & Wealth Management',
              'Trading Psychology & Execution Rules'
            ],
            careers: ['Equity Research Associate', 'Technical Analyst', 'Mutual Fund Advisor', 'Professional Trader'],
            tools: ['TradingView', 'Excel Calculators', 'Broker Terminals', 'Option Chain Tools']
          },
          {
            title: 'CGPSC & CGVYAPAM Preparation',
            duration: '6 Months to 1 Year Coaching',
            desc: 'Targeted exam preparation coaching for Chhattisgarh Civil Services, Vyapam, Revenue, and administrative competitive exams.',
            topics: [
              'CG History, Culture & Heritage',
              'Indian Polity & Constitution',
              'Geography & Natural Resources of CG',
              'General Mental Ability & Reasoning',
              'Quantitative Aptitude & Mathematics',
              'General Hindi & Chhattisgarhi Language',
              'Current Affairs & Administrative Schemes',
              'Mock Tests & Previous Year Papers'
            ],
            careers: ['State Civil Servant', 'Revenue Inspector', 'Administrative Officer', 'Government Assistant'],
            tools: ['Mock Test Series', 'Daily GK Bulletins', 'Study Syllabus Guides', 'Previous Papers PDF']
          },
          {
            title: 'Job Placement Drives',
            duration: 'Continuous Assistance',
            desc: 'Placement support, mock interviews, corporate tie-ups, and career guidance workshops to assist certified candidates in landing positions.',
            topics: [
              'Resume Writing & Optimization',
              'Professional Interview Preparation',
              'Corporate Communication & Soft Skills',
              'Group Discussion (GD) Techniques',
              'Mock Interview Drills',
              'Industry Networking & Job Search',
              'Corporate Work Ethics',
              'Aptitude & Technical Screening prep'
            ],
            careers: ['HR Recruiter', 'Placement Officer', 'Career Counselor', 'Corporate Trainer'],
            tools: ['Mock Interview Sheets', 'Resume Templates', 'Corporate Partner Lists', 'Aptitude Question Banks']
          }
        ]
      },
      announcement: {
        show: true,
        text: 'Admissions Open 2026-27: Paramedical, Yoga, Computer & IT, Competitive Coaching Batches starting soon. Apply now!',
        bgColor: '#3730a3',
        textColor: '#ffffff'
      },
      enquiryConfig: {
        modalTitle: 'Admission Enquiry Form',
        successMessage: 'Thank you for your enquiry! Our counseling team will contact you shortly.'
      },
      contact: {
        title: 'Get in Touch',
        subtitle: 'Have questions? We are here to help.',
        show: true,
        email: 'contact@example.com',
        phone: '9999999999',
        address: 'India',
        socialLinks: { facebook: '', instagram: '', youtube: '', whatsapp: '' },
      },
    });
    if (lean && homepage.toObject) {
      homepage = homepage.toObject();
    }
  }

  // Ensure default plans are present if empty
  if (homepage && (!homepage.franchise.plans || homepage.franchise.plans.length === 0)) {
    const defaultPlans = [
      {
        name: 'Silver - Authorized Study Center',
        badge: 'Starter Center',
        tagline: 'Ideal for single computer centers, institutes & rural educational hubs',
        fee: 15000,
        originalFee: 25000,
        royaltyPercentage: 'Zero Monthly Royalty',
        certificateShare: '₹150 / Certificate',
        features: [
          'Authorization Certificate & ISO Affiliation Kit',
          'Complete Course Curriculum & Offline Lab Syllabus',
          'All-in-One CRM Partner Portal & Student Manager',
          'Online Certificate Generation with QR Code Verification',
          'Standard Marketing Poster & Flex Banner Designs',
          'Zero Monthly Royalty & 100% Student Fee Retention',
        ],
        popular: false,
        color: 'blue',
        buttonText: 'Apply for Study Center',
        buttonLink: '/franchise/apply?plan=silver',
        isActive: true,
      },
      {
        name: 'Gold - Master District Franchise',
        badge: 'Most Popular',
        tagline: 'Exclusive district-level rights with sub-center authorization power',
        fee: 35000,
        originalFee: 50000,
        royaltyPercentage: 'Revenue Share from Sub-Centers',
        certificateShare: '₹100 / Certificate',
        features: [
          'District-Level Exclusive Territorial Rights',
          'Authority to Onboard & Manage Sub-Franchise Centers',
          'Higher Profit Margin on Certificates & Course Materials',
          'Priority Hardcopy Certificate & Diploma Dispatch',
          'Custom Brand Co-Marketing & Social Media Campaigns',
          'Dedicated Technical Account Manager & Support',
          'Full LMS Software & Online Exam Portal for All Centers',
        ],
        popular: true,
        color: 'indigo',
        buttonText: 'Apply for District Franchise',
        buttonLink: '/franchise/apply?plan=gold',
        isActive: true,
      },
      {
        name: 'Platinum - State Skill Hub & Project Partner',
        badge: 'Premium Enterprise',
        tagline: 'Comprehensive state-level collaboration for CSR & Govt skill initiatives',
        fee: 75000,
        originalFee: 100000,
        royaltyPercentage: 'Maximum Profit Margin',
        certificateShare: '₹75 / Certificate',
        features: [
          'State-Wide Institutional Representation & Authority',
          'Govt Skill Development & CSR Project Allocation',
          'Corporate Campus Placement & Job Fair Support',
          'White-Label Institute LMS & Mobile App Integration',
          'Direct Central Board Technical Advisory Council Membership',
          'Annual Partner Summit Pass & National Excellence Award',
        ],
        popular: false,
        color: 'purple',
        buttonText: 'Apply for State Partner',
        buttonLink: '/franchise/apply?plan=platinum',
        isActive: true,
      }
    ];

    if (!lean && homepage.save) {
      homepage.franchise.plans = defaultPlans;
      await homepage.save();
    } else if (lean) {
      homepage.franchise.plans = defaultPlans;
    }
  }

  return homepage;
};

router.get('/public', async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing(true);
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    Object.assign(homepage, req.body);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/section/:section', protect, superAdminOnly, async (req, res) => {
  try {
    const { section } = req.params;
    const allowedSections = ['hero', 'verticals', 'about', 'stats', 'courses', 'franchise', 'certifications', 'cta', 'gallery', 'testimonials', 'notices', 'contact', 'settings', 'layoutOrder', 'services', 'announcement', 'enquiryConfig', 'codeSeriesConfig'];
    if (!allowedSections.includes(section)) {
      return res.status(400).json({ success: false, message: 'Invalid section' });
    }
    const homepage = await createDefaultIfMissing();
    homepage[section] = req.body[section];
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/publish', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.isPublished = req.body.isPublished;
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Gallery
router.post('/gallery', protect, superAdminOnly, async (req, res) => {
  try {
    const { url, caption } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.gallery.photos.push({ url, caption });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/gallery/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.gallery.photos.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Testimonials
router.post('/testimonials', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, role, field, rating, review } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.testimonials.items.push({ name, role, field, rating, review });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/testimonials/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.testimonials.items.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stats
router.post('/stats', protect, superAdminOnly, async (req, res) => {
  try {
    const { label, value, icon } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.stats.items.push({ label, value, icon });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/stats/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.stats.items.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// About Features
router.post('/features', protect, superAdminOnly, async (req, res) => {
  try {
    const { icon, title, description } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.about.features.push({ icon, title, description });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/features/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.about.features.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verticals
router.post('/verticals', protect, superAdminOnly, async (req, res) => {
  try {
    const { icon, title, shortDesc, description, coursesCount, link } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.verticals.items.push({ icon, title, shortDesc, description, coursesCount, link });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/verticals/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.verticals.items.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notices
router.post('/notices', protect, superAdminOnly, async (req, res) => {
  try {
    const { title, date, description, badge, category, pdfUrl } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.notices.items.push({ title, date, description, badge, category, pdfUrl });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/notices/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.notices.items.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notices/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const { title, date, description, badge, category, pdfUrl } = req.body;
    const homepage = await createDefaultIfMissing();
    const index = parseInt(req.params.index);
    if (homepage.notices.items[index]) {
      homepage.notices.items[index] = { title, date, description, badge, category, pdfUrl };
      await homepage.save();
      res.json({ success: true, homepage });
    } else {
      res.status(400).json({ success: false, message: 'Notice not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Certifications
router.post('/certifications', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, logo, description } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.certifications.items.push({ name, logo, description });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/certifications/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.certifications.items.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// File uploads
router.post('/upload-logo', protect, superAdminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const logoUrl = `/uploads/${req.file.filename}`;
    const homepage = await createDefaultIfMissing();
    homepage.settings = homepage.settings || {};
    homepage.settings.logo = logoUrl;
    await homepage.save();
    res.json({ success: true, logoUrl, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload-favicon', protect, superAdminOnly, upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const faviconUrl = `/uploads/${req.file.filename}`;
    const homepage = await createDefaultIfMissing();
    homepage.settings = homepage.settings || {};
    homepage.settings.favicon = faviconUrl;
    await homepage.save();
    res.json({ success: true, faviconUrl, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload-image', protect, superAdminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload-pdf', protect, superAdminOnly, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const pdfUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, pdfUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Services Catalog
router.post('/services', protect, superAdminOnly, async (req, res) => {
  try {
    const { title, duration, desc, topics, careers, tools } = req.body;
    const homepage = await createDefaultIfMissing();
    homepage.services.items.push({ title, duration, desc, topics, careers, tools });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/services/:index', protect, superAdminOnly, async (req, res) => {
  try {
    const homepage = await createDefaultIfMissing();
    homepage.services.items.splice(parseInt(req.params.index), 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
