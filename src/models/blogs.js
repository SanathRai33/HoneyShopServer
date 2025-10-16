const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Honey Benefits", "Recipes", "Beekeeping Tips", "Our Story", "Other"],
      required: true,
    },

    tags: [
      {
        type: String,
      },
    ],

    thumbnail: {
      type: String, // Image URL
      required: true,
    },

    content: {
      type: String, // Can store HTML or Markdown
      required: true,
    },

    excerpt: {
      type: String, // Short summary (like in UI)
      maxLength: 300,
    },

    author: {
      name: { type: String, required: true },
      avatar: { type: String }, // Optional image
    },

    readTime: {
      type: Number, // in minutes
      default: 3,
    },

    publishedDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  }
  next();
});

const blogModel = mongoose.model("blog", blogSchema);
module.exports = blogModel;
