// lib/utils/verification.ts
import { formatPhoneToE164 } from './phoneUtils';

type VerificationAction = 'SEND' | 'VERIFY';

/**
 * Sends a verification code to a phone number or verifies a code using Twilio
 *
 * @param phoneNumber The phone number to verify
 * @param action Whether to send a code or verify a code
 * @param code The verification code (only needed for VERIFY action)
 * @returns Promise<boolean> indicating success or failure
 */
export const verifyPhoneNumber = async (
  phoneNumber: string,
  action: VerificationAction,
  code?: string,
): Promise<boolean> => {
  try {
    // Ensure phone number is in E.164 format
    const formattedPhone = formatPhoneToE164(phoneNumber);

    const response = await fetch('/api/registration/phoneVerification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        action,
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Phone verification error:', data.message);
      return false;
    }

    return data.success;
  } catch (error) {
    console.error('Phone verification error:', error);
    return false;
  }
};
