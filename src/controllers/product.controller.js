const productModel = require("../models/products.model.js");
const adminModel = require("../models/admins.model.js");
const vendorModel = require("../models/vendors.model.js");

const createProduct = async (req, res) => {
  try {
    const seller = req.admin || req.vendor;

    if (!seller) {
      return res.status(401).json({
        message: "Authentication required! Please login.",
      });
    }

    // Get image URL from uploaded file
    const imageUrl = req.file ? req.file.path : null;

    // If no image uploaded but image URL provided in body
    const bodyImage = req.body.image || null;

    const productImage = imageUrl || bodyImage;

    if (!productImage) {
      return res.status(400).json({
        message: "Product image is required",
      });
    }

    const {
      name,
      description,
      category,
      subCategory,
      price,
      weight,
      quantity,
      specifications,
      tags,
      isActive = true,
      isFeatured = false,
    } = req.body;

    if (!name || !description || !category || !price || !weight || !quantity) {
      return res.status(400).json({
        message:
          "Name, description, category, price, weight, and quantity are required fields",
      });
    }

    const newProduct = await productModel.create({
      name: name.trim(),
      description: description.trim(),
      images: [productImage],
      category,
      subCategory: subCategory || null,
      price: {
        current: price.current,
        original: price.original,
        discount: price.discount || 0,
      },
      weight: {
        value: weight.value,
        unit: weight.unit || "g",
      },
      quantity,
      vendor: seller._id,
      specifications: {
        purity: specifications.purity || "100%",
        harvestDate: specifications.harvestDate || null,
        expiryDate: specifications.expiryDate
          ? new Date(specifications.expiryDate)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      tags: tags,
      isActive: isActive === "true" || isActive === true,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });

    const populatedProduct = await productModel
      .findById(newProduct._id)
      .populate("vendor", "businessName businessEmail");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        id: populatedProduct._id,
        name: populatedProduct.name,
        description: populatedProduct.description,
        image: populatedProduct.images[0],
        price: populatedProduct.price,
        category: populatedProduct.category,
        vendor: populatedProduct.vendor,
      },
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({
      error: error,
      message: "Something went wrong",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const seller = req.admin || req.vendor;
    const productId = req.params.id;
    const { price, offer, quantity, tags, isActive, isFeatured } = req.body;

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login and try again.",
      });
    }

    if (!productId) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const existingProduct = await productModel.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { price, offer, quantity, tags, isActive, isFeatured },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or could not be updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({
      error: error,
      message: "Something went wrong",
    });
  }
};

const getAllProduct = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const adminExist = await adminModel.findById(adminId);

    if (!adminExist) {
      return res.status(200).json({
        message: "Admin not found, Login and Try again...",
      });
    }

    const allProducts = await productModel.find().sort({ timestamp: 1 });

    if (!allProducts) {
      return res.status(200).json({
        message: "No products listed yet",
      });
    }

    return res.status(200).json({
      message: "Products got successfully",
      products: allProducts,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({
      error: error,
      message: "Something went wrong",
    });
  }
};

const getProductByVendorId = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendorExist = await vendorModel.findById({ vendorId });

    if (!vendorExist) {
      return res.status(200).json({
        message: "Vendor not found, Login and Try again...",
      });
    }

    const vendorProduct = await productModel.find({ vendor: vendorId });

    if (!vendorProduct) {
      return res.status(200).json({
        message: "No products listed yet",
      });
    }

    return res.status(200).json({
      message: "Products fetched successfully",
      products: vendorProduct,
    });
  } catch (error) {
    console.error("Product creation error:", error);

    return res.status(500).json({
      error: error,
      message: "Something went wrong",
    });
  }
};

module.exports = { createProduct, updateProduct, getAllProduct, getProductByVendorId };
