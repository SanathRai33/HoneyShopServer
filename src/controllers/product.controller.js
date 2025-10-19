const productModel = require("../models/products.model.js");
const { cloudinary } = require("../config/cloudinary.js");

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

    // Validate required fields
    if (!name || !description || !category || !price || !weight || !quantity) {
      return res.status(400).json({
        message:
          "Name, description, category, price, weight, and quantity are required fields",
      });
    }

        const newProducts = await productModel.create({
      name,
      description,
      images,
      category,
      subCategory,
      price,
      weight,
      quantity,
      vendor,
      specifications,
      tags,
      isActive,
      isFeatured,
    });

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
      quantity: quantity,
      vendor: seller._id,
      specifications: {
        purity: specsObj.purity || "100%",
        origin: specsObj.origin || "",
        harvestDate: specsObj.harvestDate || null,
        expiryDate: specsObj.expiryDate
          ? new Date(specsObj.expiryDate)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        organic: specsObj.organic || false,
        vegan: specsObj.vegan ?? true,
        glutenFree: specsObj.glutenFree ?? true,
      },
      tags: tagsArray,
      isActive: isActive === "true" || isActive === true,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });

    // Populate vendor details in response
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

module.exports = { createProduct };
