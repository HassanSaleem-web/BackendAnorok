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
  getAllListings,
  placeBid,
  rejectBid,
  acceptBid,
  getListingBids,
  getPaymentInfo,
  confirmPayment
} = require("../controllers/listing.controller");
const { authenticate } = require("passport");


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
router.delete("/:id/delete", auth, deleteListing);
// Place or update bid
router.post("/:id/bids", auth, placeBid);

// Get bids for listing
router.get("/:id/bids", auth, getListingBids);

// Accept bid (owner only)
router.put("/:id/bids/:bidId/accept", auth, acceptBid);

// Reject bid (owner only)
router.put("/:id/bids/:bidId/reject", auth, rejectBid);

router.get("/:listingId/payment-info", auth, getPaymentInfo);
router.post("/:listingId/confirm-payment", auth, confirmPayment);


module.exports = router;
