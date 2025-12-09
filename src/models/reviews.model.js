const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true, // Ensures only users who purchased can review
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      enum: [ "feedback", "comment", "reply"],
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    images: [{
      type: String,
    }],
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    vendorReply: {
      comment: { type: String },
      repliedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);


reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;