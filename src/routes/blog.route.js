const express = require("express");
const router = express.Router();
const { authAdminMiddleware, authUserMiddleware } = require("../middlewares/auth.middleware.js");
const { getAllBlogs, createBlog, updateBlog, likeBlog, getBlogBySlug, searchBlogs, deleteBlog } = require("../controllers/blog.controller.js");

router.get("/", getAllBlogs);
router.get("/search", searchBlogs);
// router.get("/category/:category", blogController.getBlogsByCategory);
// router.get("/featured", blogController.getFeaturedBlogs);
router.get("/:slug", getBlogBySlug);

router.post("/:id/like", authUserMiddleware, likeBlog);

router.post("/", authAdminMiddleware, createBlog);
router.put("/:id", authAdminMiddleware, updateBlog);
router.delete("/:id", authAdminMiddleware, deleteBlog);
// router.patch("/:id/status", authAdminMiddleware, blogController.updateBlogStatus);

module.exports = router;