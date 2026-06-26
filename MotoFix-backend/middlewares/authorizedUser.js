// middlewares/authorizedUser.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isRevoked } = require("./tokenBlacklist");

exports.authenticateUser = async (req, res, next) => {
    // 1. Dual-Token System: HttpOnly cookie first, fallback to Bearer header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: No token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);

        // 2. Token revocation check — reject blacklisted tokens (logged-out sessions)
        if (decoded.jti && isRevoked(decoded.jti)) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Session has been invalidated. Please log in again."
            });
        }

        // 3. Verify user still exists in DB (protects against deleted accounts)
        const user = await User.findById(decoded._id).select("-password -emailOTP -twoFactorSecret -twoFactorTempSecret");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: User no longer exists."
            });
        }

        // 4. Account lockout check — even on authenticated requests
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: "Account is temporarily locked due to multiple failed login attempts. Please try again later."
            });
        }

        req.user = user;
        req.tokenJti = decoded.jti;
        req.tokenExp = decoded.exp;
        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            message: `Authentication failed: ${err.message}. Please log in again.`
        });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin privileges required."
        });
    }
};

exports.isSuperAdmin = (req, res, next) => {
    if (req.user?.role === 'superadmin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied: Superadmin privileges required."
        });
    }
};