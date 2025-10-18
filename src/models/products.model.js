const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Honey", "Ghee"],
      required: true,
    },
    subCategory: {
      type: String,
      enum: [ "manuka", "organic", "flavored", "artifitial", "home-made"],
    },
    images: [{
      type: String,
      // required: true,
    }],
    price: {
      current: { type: Number, required: true, min: 0 },
      original: { type: Number, min: 0 },
      discount: { type: Number, default: 0, min: 0, max: 100 },
    },
    offer: {
      offerName: {
        type: String
      },
      offerTime: {
        type: Date
      }
    },
    weight: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ["g", "kg", "ml", "L"], default: "g" },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    specifications: {
      purity: { type: String, enum: ["100%", "95%", "90%", "85%"], default: "100%" },
      origin: { type: String },
      harvestDate: { type: Date },
      expiryDate: { type: Date, required: true },
      organic: { type: Boolean, default: false },
      vegan: { type: Boolean, default: true },
      glutenFree: { type: Boolean, default: true },
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
      breakdown: {
        five: { type: Number, default: 0 },
        four: { type: Number, default: 0 },
        three: { type: Number, default: 0 },
        two: { type: Number, default: 0 },
        one: { type: Number, default: 0 },
      },
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


const Product = mongoose.model("Product", productSchema);
module.exports = Product;