const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

// Cloudinary upload middleware (single image)
const upload = require("../middleware/upload");

const {
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getAllListings
} = require("../controllers/listing.controller");


// --------------------------------------------------
// GET ALL PUBLIC LISTINGS (Explore page) — No auth
// --------------------------------------------------
router.get("/public", getAllListings);


// --------------------------------------------------
// GET listings of logged-in user
// --------------------------------------------------
router.get("/", auth, getMyListings);


// --------------------------------------------------
// CREATE listing (single Cloudinary image)
// --------------------------------------------------
router.post("/create", auth, upload.single("image"), createListing);


// --------------------------------------------------
// UPDATE listing (single optional Cloudinary image)
// --------------------------------------------------
router.put("/:id", auth, upload.single("image"), updateListing);


// --------------------------------------------------
// DELETE listing
// --------------------------------------------------
router.delete("/:id", auth, deleteListing);


module.exports = router;
