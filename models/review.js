/**
 * Review Model Schema
 * This module defines the Mongoose schema for reviews, including fields for comment, rating, creation date, and author.
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  comment: {
    type: String,
    required: true, // Added validation
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true, // Added validation
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true, // Added validation
  },
});

module.exports = mongoose.model("Review", reviewSchema);