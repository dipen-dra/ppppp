// models/User.js
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: "normal" // 'normal' or 'admin'
        },
        phone: {
            type: String,
            default: ""
        },
        address: {
            type: String,
            default: ""
        },
        profilePicture: {
            type: String,
            default: ""
        },
        loyaltyPoints: {
            type: Number,
            default: 0
        },
        passwordHistory: {
            type: [String],
            default: []
        },
        lastPasswordChange: {
            type: Date,
            default: Date.now
        },

        // ── Brute-force / account lockout ─────────────────────────────────────
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date,
            default: null
        },

        // ── Email OTP 2FA ──────────────────────────────────────────────────────
        emailOTP: {
            type: String,       // bcrypt hash of the 6-digit OTP
            default: null
        },
        emailOTPExpiry: {
            type: Date,
            default: null
        },

        // ── TOTP 2FA (Google Authenticator) ───────────────────────────────────
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        twoFactorSecret: {
            type: String,       // encrypted speakeasy secret (base32)
            default: null
        },
        twoFactorTempSecret: {
            type: String,       // temp secret before user verifies setup
            default: null
        }
    },
    { timestamps: true }
);

// ── Virtual: is the account currently locked? ─────────────────────────────────
UserSchema.virtual('isLocked').get(function () {
    return this.lockUntil && this.lockUntil > Date.now();
});

module.exports = mongoose.model("User", UserSchema);