// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null   // null for anonymous / pre-auth events
        },
        userEmail: {
            type: String,
            default: null
        },
        action: {
            type: String,
            required: true,
            enum: [
                "login_success",
                "login_failed",
                "login_otp_sent",
                "login_otp_verified",
                "login_otp_failed",
                "account_locked",
                "account_unlocked",
                "logout",
                "register",
                "password_changed",
                "password_reset_requested",
                "password_reset_completed",
                "profile_updated",
                "profile_picture_updated",
                "2fa_setup_initiated",
                "2fa_enabled",
                "2fa_disabled",
                "2fa_verify_failed",
                "data_exported",
                "booking_created",
                "booking_updated",
                "booking_deleted",
                "admin_user_deleted",
                "admin_service_created",
                "admin_service_updated",
                "admin_service_deleted",
                "suspicious_activity"
            ]
        },
        ip: {
            type: String,
            default: null
        },
        userAgent: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ["success", "failure", "warning"],
            default: "success"
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

// TTL index: auto-delete audit logs older than 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
// Fast lookup by user
AuditLogSchema.index({ userId: 1, createdAt: -1 });
// Fast lookup by action
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
