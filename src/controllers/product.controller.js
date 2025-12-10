const productModel = require("../models/products.model.js");
const adminModel = require("../models/admins.model.js");
const userModel = require("../models/users.model.js");
const vendorModel = require("../models/vendors.model.js");
const wishlistModel = require("../models/wishlist.model.js");
const cartModel = require("../models/carts.model.js");

const createProduct = async (req, res) => {
  try {
    const seller = req.admin;

    if (!seller) {
      return res.status(401).json({
        message: "Admin not found! Login and Try again...",
      });
    }

    // Get uploaded images from Cloudinary via multer
    const uploadedImages =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.path)
        : [];

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        message: "At least one product image is required",
      });
    }

    const { name, description, category, subCategory } = req.body;

    try {
      price = JSON.parse(req.body.price);
    } catch (e) {
      return res.status(400).json({
        message: "Invalid price format",
        error: e.message,
      });
    }

    if (!name || !description || !category) {
      return res.status(400).json({
        message: "Missing required fields: name, description, category",
      });
    }

    // Validate price
    if (!price.current || price.current <= 0) {
      return res.status(400).json({
        message: "Current price is required and must be greater than 0",
      });
    }

    const newProduct = await productModel.create({
      name,
      description,
      images: uploadedImages,
      category,
      subCategory: subCategory || "",
      price: {
        current: parseFloat(price.current),
        original: parseFloat(price.original || price.current),
        discount: parseFloat(price.discount || 0),
      },
      weight: JSON.parse(req.body.weight),
      quantity: parseInt(req.body.quantity),
      vendor: seller._id,
      specifications: JSON.parse(req.body.specifications),
      tags: JSON.parse(req.body.tags),
      isActive: req.body.isActive,
      isFeatured: req.body.isFeatured,
    });

    return res.status(201).json({
      message: "Product listed successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("❌ Product creation error:", error);
    console.error("📋 Error stack:", error.stack);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === "CastError") {
      return res.status(400).json({
        message: `Invalid data format: ${error.message}`,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
    const userId = req.user._id;
    const products = await productModel.find();

    const [wishlist, cart] = await Promise.all([
      wishlistModel.findOne({ user: userId }),
      cartModel.findOne({ user: userId }),
    ]);

    const wishlistProductIds = new Set(
      wishlist?.items
        ?.map((item) => item.product?.toString())
        .filter(Boolean) || []
    );

    const cartItemsMap = new Map(
      cart?.items
        ?.map((item) => [item.product?.toString(), item.quantity])
        .filter(([id]) => id) || []
    );

    const productsWithStatus = products.map((product) => {
      const productId = product._id.toString();
      return {
        ...product.toObject(),
        inWishlist: wishlistProductIds.has(productId),
        inCart: cartItemsMap.has(productId),
        cartQuantity: cartItemsMap.get(productId) || 0,
      };
    });

    const wishlistId = Array.from(wishlistProductIds);
    const cartId = Array.from(cartItemsMap.keys());

    if (products.length == 0) {
      return res.status(404).json({
        message: "No product found",
      });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      products: productsWithStatus,
      wishlistId,
      cartId,
    });

    // if (!userId) {
    //   const [wishlist, cart] = await Promise.all([
    //     wishlistModel.findOne({ user: userId }),
    //     cartModel.findOne({ user: userId }),
    //   ]);

    //   const wishlistProductIds = new Set(
    //     wishlist?.items
    //       ?.map((item) => item.product?.toString())
    //       .filter(Boolean) || []
    //   );

    //   const cartItemsMap = new Map(
    //     cart?.items
    //       ?.map((item) => [item.product?.toString(), item.quantity])
    //       .filter(([id]) => id) || []
    //   );

    //   const productsWithStatus = products.map((product) => {
    //     const productId = product._id.toString();
    //     return {
    //       ...product.toObject(),
    //       inWishlist: wishlistProductIds.has(productId),
    //       inCart: cartItemsMap.has(productId),
    //       cartQuantity: cartItemsMap.get(productId) || 0,
    //     };
    //   });

    //   const wishlistId = Array.from(wishlistProductIds);
    //   const cartId = Array.from(cartItemsMap.keys());

    //   return res.status(200).json({
    //     message: "Product fetched successfully",
    //     products: productsWithStatus,
    //     wishlistId,
    //     cartId,
    //   });
    // } else {
    //   return res.status(200).json({
    //     message: "Product fetched successfully",
    //     products: products,
    //     wishlistId: [],
    //     cartId: [],
    //   });
    // }
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Fetch wishlist and cart in parallel
    const [wishlist, cart] = await Promise.all([
      wishlistModel.findOne({ user: userId }),
      cartModel.findOne({ user: userId }),
    ]);

    // Create Sets and Maps for quick lookup
    const wishlistProductIds = new Set(
      wishlist?.items
        ?.map((item) => item.product?.toString())
        .filter(Boolean) || []
    );

    const cartItemsMap = new Map(
      cart?.items
        ?.map((item) => [item.product?.toString(), item.quantity])
        .filter(([id]) => id) || []
    );

    const productId = product._id.toString();

    // Add wishlist and cart status to the product
    const productWithStatus = {
      ...product.toObject(),
      inWishlist: wishlistProductIds.has(productId),
      inCart: cartItemsMap.has(productId),
      cartQuantity: cartItemsMap.get(productId) || 0,
    };

    // Get arrays of IDs
    const wishlistId = Array.from(wishlistProductIds);
    const cartId = Array.from(cartItemsMap.keys());

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: productWithStatus,
      wishlistId,
      cartId,
    });
  } catch (error) {
    console.error("Error in getProductById:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const getAllFilteredProducts = async (req, res) => {
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

const getRelatedProducts = async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    let query = {};

    if (category && category !== "all") {
      query.category = category;
    }

    const products = await productModel
      .find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  getAllAdminProduct,
  getProductByVendorId,
  getProductFilterOptions,
  getRelatedProducts,
};
