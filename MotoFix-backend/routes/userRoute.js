// routes/userRoute.js
const express = require("express");
const router  = express.Router();
const {
    registerUser,
    loginUser,
    verifyOTP,
    logoutUser,
    sendResetLink,
    resetPassword,
    getCaptcha
} = require("../controllers/userController");

// ── Public Auth Routes ────────────────────────────────────────────────────────
router.get("/captcha",      getCaptcha);
router.post("/register",    registerUser);
router.post("/login",       loginUser);

// Step 2 of login: OTP verification → issues full JWT
router.post("/verify-otp",  verifyOTP);

// Logout (revokes token)
router.post("/logout",      logoutUser);

// Password reset flow
router.post("/forgot-password",         sendResetLink);
router.post("/reset-password/:token",   resetPassword);

module.exports = router;
