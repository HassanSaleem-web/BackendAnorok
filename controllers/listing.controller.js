const Listing = require("../models/Listing");

//
// --------------------------------------------------
// CREATE LISTING  (Single Cloudinary Image)
// --------------------------------------------------
//
exports.createListing = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      projectId,            // 🔥 NEW REQUIRED FIELD
      title,
      description,
      tags,
      price,
      priceType,
      deadline,
      percentageCompleted
    } = req.body;

    // Validate projectId
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "projectId is required to create a listing"
      });
    }

    // Cloudinary image (single)
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;  // Cloudinary secure URL
    }

    const listing = await Listing.create({
      userId,
      projectId,                      // 🔥 NEW
      title,
      description,
      tags: tags ? JSON.parse(tags) : [],
      price: Number(price),
      priceType,
      deadline: deadline || null,
      percentageCompleted: Number(percentageCompleted) || 0,
      attachment: imageUrl
    });

    return res.json({ success: true, listing });

  } catch (err) {
    console.error("❌ Error creating listing:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


//
// --------------------------------------------------
// UPDATE LISTING  (Optional new image)
// --------------------------------------------------
//
exports.updateListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const listingId = req.params.id;

    const listing = await Listing.findOne({ _id: listingId, userId });
    if (!listing) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    // Prepare safe update object
    const updates = {};

    // Allowed fields for update
    const fields = [
      "title",
      "description",
      "price",
      "priceType",
      "deadline",
      "percentageCompleted"
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Parse tags safely
    if (req.body.tags) {
      try {
        updates.tags = JSON.parse(req.body.tags);
      } catch (e) {
        console.log("Invalid tags JSON");
      }
    }

    // Cloudinary image update
    if (req.file) {
      updates.attachment = req.file.path;
    }

    // ❗ DO NOT ALLOW CHANGES TO:
    // projectId, bids, winningBidId, soldTo, soldAt, isOpen
    // (keeps everything backward-compatible)

    Object.assign(listing, updates);
    await listing.save();

    res.json({ success: true, listing });

  } catch (err) {
    console.error("❌ Error updating listing:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


//
// --------------------------------------------------
// DELETE LISTING
// --------------------------------------------------
//
exports.deleteListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const listingId = req.params.id;

    const listing = await Listing.findOne({ _id: listingId, userId });

    if (!listing) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    await listing.deleteOne();

    res.json({ success: true, message: "Listing deleted" });

  } catch (err) {
    console.error("❌ Error deleting listing:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


//
// --------------------------------------------------
// GET ALL LISTINGS FOR CURRENT USER (Protected)
// --------------------------------------------------
//
exports.getMyListings = async (req, res) => {
  try {
    const userId = req.user.id;

    const listings = await Listing.find({ userId }).sort({ createdAt: -1 });

    res.json({ success: true, listings });

  } catch (err) {
    console.error("❌ Error getting listings:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


//
// --------------------------------------------------
// GET ALL LISTINGS (Public—for Explore page)
// --------------------------------------------------
//
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    console.error("❌ Error getting all listings:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
// --------------------------------------------------
// PLACE / UPDATE BID
// --------------------------------------------------
exports.placeBid = async (req, res) => {
  try {
    const { amount, message } = req.body;
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (!listing.isOpen) {
      return res.status(400).json({ message: "Bidding is closed" });
    }

    if (listing.userId.toString() === req.user.id.toString()) {
      return res.status(403).json({ message: "You cannot bid on your own listing" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    // ✅ ADD THIS BLOCK HERE
    if (Number(amount) < Number(listing.minimumAmount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum bid is ${listing.minimumAmount} ETH`
      });
    }

    const existingBid = listing.bids.find(
      (b) =>
        b.userId.toString() === req.user.id.toString() &&
        b.status === "pending"
    );

    if (existingBid) {
      existingBid.amount = amount;
      existingBid.message = message;
      existingBid.createdAt = new Date();
    } else {
      listing.bids.push({
        userId: req.user.id,
        amount,
        message,
      });
    }

    await listing.save();

    res.json({
      success: true,
      bidsCount: listing.bids.length,
    });
  } catch (err) {
    console.error("❌ placeBid error:", err);
    res.status(500).json({ message: "Failed to place bid" });
  }
};

// --------------------------------------------------
// GET BIDS FOR LISTING
// --------------------------------------------------
exports.getListingBids = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("bids.userId", "fullName email");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const isOwner = listing.userId.toString() === req.user.id.toString();

    const bids = isOwner
      ? listing.bids
      : listing.bids.filter(
          (b) => b.userId._id.toString() === req.user.id.toString()
        );

    res.json({ success: true, bids });
  } catch (err) {
    console.error("❌ getListingBids error:", err);
    res.status(500).json({ message: "Failed to fetch bids" });
  }
};
// --------------------------------------------------
// REJECT BID (OWNER ONLY)
// --------------------------------------------------
exports.rejectBid = async (req, res) => {
  try {
    const { id, bidId } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const bid = listing.bids.id(bidId);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    if (bid.status === "accepted") {
      return res.status(400).json({ message: "Cannot reject accepted bid" });
    }

    bid.status = "rejected";
    await listing.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ rejectBid error:", err);
    res.status(500).json({ message: "Failed to reject bid" });
  }
};
// --------------------------------------------------
// ACCEPT BID (OWNER ONLY)
// --------------------------------------------------
exports.acceptBid = async (req, res) => {
  try {
    const { id, bidId } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required to accept a bid"
      });
    }
    // basic validation (recommended)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address"
      });
    }

    if (listing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const bid = listing.bids.id(bidId);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    bid.status = "accepted";
    bid.walletAddress = walletAddress;
    listing.winningBidId = bid._id;
    listing.soldTo = bid.userId;
    listing.soldAt = new Date();
    listing.isOpen = false;

    listing.bids.forEach((b) => {
      if (b._id.toString() !== bidId) {
        b.status = "rejected";
      }
    });

    await listing.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ acceptBid error:", err);
    res.status(500).json({ message: "Failed to accept bid" });
  }
};

exports.getPaymentInfo = async (req, res) => {
  console.log(req.params.listingId);
  const listing = await Listing.findById(req.params.listingId);
  
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const bid = listing.bids.find(b => b.status === "accepted");
  if (!bid) {
    return res.status(400).json({ message: "No accepted bid" });
  }

  res.json({
    amount: bid.amount,          // MATIC
    walletAddress: bid.walletAddress
  });
};


exports.confirmPayment = async (req, res) => {
  const { txHash } = req.body;

  // (Blockchain dev later verifies txHash on Polygon)

  await Listing.findByIdAndUpdate(req.params.listingId, {
    soldAt: new Date(),
    isOpen: false
  });

  res.json({ success: true });
};

