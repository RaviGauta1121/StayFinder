/**
 * Category Filter Routes
 * This module sets up routes to filter listings based on their category. 
 * Each category route fetches listings that match the specified category 
 * and renders the 'filter.ejs' template with the listings.
 */

const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");

// Define the enum values for categories (matching frontend exactly)
const categories = [
  "trending",
  "beach", 
  "arctic",
  "outside",
  "iconic-city",
  "castles",
  "pool",
  "camping",
  "cabin",
  "farms",
  "mountain",
  "domes",
  "boats",
  "tropical",
  "windmill",
  "ski",
  "chef",
  "disabled",
  "play",
];

// Create a route for each category
categories.forEach((category) => {
  router.get(`/${category}`, async (req, res) => {
    try {
      // Build filter query
      let query = { category: category };
      
      // Add additional filters from query parameters
      const { type, bedrooms, beds, accessibility } = req.query;
      
      if (type) {
        query.type = type;
      }
      
      if (bedrooms) {
        query.bedrooms = bedrooms === "8" ? { $gte: 8 } : parseInt(bedrooms);
      }
      
      if (beds) {
        query.beds = beds === "8" ? { $gte: 8 } : parseInt(beds);
      }
      
      if (accessibility) {
        query.accessibility = accessibility === "yes";
      }

      let listings = await Listing.find(query).populate('owner');
      
      // Set current page for navigation highlighting
      const currPage = `/filter/${category}`;
      
      res.render("listings/filter.ejs", {
        listings,
        category,
        currPage,
        includeNavBelow: true,
        appliedFilters: {
          type,
          bedrooms,
          beds,
          accessibility
        }
      });
    } catch (error) {
      console.error(`Error fetching listings for category ${category}:`, error);
      req.flash("error", "An error occurred while fetching listings.");
      res.redirect("/listings");
    }
  });
});

// Special route for trending (if you want different logic)
router.get("/trending", async (req, res) => {
  try {
    // You can implement special logic for trending
    // For example, sort by most reviews or highest rating
    let listings = await Listing.find({ category: "trending" })
      .populate('owner')
      .populate('reviews')
      .sort({ createdAt: -1 }); // or sort by review count, rating, etc.
    
    const currPage = "/filter/trending";
    
    res.render("listings/filter.ejs", {
      listings,
      category: "trending",
      currPage,
      includeNavBelow: true,
      appliedFilters: req.query
    });
  } catch (error) {
    console.error("Error fetching trending listings:", error);
    req.flash("error", "An error occurred while fetching trending listings.");
    res.redirect("/listings");
  }
});

module.exports = router;