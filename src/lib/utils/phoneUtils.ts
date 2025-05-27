// lib/utils/phoneUtils.ts

/**
 * Formats a phone number to E.164 format
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number in E.164 format (+12345678900)
 */
export const formatPhoneToE164 = (phoneNumber: string): string => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }

  console.log('Original phone number:', phoneNumber);

  // Remove all non-numeric characters except the leading +
  let result = phoneNumber.trim();

  // If it starts with +, keep it and extract only digits after the +
  if (result.startsWith('+')) {
    const digits = result.substring(1).replace(/\D/g, '');
    result = '+' + digits;
  } else {
    // Remove all non-numeric characters
    const digits = result.replace(/\D/g, '');

    // If the number doesn't have a country code (assuming US/Canada as default)
    if (digits.length === 10) {
      result = '+1' + digits; // Add US/Canada country code
    } else {
      result = '+' + digits;
    }
  }

  console.log('Formatted phone number:', result);

  // Basic validation - E.164 should be 7-15 digits after the +
  const digitsOnly = result.substring(1);
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw new Error(`Invalid phone number format: ${phoneNumber} -> ${result}`);
  }

  return result;
};

/**
 * Formats a phone number for display
 * @param phoneNumber The E.164 formatted phone number
 * @returns Formatted phone number for display (e.g., +1 (234) 567-8900)
 */
export const formatPhoneForDisplay = (phoneNumber: string): string => {
  // Basic formatting for US numbers
  if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
    const match = phoneNumber.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }

  // Return the original number if it doesn't match the pattern
  return phoneNumber;
};
