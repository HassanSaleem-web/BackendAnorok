const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: { type: Number, required: true },
  message: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "paid"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

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

    price: { type: Number, default: 0 },
    priceType: { type: String, enum: ["fixed", "hourly"], default: "fixed" },

    deadline: { type: Date, default: null },
    percentageCompleted: { type: Number, default: 0 },

    attachment: {
      type: String,
      default: null
    },

    // 🔹 OPEN / CLOSED LISTING STATUS
    isOpen: { type: Boolean, default: true },

    // 🔹 BIDDING SYSTEM
    bids: {
      type: [bidSchema],
      default: []
    },

    // 🔹 Final accepted bid (if any)
    winningBidId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    // 🔹 SALE DATA
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
  { timestamps: true }
);

module.exports = mongoose.model("Listing", ListingSchema);
