// lib/utils/phoneUtils.ts

/**
 * Formats a phone number to E.164 format
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number in E.164 format (+12345678900)
 */
export const formatPhoneToE164 = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  let digits = phoneNumber.replace(/\D/g, '');
  
  // Ensure the number has a + prefix
  if (!phoneNumber.startsWith('+')) {
    // If the number doesn't have a country code (assuming US/Canada as default)
    if (digits.length === 10) {
      digits = '1' + digits; // Add US/Canada country code
    }
    return '+' + digits;
  }
  
  return phoneNumber;
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