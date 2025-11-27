const userModel = require("../models/users.model.js");
const cartModel = require("../models/carts.model.js");
const wishlistModel = require("../models/wishlist.model.js");

async function getUserProfile(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        address: user?.address || "",
      },
      message: "User profile fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
}


async function getUserCartWish(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const [cart, wishlist] = await Promise.all([
      cartModel.findOne({ user: user._id }).populate('items.product'),
      wishlistModel.findOne({ user: user._id }).populate('items.product')
    ]);

    const cartCount = cart?.items?.length || 0;
    const wishlistCount = wishlist?.items?.length || 0;

    return res.status(200).json({
      counts: {
        cart: cartCount,
        wishlist: wishlistCount
      },
      message: "User profile fetched successfully",
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({ message: "Something went wrong", error: error.message });
  }
}

async function updateUserProfile(req, res) {
  try {
    const { fullName, email, phone, address } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { fullName, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
}

async function deleteUserAccount(req, res) {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }
    await userModel.findByIdAndDelete(userId);
    return res
      .status(200)
      .json({ message: "User account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
}

async function updatedAddress(req, res) {
  try {
    const userId = req.user._id;
    const addressData = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { address: addressData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Address updated successfully",
      address: updatedUser.address,
      success: true,
    });
  } catch (error) {
    console.error("❌ Address Update Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
      success: false,
    });
  }
}

module.exports = {
  getUserProfile,
  getUserCartWish,
  updateUserProfile,
  deleteUserAccount,
  updatedAddress,
};
