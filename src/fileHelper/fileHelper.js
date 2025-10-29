const multer = require("multer");
const { productStorage }  = require('../config/cloudinary.js');

const uploadProduct = multer({ storage: productStorage });

module.exports = { uploadProduct };
