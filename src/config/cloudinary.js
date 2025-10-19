const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Single Image
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'honeyshop/products',
    format: async (req, file) => 'webp', // Convert to webp for better compression
    public_id: (req, file) => {
      const timestamp = Date.now();
      return `product_${timestamp}`;
    },
    transformation: [
      { width: 800, height: 800, crop: "limit" }, 
      { quality: "auto" } 
    ]
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration for single image
const uploadProduct = require('multer')({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
}).single('image');

module.exports = { cloudinary, uploadProduct };