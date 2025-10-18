const productModel = require("../models/products.model.js");

const createProduct = async (req, res) => {
  try {
    const seller = req.admin || req.vendor;
    
    if (!seller) {
      return res.status(401).json({
        message: "Vendor not found! Login and Try again...",
      });
    }

    if (!req.body) {
      return res.status(404).json({
        message: "No product found to create",
      });
    }
    
    const {
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
    } = req.body;

    const newProduct = await productModel.create({
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

    return res.status(201).json({
      message: "Product listed successfully",
      product: {
        name: newProduct.name,
        description: newProduct.description,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
      message: "Something went wrong",
    });
  }
};

module.exports = { createProduct };
