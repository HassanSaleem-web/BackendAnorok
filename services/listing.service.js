const Listing = require("../models/Listing");
const Bid = require("../models/Bid");
const Project = require("../models/Project");

exports.createListing = async (userId, data, file) => {
    const { projectId, title, description, tags, price, priceType, deadline, percentageCompleted } = data;

    if (!projectId) {
        const error = new Error("projectId is required to create a listing");
        error.status = 400;
        throw error;
    }

    let imageUrl = null;
    if (file) {
        imageUrl = file.path;
    }

    const listing = await Listing.create({
        userId,
        projectId,
        title,
        description,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        price: Number(price),
        priceType,
        deadline: deadline || null,
        percentageCompleted: Number(percentageCompleted) || 0,
        attachment: imageUrl
    });

    return listing;
};

exports.updateListing = async (userId, listingId, data, file) => {
    const listing = await Listing.findOne({ _id: listingId, userId });
    if (!listing) {
        const error = new Error("Not authorized");
        error.status = 403;
        throw error;
    }

    const updates = {};
    const fields = ["title", "description", "price", "priceType", "deadline", "percentageCompleted"];

    fields.forEach(field => {
        if (data[field] !== undefined) {
            updates[field] = data[field];
        }
    });

    if (data.tags) {
        try {
            updates.tags = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags;
        } catch (e) {
            console.log("Invalid tags JSON");
        }
    }

    if (file) {
        updates.attachment = file.path;
    }

    Object.assign(listing, updates);
    await listing.save();

    return listing;
};

exports.deleteListing = async (userId, listingId) => {
    const listing = await Listing.findOne({ _id: listingId, userId });
    if (!listing) {
        const error = new Error("Not authorized");
        error.status = 403;
        throw error;
    }
    await listing.deleteOne();
    return true;
};

exports.getMyListings = async (userId, cursor, limit = 20) => {
    let query = { userId };
    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    const listings = await Listing.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

    // Populate bids count for each listing
    for (let listing of listings) {
        listing.bidsCount = await Bid.countDocuments({ listingId: listing._id });
    }

    const nextCursor = listings.length > 0 ? listings[listings.length - 1].createdAt : null;
    return { listings, nextCursor };
};

exports.getAllListings = async (cursor, limit = 20) => {
    let query = { isOpen: true }; // Only show open listings in public feed
    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    const listings = await Listing.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

    // Populate bids count
    for (let listing of listings) {
        listing.bidsCount = await Bid.countDocuments({ listingId: listing._id });
    }

    const nextCursor = listings.length > 0 ? listings[listings.length - 1].createdAt : null;
    return { listings, nextCursor };
};

exports.placeBid = async (userId, listingId, amount, message) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.status = 404;
        throw error;
    }

    if (!listing.isOpen) {
        const error = new Error("Bidding is closed");
        error.status = 400;
        throw error;
    }

    if (listing.userId.toString() === userId) {
        const error = new Error("You cannot bid on your own listing");
        error.status = 403;
        throw error;
    }

    if (!amount || amount <= 0) {
        const error = new Error("Invalid bid amount");
        error.status = 400;
        throw error;
    }

    if (Number(amount) < Number(listing.price)) {
        const error = new Error(`Minimum bid is ${listing.price}`);
        error.status = 400;
        throw error;
    }

    const existingBid = await Bid.findOne({ listingId: listing._id, userId, status: "pending" });

    if (existingBid) {
        existingBid.amount = amount;
        existingBid.message = message;
        await existingBid.save();
    } else {
        await Bid.create({ listingId: listing._id, userId, amount, message });
    }

    const bidsCount = await Bid.countDocuments({ listingId: listing._id });
    return bidsCount;
};

exports.getListingBids = async (userId, listingId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.status = 404;
        throw error;
    }

    const isOwner = listing.userId.toString() === userId;
    let query = { listingId: listing._id };

    if (!isOwner) {
        query.userId = userId;
    }

    let bids = await Bid.find(query)
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 });

    const now = new Date();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    let expiredBidIds = [];

    bids.forEach(b => {
        if (b.status === 'accepted' && b.acceptedAt) {
            if (now - new Date(b.acceptedAt) > TWENTY_FOUR_HOURS) {
                expiredBidIds.push(b._id);
            }
        }
    });

    if (expiredBidIds.length > 0) {
        await Bid.updateMany(
            { _id: { $in: expiredBidIds } },
            { $set: { status: "rejected" } }
        );
        await Listing.updateOne(
            { _id: listing._id },
            { $set: { isOpen: true, winningBidId: null, soldTo: null } }
        );

        bids = bids.map(b => {
            if (expiredBidIds.some(id => id.toString() === b._id.toString())) {
                b.status = "rejected";
            }
            return b;
        });
    }

    return bids;
};

exports.rejectBid = async (userId, listingId, bidId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.status = 404;
        throw error;
    }

    if (listing.userId.toString() !== userId) {
        const error = new Error("Unauthorized");
        error.status = 403;
        throw error;
    }

    const bid = await Bid.findById(bidId);
    if (!bid || bid.listingId.toString() !== listing._id.toString()) {
        const error = new Error("Bid not found");
        error.status = 404;
        throw error;
    }

    if (bid.status === "accepted") {
        const error = new Error("Cannot reject accepted bid");
        error.status = 400;
        throw error;
    }

    bid.status = "rejected";
    await bid.save();
    return true;
};

