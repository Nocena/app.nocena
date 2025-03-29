// lib/utils/passwordUtils.ts

/**
 * Generates a secure salt for password hashing
 * @returns A random salt string
 */
export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Creates a SHA-256 hash of the password with the provided salt
 * @param password The plain text password
 * @param salt Optional salt - if not provided, a new one will be generated
 * @returns Promise resolving to the hashed password with salt (format: salt:hash)
 */
export const hashPassword = async (password: string, salt?: string): Promise<string> => {
  // Generate salt if not provided
  const useSalt = salt || generateSalt();

  // Combine password and salt
  const passwordWithSalt = password + useSalt;

  // Encode as UTF-8
  const msgBuffer = new TextEncoder().encode(passwordWithSalt);

  // Hash the password
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Return salt and hash combined (salt is needed for verification)
  return `${useSalt}:${hashHex}`;
};

/**
 * Verifies a password against a stored hash
 * @param password The plain text password to verify
 * @param storedHash The stored hash including salt
 * @returns Promise resolving to boolean indicating if password is valid
 */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  // Split hash to extract salt
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  // Hash the input password with the same salt
  const passwordHash = await hashPassword(password, salt);

  // Compare the generated hash with the stored hash
  return passwordHash === storedHash;
};
