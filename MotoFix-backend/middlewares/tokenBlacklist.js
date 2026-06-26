// middlewares/tokenBlacklist.js
/**
 * In-memory JWT revocation list.
 *
 * On logout, the token's `jti` (JWT ID) is added here.
 * authenticateUser checks this list before accepting a token.
 *
 * Uses a Map<jti, expiryTimestamp> so expired entries are pruned
 * automatically — prevents unbounded memory growth.
 */

const blacklist = new Map(); // jti → expiry Unix timestamp (ms)

const pruneInterval = setInterval(() => {
    const now = Date.now();
    for (const [jti, expiry] of blacklist.entries()) {
        if (expiry < now) blacklist.delete(jti);
    }
}, 30 * 60 * 1000);

if (pruneInterval.unref) {
    pruneInterval.unref();
}

/**
 * Add a token to the revocation list.
 * @param {string} jti      - JWT ID claim
 * @param {number} expInSec - Token exp (Unix seconds from JWT payload)
 */
const revokeToken = (jti, expInSec) => {
    if (!jti) return;
    const expiryMs = expInSec * 1000; // convert to milliseconds
    blacklist.set(jti, expiryMs);
};

/**
 * Check if a token has been revoked.
 * @param {string} jti
 * @returns {boolean}
 */
const isRevoked = (jti) => {
    if (!jti) return false;
    const expiry = blacklist.get(jti);
    if (!expiry) return false;
    // If the blacklist entry itself has expired, the token is no longer valid anyway
    if (expiry < Date.now()) {
        blacklist.delete(jti);
        return false;
    }
    return true;
};

module.exports = { revokeToken, isRevoked };
