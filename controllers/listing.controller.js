const listingService = require('../services/listing.service');
const auditLogger = require('../utils/auditLogger');

exports.createListing = async (req, res) => {
  try {
    const listing = await listingService.createListing(req.user.id, req.body, req.file);

    await auditLogger.logAction(req.user.id, 'LISTING_CREATED', req, {
      resourceId: listing._id,
      resourceModel: 'Listing',
      metadata: { projectId: listing.projectId }
    });

    res.json({ success: true, listing });
  } catch (err) {
    console.error("❌ Error creating listing:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await listingService.updateListing(req.user.id, req.params.id, req.body, req.file);

    await auditLogger.logAction(req.user.id, 'LISTING_UPDATED', req, {
      resourceId: listing._id,
      resourceModel: 'Listing'
    });

    res.json({ success: true, listing });
  } catch (err) {
    console.error("❌ Error updating listing:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    await listingService.deleteListing(req.user.id, req.params.id);
    res.json({ success: true, message: "Listing deleted" });
  } catch (err) {
    console.error("❌ Error deleting listing:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

exports.getMyListings = async (req, res) => {
  try {
    const { cursor, limit } = req.query;
    const { listings, nextCursor } = await listingService.getMyListings(req.user.id, cursor, limit);
    res.json({ success: true, listings, nextCursor });
  } catch (err) {
    console.error("❌ Error getting listings:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

exports.getAllListings = async (req, res) => {
  try {
    const { cursor, limit } = req.query;
    const { listings, nextCursor } = await listingService.getAllListings(cursor, limit);
    res.json({ success: true, listings, nextCursor });
  } catch (err) {
    console.error("❌ Error getting all listings:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { amount, message } = req.body;
    const bidsCount = await listingService.placeBid(req.user.id, req.params.id, amount, message);

    await auditLogger.logAction(req.user.id, 'BID_PLACED', req, {
      resourceId: req.params.id, // Targeting the listing
      resourceModel: 'Listing',
      metadata: { amount }
    });

    res.json({ success: true, bidsCount });
  } catch (err) {
    console.error("❌ placeBid error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getListingBids = async (req, res) => {
  try {
    const bids = await listingService.getListingBids(req.user.id, req.params.id);
    res.json({ success: true, bids });
  } catch (err) {
    console.error("❌ getListingBids error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.rejectBid = async (req, res) => {
  try {
    await listingService.rejectBid(req.user.id, req.params.id, req.params.bidId);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ rejectBid error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.acceptBid = async (req, res) => {
  try {
    await listingService.acceptBid(req.user.id, req.params.id, req.params.bidId, req.body.walletAddress);

    await auditLogger.logAction(req.user.id, 'BID_ACCEPTED', req, {
      resourceId: req.params.id, // Listing ID
      resourceModel: 'Listing',
      metadata: { acceptedBidId: req.params.bidId, walletProvided: !!req.body.walletAddress }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ acceptBid error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getPaymentInfo = async (req, res) => {
  try {
    const info = await listingService.getPaymentInfo(req.params.listingId);
    res.json(info);
  } catch (err) {
    console.error("❌ getPaymentInfo error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    await listingService.confirmPayment(req.user.id, req.params.listingId, req.body.txHash);

    await auditLogger.logAction(req.user.id, 'PAYMENT_COMPLETED', req, {
      resourceId: req.params.listingId,
      resourceModel: 'Listing',
      metadata: { txHash: req.body.txHash }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ confirmPayment error:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

exports.getMyActivity = async (req, res) => {
  try {
    const activity = await listingService.getMyActivity(req.user.id);
    res.json({ success: true, activity });
  } catch (err) {
    console.error("❌ getMyActivity error:", err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};
