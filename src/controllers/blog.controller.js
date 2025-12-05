const blogModel = require("../models/blogs.model.js");
const userModel = require("../models/users.model.js");

const getAllBlogs = async (req, res) => {
  try {
    const { category = "", page = 1, limit = 10, featured } = req.query;

    const query = { status: "published" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (featured) {
      query.featured = featured === "true";
    }

    const skip = (page - 1) * limit;

    const blogs = await blogModel
      .find(query)
      .populate("author", "name avatar")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content");

    const total = await blogModel.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching blogs",
      error: error.message,
    });
  }
};

const searchBlogs = async (req, res) => {
  try {
    const { q, category } = req.query;

    const query = { status: "published" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (q) {
      query.$text = { $search: q };
    }

    const blogs = await blogModel
      .find(query)
      .populate("author", "name avatar")
      .sort({ publishedAt: -1 })
      .select("-content");

    res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching blogs",
      error: error.message,
    });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await blogModel
      .findOne({ slug, status: "published" })
      .populate("author", "name email avatar bio")
      .populate("comments.user", "name avatar");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "blogModel not found",
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching blog",
      error: error.message,
    });
  }
};

const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const blog = await blogModel.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "blogModel not found",
      });
    }

    // Check if already liked
    const alreadyLiked = blog.likes.includes(userId);

    if (alreadyLiked) {
      // Remove like
      blog.likes = blog.likes.filter((likeId) => likeId.toString() !== userId);
    } else {
      // Add like
      blog.likes.push(userId);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likeCount: blog.likes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating like",
      error: error.message,
    });
  }
};

const createBlog = async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      author: req.admin._id,
      authorName: req.admin.name,
    };

    const blog = await blogModel.create(blogData);

    res.status(201).json({
      success: true,
      message: "blogModel created successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating blog",
      error: error.message,
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await blogModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "blogModel not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "blogModel updated successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await blogModel.findOneAndDelete({ _id: id });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "blogModel not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "blog deleted successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBlogs,
  searchBlogs,
  getBlogBySlug,
  likeBlog,
  createBlog,
  updateBlog,
  deleteBlog,
};
