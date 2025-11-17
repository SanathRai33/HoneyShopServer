const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      // required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          // required: true,
        },
        quantity: {
          type: Number,
          // required: true,
          min: 1,
        },
        price: {
          type: Number,
          // required: true,
          min: 0,
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      // required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      // required: true,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      landmark: { type: String },
    },
    payment: {
      method: {
        type: String,
        enum: [
          "credit_card",
          "debit_card",
          "upi",
          "net_banking",
          "cod",
          "wallet",
        ],
        // required: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: { type: String },
      paymentDate: { type: Date },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    deliveryDate: {
      type: Date,
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
