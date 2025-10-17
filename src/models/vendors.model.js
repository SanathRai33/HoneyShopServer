const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    businessPhone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
    },
    ownerName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    businessAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: "India" },
    },
    businessType: {
      type: String,
      enum: [ "distributor", "retailer", "wholesaler", "manufacturer", "delivery_partner" ],
      default: "retailer",
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    logo: {
      type: String,
      default: "",
    },
    documents: {
      gstNumber: { type: String },
      licenseNumber: { type: String },
      fssaiLicense: { type: String },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
    },
    bankDetails: {
      accountNumber: { type: String },
      accountHolderName: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",   
    }],
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    }],
  },
  {
    timestamps: true,
  }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
module.exports = Vendor;