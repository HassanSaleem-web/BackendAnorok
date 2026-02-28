const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Bid = require('../models/Bid');
const Listing = require('../models/Listing');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper to generate JWT
function generateToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

exports.signup = async ({ fullName, email, password, role }) => {
    if (!fullName || !email || !password) {
        const error = new Error('fullName, email and password are required');
        error.status = 400;
        throw error;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        const error = new Error('An account with this email already exists');
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        passwordHash,
    });

    const token = generateToken(user);

    return { user, token };
};

exports.login = async ({ email, password }) => {
    if (!email || !password) {
        const error = new Error('Email and password are required');
        error.status = 400;
        throw error;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }

    const token = generateToken(user);
    return { user, token };
};

exports.getUserById = async (id) => {
    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    // Compute public stats
    // 1. Investments: Number of "paid" bids placed by this user
    const paidPurchasesBids = await Bid.find({ userId: id, status: "paid" })
        .populate("listingId", "title price")
        .sort({ createdAt: -1 })
        .lean();

    const totalInvestments = paidPurchasesBids.length;
    let totalPortfolioValue = 0;

    // Recent portfolio items (up to 3)
    const recentPortfolio = [];

    paidPurchasesBids.forEach(b => {
        if (b.listingId) {
            totalPortfolioValue += (b.amount || b.listingId.price || 0);
            if (recentPortfolio.length < 3) {
                recentPortfolio.push({
                    title: b.listingId.title,
                    amount: b.amount,
                    year: new Date(b.createdAt).getFullYear(),
                    id: b.listingId._id
                });
            }
        }
    });

    user.stats = {
        totalInvestments,
        totalPortfolioValue,
        recentPortfolio
    };

    return user;
};

exports.updateProfile = async (id, updateData) => {
    // Prevent updating sensitive fields directly
    const allowedUpdates = ['fullName', 'bio', 'walletAddress', 'skills'];
    const updates = {};
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            updates[key] = updateData[key];
        }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }
    return user;
};

exports.deleteAccount = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    // GDPR Right to be Forgotten: Hard delete the user
    // Note: Financial logic might dictate that we only anonymize them instead,
    // but for now, we remove the raw PII record. Audit logs will still keep ID references.
    await User.findByIdAndDelete(userId);

    return true;
};
