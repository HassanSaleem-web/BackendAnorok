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
      title,
      description,
      tags,
      price,
      priceType,
      deadline,
      percentageCompleted
    } = req.body;

    // Cloudinary image (single)
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;  // Cloudinary secure URL
    }

    const listing = await Listing.create({
      userId,
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

    // Only update fields if present
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

    // If new Cloudinary image uploaded
    if (req.file) {
      updates.attachment = req.file.path; // Cloudinary URL
    }

    // Apply updates
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
