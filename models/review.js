/**
 * * Review Model Schema
 * ? This module defines the Mongoose schema for reviews, including fields for comment, rating, creation date, and author.
 */

const mongoose = require("mongoose"); // ✅ fixed typo
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  comment: {
    type: String,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Review", reviewSchema);
