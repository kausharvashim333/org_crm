# Computer Institute Franchise Management System

A complete franchise management system for computer training institutes with Super Admin and Partner portals, custom partner homepages, skill development project management, and more.

## Features

### Super Admin
- Dashboard with organization-wide stats & analytics
- Franchise management (add, edit, activate/deactivate, delete)
- Auto-generates partner homepage & login page on registration
- View all students across all franchises
- Standard course catalog management
- Partner course approval system
- Skill development project management & assignment
- Royalty generation & payment tracking
- Certificate approval & issuance
- Study material upload (standard) & approval
- Broadcast notifications to all partners
- Reports & analytics with charts

### Partner (Franchise Owner)
- Dashboard with institute-specific stats
- Student management (CRUD, course enrollment)
- Course management (view standard + add custom with approval)
- Batch management (create, enroll students, assign teachers)
- Fee management (collect, receipts, pending tracking)
- Staff management (teachers, counselors, salary)
- Attendance (student & staff, daily marking)
- Exam & results management
- Skill development project execution (accept/decline, upload docs, placements)
- Study material (view standard + upload custom)
- Certificate requests to admin
- Inquiry management from homepage
- **Custom homepage editor** (hero, about, courses, gallery, testimonials, facilities, notices, theme color)
- Institute settings (social links, description, established year)

### Public Pages
- Organization main website
- Franchise list page (search by city/name)
- Individual partner homepage (customizable, public)
- Partner login page (branded per institute)
- Certificate verification (public, by code)

## Tech Stack

- **Frontend:** React 18, React Router, TailwindCSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, JWT auth, Multer (file uploads)
- **Database:** MongoDB with Mongoose

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure `.env` file:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/franchise_crm
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Make sure MongoDB is running, then seed the database:
```bash
npm run seed
```

This creates:
- Super Admin: `admin@skillindia.com` / `admin123`
- 6 standard courses (DCA, ADCA, Tally, Web Dev, Graphic Design, BCC)

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Usage

1. **Super Admin Login:** Go to `http://localhost:5173/admin/login`
   - Email: `admin@skillindia.com`
   - Password: `admin123`

2. **Add a Franchise:** Super Admin → Franchises → Add Franchise
   - Fill in institute details, owner info, royalty %
   - System auto-creates: partner account, custom homepage, login page
   - Partner gets a unique URL: `/institute/:slug`

3. **Partner Login:** Go to `/institute/:slug/login`
   - Partner uses the email & password set during registration
   - Partner can customize their homepage, manage students, courses, fees, etc.

4. **Public Homepage:** Anyone can visit `/institute/:slug` to see the partner's institute page

## URL Structure

| URL | Description |
|-----|-------------|
| `/` | Organization main website |
| `/franchises` | List of all franchise centers |
| `/verify-certificate` | Public certificate verification |
| `/institute/:slug` | Partner public homepage |
| `/institute/:slug/login` | Partner branded login page |
| `/admin/login` | Super Admin login |
| `/admin/dashboard` | Super Admin dashboard |
| `/partner/login` | Generic partner login |
| `/partner/dashboard` | Partner dashboard |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login (any role)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/profile` - Update profile

### Partners (Super Admin)
- `GET /api/partners` - List all partners
- `POST /api/partners` - Register new partner (auto-creates homepage)
- `GET /api/partners/:id` - Get partner details
- `PUT /api/partners/:id` - Update partner
- `PUT /api/partners/:id/status` - Activate/deactivate
- `DELETE /api/partners/:id` - Delete partner
- `GET /api/partners/slug/:slug` - Get partner by slug (public)

### Students, Courses, Batches, Fees, Staff, Attendance, Exams
- Full CRUD APIs with role-based access control
- Partner data isolation (partners only see their own data)

### Projects
- `POST /api/projects` - Create project (admin)
- `POST /api/projects/:id/assign` - Assign to partners (admin)
- `POST /api/projects/:id/accept` - Accept project (partner)
- `POST /api/projects/:id/document` - Upload document (partner)
- `PUT /api/projects/:id/document/:docId/approve` - Approve document (admin)
- `POST /api/projects/:id/placement` - Add placement (partner)

### Homepage
- `GET /api/homepage/public/:slug` - Get public homepage
- `GET /api/homepage` - Get own homepage (partner)
- `PUT /api/homepage` - Update homepage (partner)
- `PUT /api/homepage/section/:section` - Update specific section
- `POST /api/homepage/testimonials` - Add testimonial
- `POST /api/homepage/notices` - Add notice
- `POST /api/homepage/facilities` - Add facility
- `POST /api/homepage/gallery/upload` - Add gallery photo

### Royalty
- `POST /api/royalty/generate` - Generate royalty (admin)
- `POST /api/royalty/:id/payment` - Record payment

### Certificates
- `POST /api/certificates` - Request (partner)
- `PUT /api/certificates/:id/approve` - Approve & issue (admin)
- `GET /api/certificates/verify/:code` - Public verification

### Inquiries
- `POST /api/inquiries/public/:partnerId` - Submit inquiry (public)
- `GET /api/inquiries` - List inquiries (partner)
- `PUT /api/inquiries/:id/status` - Update status

## License

Private project. All rights reserved.
