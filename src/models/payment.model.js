const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    provider: {
      type: String,
      enum: ['razorpay', 'stripe', 'paytm', 'paypal', 'cod', 'upi', 'bank'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['card', 'netbanking', 'upi', 'wallet', 'cash', 'banktransfer'],
    },
    providerPaymentId: {
      type: String, 
    },
    providerOrderId: {
      type: String, 
    },
    receipt: {
      type: String, 
    },
    upiId: {
      type: String,
    },
    referenceId: {
      type: String, 
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    refund: {
      amount: Number,
      refundedAt: Date,
      method: String,
      status: {
        type: String,
        enum: ['none', 'processing', 'completed'],
        default: 'none',
      },
      providerRefundId: String,
    },
    notes: {
      type: Object,
    },
    meta: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;