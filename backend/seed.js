require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Partner = require('./models/Partner');
const Course = require('./models/Course');
const Coupon = require('./models/Coupon');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  try {
    // Check if Super Admin already exists
    let admin = await User.findOne({ email: 'admin@skillindia.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@skillindia.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'super_admin',
      });
      console.log('Super Admin created:', admin.email);
    } else {
      console.log('Super Admin already exists:', admin.email);
    }

    const standardCourses = [
      {
        name: 'Full Stack Web Development (MERN Stack)',
        code: 'FSWD',
        duration: '6 Months',
        durationMonths: 6,
        fee: 15000,
        originalPrice: 15000,
        salePrice: 2999,
        isStandard: true,
        approvalStatus: 'approved',
        category: 'Programming',
        level: 'Beginner to Advanced',
        language: 'Hindi + English',
        badge: 'Bestseller',
        rating: 4.9,
        ratingCount: 1420,
        enrolledCount: 3850,
        previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        description: 'Complete hands-on Masterclass covering HTML5, Modern CSS/Tailwind, JavaScript ES6+, React 18, Node.js, Express, MongoDB, REST APIs, Git & Deployment on Cloud with 10+ Real-World Projects.',
        highlights: [
          '10+ Real-world Industry Projects & Live Capstone',
          'Govt & ISO Recognized Digital QR-Verified Certificate',
          'Lifetime Access to Video Lectures & Source Codes',
          'Direct Doubt Support & Resume Building Assistance',
          'Hybrid Option: Access Practical Labs at 50+ Franchise Centers',
        ],
        whatYouWillLearn: [
          'Build responsive, production-ready frontend apps with React 18 & TailwindCSS',
          'Design robust backend RESTful APIs using Node.js & Express',
          'Master Database modeling and aggregation pipelines with MongoDB & Mongoose',
          'Implement secure JWT Authentication, Password Hashing, and Role-Based Access Control',
          'Deploy full-stack applications on cloud servers and configure custom domains',
        ],
        prerequisites: ['Basic familiarity with using a computer and internet', 'No prior programming experience required'],
        targetAudience: ['College Students & Graduates', 'Job Seekers & Career Switchers', 'Anyone wanting to build web apps'],
        instructor: {
          name: 'Er. Rajesh Sharma',
          title: 'Lead Architect & Ex-Tech Trainer',
          bio: '12+ years of professional full-stack development experience, trained over 15,000+ engineers across India.',
        },
        syllabus: [
          { module: 'Module 1: Web Fundamentals & Modern UI', topics: ['HTML5 Semantic Structure', 'CSS3 Flexbox & Grid', 'Responsive Design & TailwindCSS'] },
          { module: 'Module 2: JavaScript Mastery', topics: ['ES6+ Syntax & Async/Await', 'DOM Manipulation', 'Fetch API & LocalStorage'] },
          { module: 'Module 3: React 18 Frontend', topics: ['Components, Props & State', 'Hooks (useState, useEffect, useContext)', 'Routing & State Management'] },
          { module: 'Module 4: Node.js & Express Backend', topics: ['Server Architecture', 'REST API Design', 'Middleware & Error Handling'] },
          { module: 'Module 5: MongoDB Database', topics: ['CRUD Operations', 'Schema Design', 'Mongoose Relationships & Aggregations'] },
          { module: 'Module 6: Capstone Project & Deployment', topics: ['Full Stack CRM Project', 'Payment Gateway Integration', 'Cloud Deployment & CI/CD'] },
        ],
        chapters: [
          {
            title: '1. Introduction to Web Development & Roadmap',
            description: 'Overview of frontend, backend, full stack tech stack, and setup of VS Code and dev tools.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            videoType: 'url',
            duration: '18 mins',
            order: 1,
            isPreviewFree: true,
          },
          {
            title: '2. HTML5 Semantic Tags & Page Layouts',
            description: 'Building accessible, SEO-friendly HTML structures for modern web applications.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            videoType: 'url',
            duration: '24 mins',
            order: 2,
            isPreviewFree: false,
          },
          {
            title: '3. CSS3 Flexbox & Responsive Layouts Masterclass',
            description: 'Creating mobile-first responsive web designs using Flexbox and CSS Grid.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            videoType: 'url',
            duration: '32 mins',
            order: 3,
            isPreviewFree: false,
          },
        ],
        assessment: {
          passingScore: 60,
          questions: [
            {
              questionText: 'Which React hook is primarily used for handling side effects like data fetching?',
              options: [{ text: 'useState' }, { text: 'useEffect' }, { text: 'useContext' }, { text: 'useReducer' }],
              correctAnswerIndex: 1,
            },
            {
              questionText: 'What is MongoDB primarily classified as?',
              options: [{ text: 'Relational SQL Database' }, { text: 'NoSQL Document Database' }, { text: 'Graph Database' }, { text: 'Flat File System' }],
              correctAnswerIndex: 1,
            },
          ],
        },
      },
      {
        name: 'Tally Prime with GST & E-Way Billing Master Course',
        code: 'TALLY-PRO',
        duration: '3 Months',
        durationMonths: 3,
        fee: 6000,
        originalPrice: 6000,
        salePrice: 1499,
        isStandard: true,
        approvalStatus: 'approved',
        category: 'Accounting',
        level: 'All Levels',
        language: 'Hindi',
        badge: 'Top Rated',
        rating: 4.95,
        ratingCount: 2150,
        enrolledCount: 5400,
        previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        description: 'Comprehensive practical training on Tally Prime 4.0, GST Invoicing, GSTR-1 & GSTR-3B filing, Payroll management, TDS, TCS, and Balance Sheet finalization.',
        highlights: [
          'Practical Accounting with Real Company Data Cases',
          'Live GST Portal Filing & E-Way Bill Generation Demo',
          'Bank Reconciliation (BRS) & Balance Sheet Finalization',
          'Govt & ISO Recognized Accounting Certification',
          'Free Tally Shortcuts Cheat Sheet & Practice Material',
        ],
        whatYouWillLearn: [
          'Master Company Creation, Ledger Groups & Inventory Management in Tally Prime',
          'Generate GST Invoices, Debit/Credit Notes, and apply CGST, SGST, IGST correctly',
          'Compute and file GSTR-1, GSTR-2B reconciliation, and GSTR-3B tax returns',
          'Manage Employee Payroll, Salary slips, PF, ESI & TDS deductions',
          'Generate Profit & Loss Account, Balance Sheet, and Trial Balance',
        ],
        prerequisites: ['Basic understanding of debit/credit principles is helpful but not mandatory'],
        targetAudience: ['Commerce Students (B.Com, M.Com)', 'Accountants & Bookkeepers', 'Small Business Owners & Tax Practitioners'],
        instructor: {
          name: 'CA Amit Verma',
          title: 'Practicing Chartered Accountant & GST Advisor',
          bio: '15+ years in taxation, corporate auditing, and accounting software training.',
        },
        syllabus: [
          { module: 'Module 1: Accounting & Tally Prime Basics', topics: ['Accounting Rules & Golden Rules', 'Company Setup', 'Chart of Accounts'] },
          { module: 'Module 2: Inventory & Voucher Entry', topics: ['Purchase & Sales Vouchers', 'Stock Groups & Units', 'Order Processing'] },
          { module: 'Module 3: Complete GST Taxation', topics: ['GST Configuration', 'E-Invoicing & E-Way Bills', 'Tax Returns Filing'] },
          { module: 'Module 4: Payroll & Statutory Compliance', topics: ['Employee Salary Structure', 'PF & ESI Management', 'TDS Reports'] },
        ],
        chapters: [
          {
            title: '1. Tally Prime Overview & Company Creation',
            description: 'Introduction to Tally Prime interface, keyboard shortcuts, and setting up a new company.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            videoType: 'url',
            duration: '22 mins',
            order: 1,
            isPreviewFree: true,
          },
          {
            title: '2. Ledger Creation & Voucher Entries',
            description: 'Creating customer, vendor, and expense ledgers with accurate tax classifications.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            videoType: 'url',
            duration: '28 mins',
            order: 2,
            isPreviewFree: false,
          },
        ],
        assessment: {
          passingScore: 60,
          questions: [
            {
              questionText: 'Which key is used to select Sales Voucher in Tally Prime?',
              options: [{ text: 'F4' }, { text: 'F5' }, { text: 'F8' }, { text: 'F9' }],
              correctAnswerIndex: 2,
            },
          ],
        },
      },
      {
        name: 'ADCA Pro (Advanced Diploma in Computer Applications + AI Tools)',
        code: 'ADCA-PRO',
        duration: '1 Year',
        durationMonths: 12,
        fee: 12000,
        originalPrice: 12000,
        salePrice: 2499,
        isStandard: true,
        approvalStatus: 'approved',
        category: 'Diploma',
        level: 'Beginner to Advanced',
        language: 'Hindi',
        badge: 'Govt Certified',
        rating: 4.88,
        ratingCount: 3100,
        enrolledCount: 7800,
        previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        description: 'Complete 1-Year Master Diploma covering Computer Fundamentals, Advanced MS Office (Excel Formulas, Dashboards, Power BI), Tally Prime, Web Design basics, and ChatGPT/AI productivity tools.',
        highlights: [
          'All-in-One Comprehensive Career Diploma for Govt & Private Jobs',
          'Advanced Excel, Pivot Tables, VLOOKUP, XLOOKUP & Interactive Dashboards',
          'AI Productivity Tools & Prompt Engineering for Office Automation',
          'Valid for all Central & State Govt Job Applications (ISO/Govt Recognized)',
          'Complete Study Material & PDF Notes Included',
        ],
        whatYouWillLearn: [
          'Master Windows OS, Hardware Fundamentals, and Internet Security',
          'Advanced Word, PowerPoint Presentations, and Excel Macro/Formulas',
          'Financial Accounting & Invoicing with Tally Prime',
          'Graphic Design basics with Photoshop and CorelDRAW',
          'Boost office productivity with ChatGPT, Claude & Modern AI tools',
        ],
        prerequisites: ['10th or 12th Pass student or working professional'],
        targetAudience: ['Govt Job Aspirants', 'Office Executives & Data Entry Operators', 'Students looking for foundational IT skills'],
        instructor: {
          name: 'Prof. Sandeep Mishra',
          title: 'Senior IT Faculty & Master Trainer',
          bio: '14+ years in computer education and skill development mission programs.',
        },
        syllabus: [
          { module: 'Module 1: Computer Fundamentals & OS', topics: ['Hardware & Software Architecture', 'Windows 11 Setup', 'Networking & Cloud Storage'] },
          { module: 'Module 2: Advanced MS Office Suite', topics: ['MS Word & Documentation', 'Advanced Excel & Dashboards', 'PowerPoint & Outlook'] },
          { module: 'Module 3: Financial Accounting', topics: ['Tally Prime Accounting', 'Voucher Entry & Invoicing', 'GST Basics'] },
          { module: 'Module 4: AI & Office Productivity', topics: ['ChatGPT for Work', 'Data Entry Automation', 'Resume & Email Writing'] },
        ],
        chapters: [
          {
            title: '1. Computer Architecture & Operating Systems',
            description: 'Core concepts of modern computers, storage devices, and operating systems.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            videoType: 'url',
            duration: '20 mins',
            order: 1,
            isPreviewFree: true,
          },
        ],
      },
      {
        name: 'Python for Data Science, AI & Machine Learning',
        code: 'PYTHON-AI',
        duration: '4 Months',
        durationMonths: 4,
        fee: 14000,
        originalPrice: 14000,
        salePrice: 2199,
        isStandard: true,
        approvalStatus: 'approved',
        category: 'Programming',
        level: 'Beginner to Intermediate',
        language: 'Hindi + English',
        badge: 'Hot & New',
        rating: 4.92,
        ratingCount: 890,
        enrolledCount: 2200,
        previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        description: 'Learn Python programming from scratch and build machine learning predictive models, data analysis pipelines with NumPy, Pandas, Matplotlib, and Scikit-Learn.',
        highlights: [
          'Practical Hands-on Jupyter Notebooks & Real Data Sets',
          'Data Visualization with Seaborn & Interactive Power BI charts',
          'Build and deploy Machine Learning predictive models',
          'Recognized Python & AI Certification with QR code',
        ],
        whatYouWillLearn: [
          'Write clean, modular Python code (Data structures, OOP, Exception handling)',
          'Perform data cleaning, filtering, and analysis using Pandas & NumPy',
          'Build beautiful data visualizations and dashboards with Matplotlib & Seaborn',
          'Train Regression, Classification, and Clustering Machine Learning models',
        ],
        prerequisites: ['Basic math & analytical mindset, no prior coding required'],
        targetAudience: ['Data Analysts, Engineering & BCA/MCA students, Python enthusiasts'],
        instructor: {
          name: 'Dr. Neha Saxena',
          title: 'Data Scientist & AI Researcher',
          bio: 'Ph.D. in Computer Science with 8+ years experience in predictive analytics.',
        },
        syllabus: [
          { module: 'Module 1: Python Fundamentals', topics: ['Syntax, Variables & Data Types', 'Loops & Conditionals', 'Functions & OOP'] },
          { module: 'Module 2: Data Analysis & Manipulation', topics: ['NumPy Arrays', 'Pandas DataFrames', 'Data Cleaning & Preprocessing'] },
          { module: 'Module 3: Data Visualization', topics: ['Matplotlib Plots', 'Seaborn Heatmaps', 'Interactive Dashboards'] },
          { module: 'Module 4: Machine Learning Algorithms', topics: ['Linear & Logistic Regression', 'Decision Trees & Random Forest', 'Model Evaluation'] },
        ],
        chapters: [
          {
            title: '1. Python Installation & First Program',
            description: 'Installing Python, Anaconda, and writing your first script in Jupyter Notebook.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            videoType: 'url',
            duration: '25 mins',
            order: 1,
            isPreviewFree: true,
          },
        ],
      },
      {
        name: 'Graphic Designing & Video Editing Masterclass',
        code: 'GD-VIDEO',
        duration: '4 Months',
        durationMonths: 4,
        fee: 10000,
        originalPrice: 10000,
        salePrice: 1799,
        isStandard: true,
        approvalStatus: 'approved',
        category: 'Design',
        level: 'All Levels',
        language: 'Hindi',
        badge: 'Trending',
        rating: 4.87,
        ratingCount: 1540,
        enrolledCount: 3900,
        previewVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        description: 'Master Adobe Photoshop, Illustrator, Premiere Pro, and Canva to create stunning social media banners, logos, marketing posters, and professional YouTube/Reels video edits.',
        highlights: [
          'Complete project-based learning with design assets pack (100GB+ templates)',
          'Learn Reels/Shorts editing, color grading, and audio enhancement',
          'Portfolio building on Behance & Freelancing client acquisition guide',
          'Digital certificate with international recognition',
        ],
        whatYouWillLearn: [
          'Photo manipulation, retouching, and background removal in Photoshop',
          'Vector illustration, logo design, and brand identity in Illustrator',
          'Video trimming, motion graphics, sound effects & subtitles in Premiere Pro',
          'Fast commercial design creation using Canva Pro features',
        ],
        prerequisites: ['A computer with decent performance for graphics software'],
        targetAudience: ['Content Creators, Freelancers, Social Media Managers, Designers'],
        instructor: {
          name: 'Vikas Malhotra',
          title: 'Creative Director & Video Editor',
          bio: '10+ years creating viral visuals and brand campaigns for major brands.',
        },
        syllabus: [
          { module: 'Module 1: Photoshop Mastery', topics: ['Layers, Masks & Selection Tools', 'Retouching & Color Correction', 'Banner Design'] },
          { module: 'Module 2: Illustrator & Vector Art', topics: ['Pen Tool Mastery', 'Typography & Logo Design', 'Print Media Layouts'] },
          { module: 'Module 3: Video Editing with Premiere Pro', topics: ['Timeline & Cuts', 'Transitions & Visual Effects', 'Color Grading & Audio Sync'] },
        ],
        chapters: [
          {
            title: '1. Fundamentals of Graphic Design & Color Theory',
            description: 'Understanding visual hierarchy, typography rules, and psychological color schemes.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            videoType: 'url',
            duration: '19 mins',
            order: 1,
            isPreviewFree: true,
          },
        ],
      },
    ];

    for (const c of standardCourses) {
      await Course.findOneAndUpdate(
        { code: c.code },
        { ...c },
        { upsert: true, new: true }
      );
    }
    console.log('E-Learning Store Courses initialized & updated.');

    // Seed Default Promotional Coupons
    const sampleCoupons = [
      {
        code: 'WELCOME2026',
        description: 'Flat ₹500 discount for new students enrolling in any course',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 999,
        validUntil: new Date('2027-12-31'),
        usageLimit: 5000,
        isActive: true,
      },
      {
        code: 'SKILL50',
        description: 'Special 50% discount on all certification programs',
        discountType: 'percentage',
        discountValue: 50,
        minOrderAmount: 1000,
        maxDiscountAmount: 1500,
        validUntil: new Date('2027-12-31'),
        usageLimit: 2000,
        isActive: true,
      },
      {
        code: 'GOVTGRANT',
        description: 'Special scholarship grant coupon for students',
        discountType: 'fixed',
        discountValue: 300,
        minOrderAmount: 500,
        validUntil: new Date('2027-12-31'),
        usageLimit: 10000,
        isActive: true,
      },
    ];

    for (const cp of sampleCoupons) {
      await Coupon.findOneAndUpdate(
        { code: cp.code },
        { ...cp },
        { upsert: true, new: true }
      );
    }
    console.log('Promotional Coupons initialized (WELCOME2026, SKILL50, GOVTGRANT).');

    console.log('\n=== Seed Complete ===');
    console.log('Super Admin Login:');
    console.log('  Email: admin@skillindia.com');
    console.log('  Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
