const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^\.(jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|zip)$/i;
  const dangerousExtensions = /\.(html|htm|php|phtml|js|sh|exe|py|pl|cgi|bat|cmd|svg|jsp|asp|aspx)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExtensions.test(ext)) {
    return cb(new Error('Executable or script files are strictly forbidden'), false);
  }

  const extValid = allowedExtensions.test(ext);
  const mimeValid = /image|pdf|msword|wordprocessingml|powerpoint|presentationml|video\/mp4|zip/i.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only images, PDFs, documents, MP4, and ZIP files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
