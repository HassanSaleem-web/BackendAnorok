const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      }
,      

    isOpen: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", ListingSchema);
