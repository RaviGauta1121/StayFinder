if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");
const helmet = require("helmet");

const upload = multer({ dest: "uploads/" });

const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const filterRouter = require("./routes/filter.js");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const wrapAsyn = require("./utils/wrapAsyn.js");

const app = express();
const port = process.env.PORT || 8080;
// const dbUrl = "mongodb://localhost:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

// View engine and public setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Enhanced Helmet CSP Configuration
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Required for Lordicon animations
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://cdn.lordicon.com",
        "https://api.mapbox.com",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://api.mapbox.com"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com", 
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com", // Added for Font Awesome fonts
        "data:" // Allow data: URLs for fonts
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "blob:" // Allow blob URLs for dynamic images
      ],
      connectSrc: [
        "'self'", 
        "https://api.mapbox.com", 
        "https://cdn.lordicon.com",
        "https://events.mapbox.com" // Added for Mapbox telemetry
      ],
      workerSrc: [
        "'self'",
        "blob:" // Required for some modern libraries
      ],
      childSrc: [
        "'self'",
        "blob:" // Required for some iframe content
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https:"], // Allow frames from HTTPS sources
    },
  })
);

// MongoDB connection
main()
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

async function main() {
  await mongoose.connect(dbUrl);
}

// Mongo store
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET || "defaultsecret",
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("Error in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true, // enable this if deploying over HTTPS
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash middleware
app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  res.locals.updateMsg = req.flash("update");
  res.locals.currUser = req.user;
  res.locals.currPage = req.path;
  next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/filter", filterRouter);

// Static Info Pages
app.get("/privacy", (req, res) => {
  res.render("users/privacy.ejs");
});

app.get("/terms", (req, res) => {
  res.render("users/terms.ejs");
});

// Fullscreen image view
app.get(
  "/image/fullscreen/:id",
  wrapAsyn(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.render("listings/fullscreenImage.ejs", { listing });
  })
);

// Catch-all route
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("listings/error.ejs", { err });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});