exports.acceptBid = async (userId, listingId, bidId, walletAddress) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.status = 404;
        throw error;
    }

    if (!walletAddress) {
        const error = new Error("Wallet address is required to accept a bid");
        error.status = 400;
        throw error;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        const error = new Error("Invalid wallet address");
        error.status = 400;
        throw error;
    }

    if (listing.userId.toString() !== userId) {
        const error = new Error("Unauthorized");
        error.status = 403;
        throw error;
    }

    const bid = await Bid.findById(bidId);
    if (!bid || bid.listingId.toString() !== listing._id.toString()) {
        const error = new Error("Bid not found");
        error.status = 404;
        throw error;
    }

    bid.status = "accepted";
    bid.walletAddress = walletAddress;
    bid.acceptedAt = new Date();
    await bid.save();

    listing.winningBidId = bid._id;
    listing.soldTo = bid.userId;
    // We do NOT set soldAt here to maintain distinction between "accepted" and officially "sold" (paid)
    listing.isOpen = false;
    await listing.save({ validateBeforeSave: false }); // Bypass validation for older documents missing projectId

    await Bid.updateMany(
        { listingId: listing._id, _id: { $ne: bid._id } },
        { $set: { status: "rejected" } }
    );

    return true;
};

exports.getPaymentInfo = async (listingId) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.status = 404;
        throw error;
    }

    const bid = await Bid.findOne({ listingId: listing._id, status: "accepted" });
    if (!bid) {
        const error = new Error("No accepted bid");
        error.status = 400;
        throw error;
    }

    return { amount: bid.amount, walletAddress: bid.walletAddress };
};

exports.confirmPayment = async (userId, listingId, txHash) => {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.status = 404;
        throw error;
    }

    const isOwner = listing.userId.toString() === userId;
    const isBuyer = listing.soldTo && listing.soldTo.toString() === userId;

    if (!isOwner && !isBuyer) {
        const error = new Error("Unauthorized to confirm payment for this listing");
        error.status = 403;
        throw error;
    }

    // Transfer Project Ownership
    if (listing.projectId && listing.soldTo) {
        await Project.findByIdAndUpdate(listing.projectId, {
            $set: { userId: listing.soldTo },
            $push: {
                ownershipHistory: {
                    userId: listing.soldTo,
                    changedAt: new Date() // Tracks when it was bought
                }
            }
        }, { runValidators: false }); // Bypass validators for legacy docs
    }

    listing.soldAt = new Date();
    listing.isOpen = false;
    await listing.save({ validateBeforeSave: false }); // Bypass validation for older documents missing projectId

    // Mark the bid as officially paid
    const bid = await Bid.findOne({ listingId: listing._id, status: "accepted" });
    if (bid) {
        bid.status = "paid";
        await bid.save();
    }

    return true;
};

exports.getMyActivity = async (userId) => {
    const myListings = await Listing.find({ userId }).lean();
    const myListingIds = myListings.map(l => l._id);

    let bidsReceived = await Bid.find({ listingId: { $in: myListingIds } })
        .populate("userId", "fullName email")
        .populate("listingId", "title price projectId description tags")
        .sort({ createdAt: -1 })
        .lean();

    let bidsPlaced = await Bid.find({ userId })
        .populate("listingId", "title price projectId userId description tags")
        .sort({ createdAt: -1 })
        .lean();

    // --- AUTO EXPIRE 24-HOUR BIDS ---
    const now = new Date();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    let expiredBidIds = [];
    let expiredListingIds = [];

    const checkExpiry = (b) => {
        if (b.status === 'accepted' && b.acceptedAt) {
            const timeDiff = now - new Date(b.acceptedAt);
            if (timeDiff > TWENTY_FOUR_HOURS) {
                expiredBidIds.push(b._id);
                if (b.listingId && b.listingId._id) {
                    expiredListingIds.push(b.listingId._id);
                }
            }
        }
    };

    bidsReceived.forEach(checkExpiry);
    bidsPlaced.forEach(checkExpiry);

    if (expiredBidIds.length > 0) {
        // Bulk update the database
        await Bid.updateMany(
            { _id: { $in: expiredBidIds } },
            { $set: { status: "rejected" } }
        );
        await Listing.updateMany(
            { _id: { $in: expiredListingIds } },
            { $set: { isOpen: true, winningBidId: null, soldTo: null } }
        );

        // Mutate the local arrays so the frontend sees the change immediately
        bidsReceived = bidsReceived.map(b => {
            if (expiredBidIds.some(id => id.toString() === b._id.toString())) {
                b.status = "rejected";
            }
            return b;
        });

        bidsPlaced = bidsPlaced.map(b => {
            if (expiredBidIds.some(id => id.toString() === b._id.toString())) {
                b.status = "rejected";
            }
            return b;
        });
    }
    // --- END AUTO EXPIRE ---

    // Sales are only listings that have a completely "paid" winning bid
    const paidSalesBids = await Bid.find({ listingId: { $in: myListingIds }, status: "paid" }).lean();
    const paidSalesListingIds = new Set(paidSalesBids.map(b => b.listingId.toString()));
    const sales = myListings.filter(l => paidSalesListingIds.has(l._id.toString()));

    // Purchases are listings where the user placed a bid that is now "paid"
    const paidPurchasesBids = await Bid.find({ userId, status: "paid" })
        .populate("listingId")
        .lean();

    // Filter out nulls in case the listing was deleted
    let purchases = paidPurchasesBids.map(b => b.listingId).filter(Boolean);

    return {
        myListings,
        bidsReceived,
        bidsPlaced,
        sales,
        purchases
    };
};
