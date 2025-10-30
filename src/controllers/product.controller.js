const productModel = require("../models/products.model.js");
const adminModel = require("../models/admins.model.js");
const vendorModel = require("../models/vendors.model.js");

const createProduct = async (req, res) => {
  try {
    const seller = req.admin;

    if (!seller) {
      return res.status(401).json({
        message: "Admin not found! Login and Try again...",
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
      specifications,
      tags,
      isActive,
      isFeatured,
    } = req.body;

    if (!name || !description || !category || !price || !quantity) {
      return res.status(400).json({
        message: "Missing required fields: name, description, category, price, quantity",
      });
    }

    if (!price.current || price.current <= 0) {
      return res.status(400).json({
        message: "Current price is required and must be greater than 0",
      });
    }

    const newProduct = await productModel.create({
      name,
      description,
      images: images || [],
      category,
      subCategory: subCategory || '',
      price: {
        current: price.current,
        original: price.original || price.current,
        discount: price.discount || 0
      },
      weight: weight || { value: 0, unit: 'g' },
      quantity,
      vendor: seller._id,
      specifications: specifications || {
        purity: "100%",
        harvestDate: "",
        expiryDate: ""
      },
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
    });

    return res.status(201).json({
      message: "Product listed successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid vendor ID format"
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ... keep your other controller methods (updateProduct, getAllAdminProduct, etc.)

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

const getAllAdminProduct = async (req, res) => {
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

const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      search = "",
      category,
      subCategory,
      minPrice,
      maxPrice,
      minRating,
      sortBy = "createdAt",
      sortOrder = "desc",
      priceRange,
    } = req.query;

    // Build filter object
    const filter = { isActive: true }; // Only show active products

    // Search filter (name or description)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Sub-category filter
    if (subCategory) {
      filter.subCategory = subCategory;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Custom price range (like ₹0 - ₹1000)
    if (priceRange) {
      const [min, max] = priceRange
        .split("-")
        .map((val) => parseFloat(val.replace(/[^0-9.]/g, "")));
      filter.price = { $gte: min, $lte: max };
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Sort configuration
    const sortConfig = {};
    if (sortBy === "price") {
      sortConfig.price = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "rating") {
      sortConfig.rating = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "name") {
      sortConfig.name = sortOrder === "asc" ? 1 : -1;
    } else {
      sortConfig.createdAt = sortOrder === "asc" ? 1 : -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const products = await productModel
      .find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-adminId -__v"); // Exclude admin-specific fields

    // Get total count for pagination info
    const totalProducts = await productModel.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    if (!products || products.length === 0) {
      return res.status(200).json({
        message: "No products found matching your criteria",
        products: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalProducts: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    return res.status(200).json({
      message: "Products retrieved successfully",
      products: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalProducts: totalProducts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
      filters: {
        search,
        category,
        subCategory,
        minPrice,
        maxPrice,
        minRating,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Product retrieval error:", error);
    return res.status(500).json({
      error: error.message,
      message: "Something went wrong while fetching products",
    });
  }
};

const getProductFilterOptions = async (req, res) => {
  try {
    const categories = await productModel.distinct("category", {
      isActive: true,
    });
    const subCategories = await productModel.distinct("subCategory", {
      isActive: true,
    });

    // Get price range statistics
    const priceStats = await productModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);

    return res.status(200).json({
      message: "Filter options retrieved successfully",
      filterOptions: {
        categories,
        subCategories,
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
      },
    });
  } catch (error) {
    console.error("Filter options error:", error);
    return res.status(500).json({
      error: error.message,
      message: "Something went wrong while fetching filter options",
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getAllAdminProduct,
  getProductByVendorId,
  getAllProducts,
  getProductFilterOptions,
};
