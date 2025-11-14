const razorpay = require("../config/razorpay.js");

const paymentProcessor = async (req, res) => {
  try {
    // const { amount, currency, receipt } = req.body;

    const options = {
      amount: 100 * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order,
      message: "Payment order created successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

module.exports = {
  paymentProcessor,
};
