const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
        index: true // Optimized querying bids by listing
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // Optimized querying bids by user
    },
    amount: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "paid"],
        default: "pending"
    },
    walletAddress: {
        type: String,
        default: null
    },
    acceptedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true, optimisticConcurrency: true });

// Prevent a user from placing multiple pending bids on the same listing
bidSchema.index({ listingId: 1, userId: 1, status: 1 });

module.exports = mongoose.model("Bid", bidSchema);
