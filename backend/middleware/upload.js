const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create uploads directory:', e.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + sanitizedExt);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^\.(jpeg|jpg|png|gif|webp|svg|ico|bmp|pdf|doc|docx|ppt|pptx|mp4|zip)$/i;
  const dangerousExtensions = /\.(html|htm|php|phtml|js|sh|exe|py|pl|cgi|bat|cmd|jsp|asp|aspx)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExtensions.test(ext)) {
    return cb(new Error('Executable or script files are strictly forbidden'), false);
  }

  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Supported: PNG, JPG, JPEG, WEBP, SVG, ICO, PDF, Documents, MP4'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
