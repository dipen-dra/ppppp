// utils/captchaHelper.js
const crypto = require('crypto');

/**
 * Generate a random 5-character string of uppercase letters and digits.
 * Excludes confusing characters: O, 0, I, 1, L, 5, S, 2, Z
 */
function generateRandomText(length = 5) {
    const chars = 'ABCDEFGHJKMNPQRTUVWXY346789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Encrypt/sign the captcha text and expiration timestamp.
 * Returns a token in format: expiry.hash
 */
function generateCaptchaToken(text, expiryMinutes = 5) {
    const expiry = Date.now() + expiryMinutes * 60 * 1000;
    const secret = process.env.SECRET || 'motofix-captcha-fallback-secret-key';
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${text.toLowerCase()}.${expiry}`);
    const hash = hmac.digest('hex');
    
    return `${expiry}.${hash}`;
}

/**
 * Validate the captcha input text against the captcha token.
 * Returns true if valid, false otherwise.
 */
function validateCaptcha(inputText, captchaToken) {
    if (!inputText || !captchaToken) return false;
    
    const parts = captchaToken.split('.');
    if (parts.length !== 2) return false;
    
    const [expiry, hash] = parts;
    
    // Check expiration
    if (Date.now() > Number(expiry)) {
        return false;
    }
    
    const secret = process.env.SECRET || 'motofix-captcha-fallback-secret-key';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${inputText.trim().toLowerCase()}.${expiry}`);
    const expectedHash = hmac.digest('hex');
    
    // timingSafeEqual requires equal length buffers
    if (hash.length !== expectedHash.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

/**
 * Render the text into an SVG string with noise lines and randomized characters.
 */
function generateCaptchaSvg(text) {
    const width = 140;
    const height = 48;
    
    // Noise lines
    let noiseLines = '';
    for (let i = 0; i < 4; i++) {
        const x1 = Math.floor(Math.random() * width);
        const y1 = Math.floor(Math.random() * height);
        const x2 = Math.floor(Math.random() * width);
        const y2 = Math.floor(Math.random() * height);
        const colors = ['#cbd5e0', '#a0aec0', '#e2e8f0', '#718096'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" />`;
    }
    
    // Text rendering with random offset, scale, rotation
    let textElements = '';
    const charSpacing = width / (text.length + 1);
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const x = charSpacing * (i + 0.8) + (Math.random() * 4 - 2);
        const y = 33 + (Math.random() * 6 - 3);
        const rotate = Math.floor(Math.random() * 24) - 12; // rotate -12 to 12 degrees
        const size = 25 + Math.floor(Math.random() * 5); // size 25 to 29px
        const colors = ['#1a202c', '#2d3748', '#4a5568', '#1a365d', '#2c5282'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        textElements += `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="900" fill="${color}" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
    }
    
    // Complete SVG string
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#edf2f7" rx="8" />
        ${noiseLines}
        ${textElements}
    </svg>`;
    
    return svg;
}

module.exports = {
    generateRandomText,
    generateCaptchaToken,
    validateCaptcha,
    generateCaptchaSvg
};
