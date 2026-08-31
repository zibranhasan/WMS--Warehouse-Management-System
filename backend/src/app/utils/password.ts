import crypto from "crypto";

/**
 * Generates a cryptographically secure random temporary password.
 * Uses Node.js built-in `crypto.randomInt`.
 * Guaranteed to satisfy password requirements (uppercase, lowercase, number, symbol, min length).
 */
export const generateTemporaryPassword = (length = 12): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=";
    const allChars = uppercase + lowercase + numbers + symbols;

    // Ensure at least one character from each set
    const passwordArray = [
        uppercase[crypto.randomInt(0, uppercase.length)],
        lowercase[crypto.randomInt(0, lowercase.length)],
        numbers[crypto.randomInt(0, numbers.length)],
        symbols[crypto.randomInt(0, symbols.length)],
    ];

    for (let i = passwordArray.length; i < length; i++) {
        passwordArray.push(allChars[crypto.randomInt(0, allChars.length)]);
    }

    // Fisher-Yates shuffle using crypto.randomInt
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join("");
};
