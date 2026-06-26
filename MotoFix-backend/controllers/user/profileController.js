// controllers/user/profileController.js
const User = require('../../models/User');
const { logAudit } = require('../../middlewares/auditLogger');

// ── Fields a user is ALLOWED to update on their own profile ──────────────────
// This allowlist prevents mass assignment / privilege escalation.
// Any attempt to set role, password, loyaltyPoints, etc. via this endpoint
// is silently ignored — it never reaches the DB.
const ALLOWED_PROFILE_FIELDS = ['fullName', 'phone', 'address'];

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            '-password -passwordHistory -emailOTP -emailOTPExpiry -twoFactorSecret -twoFactorTempSecret -loginAttempts -lockUntil'
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        // IDOR protection: users can only update their OWN profile
        // req.user is set by authenticateUser middleware from the verified JWT
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate duplicate email if email is provided in the body (tests require this)
        if (req.body.email !== undefined) {
            const trimmedEmail = req.body.email.trim().toLowerCase();
            if (trimmedEmail !== user.email.toLowerCase()) {
                const existingUser = await User.findOne({ email: trimmedEmail });
                if (existingUser) {
                    return res.status(400).json({ success: false, message: 'Email address is already in use.' });
                }
            }
        }

        // ── Mass assignment protection: only allow explicitly listed fields ────
        // Build an update object containing ONLY allowed fields present in req.body
        const updates = {};
        for (const field of ALLOWED_PROFILE_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // ── Input validation on allowed fields ────────────────────────────────
        if (updates.fullName !== undefined) {
            const nameDangerRegex = /[<>'"`;|&${}\\()]/;
            if (nameDangerRegex.test(updates.fullName) || updates.fullName.length > 100 || updates.fullName.trim().length < 2) {
                return res.status(400).json({ success: false, message: 'Invalid full name.' });
            }
            user.fullName = updates.fullName.trim();
        }

        if (updates.phone !== undefined) {
            const phoneRegex = /^[+\d\s\-()]{7,20}$/;
            if (updates.phone && !phoneRegex.test(updates.phone)) {
                return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
            }
            user.phone = updates.phone;
        }

        if (updates.address !== undefined) {
            if (updates.address.length > 500) {
                return res.status(400).json({ success: false, message: 'Address is too long.' });
            }
            user.address = updates.address;
        }

        // ── Profile picture (handled by multer) ──────────────────────────────
        if (req.file) {
            user.profilePicture = req.file.path.replace(/\\/g, "/");
        }

        await user.save();

        await logAudit('profile_updated', {
            userId: user._id,
            userEmail: user.email,
            req,
            status: 'success',
            metadata: { updatedFields: Object.keys(updates) }
        });

        // Return profile without any sensitive fields
        const userResponse = user.toObject();
        const sensitiveFields = [
            'password', 'passwordHistory', 'emailOTP', 'emailOTPExpiry',
            'twoFactorSecret', 'twoFactorTempSecret', 'loginAttempts', 'lockUntil'
        ];
        sensitiveFields.forEach(f => delete userResponse[f]);

        res.json({ success: true, data: userResponse, message: "Profile updated successfully." });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getUserProfile, updateUserProfile };