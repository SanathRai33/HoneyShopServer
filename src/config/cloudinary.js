const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

console.log('-------------------Cloudinary Start----------------------')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('-------------------Cloudinary Middle----------------------')


const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    resource_type: "image",
    folder: "product_folder",
    format: async (req, file) => "jpg",
    public_id: (req, file) =>
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname,
  },
});

console.log('-------------------Cloudinary End----------------------')


module.exports = { cloudinary, productStorage };
