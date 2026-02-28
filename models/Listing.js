const mongoose = require("mongoose");

// Bid module extracted to models/Bid.js for scalability

const ListingSchema = new mongoose.Schema(
  {
    // 🔹 Who listed the project
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 🔹 Link to the actual project
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    title: { type: String, required: true },
    description: { type: String, required: true },

    tags: { type: [String], default: [] },

    // 🔹 Minimum bid amount
    price: { type: Number, default: 0 },
    priceType: {
      type: String,
      enum: ["fixed", "hourly"],
      default: "fixed"
    },

    deadline: { type: Date, default: null },
    percentageCompleted: { type: Number, default: 0 },

    attachment: {
      type: String,
      default: null
    },

    // 🔹 OPEN / CLOSED LISTING STATUS
    isOpen: { type: Boolean, default: true },

    // Bids removed to fix 16MB limit. Bids now stored in the Bids collection referencing this ListingId.

    // 🔹 Final accepted bid (if any)
    winningBidId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    // 🔹 SALE DATA (filled after on-chain payment)
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    soldAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, optimisticConcurrency: true }
);

// Add scalable Indexes
ListingSchema.index({ userId: 1 });
ListingSchema.index({ projectId: 1 });
ListingSchema.index({ isOpen: 1 });
ListingSchema.index({ createdAt: -1 }); // For feed sorting

module.exports = mongoose.model("Listing", ListingSchema);
