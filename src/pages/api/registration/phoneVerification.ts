// pages/api/registration/phoneVerification.ts
import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { formatPhoneToE164 } from '../../../lib/utils/phoneUtils';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

// If environment variables are missing, log an error
if (!accountSid || !authToken || !verifySid) {
  console.error(
    'Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in .env.local',
  );
}

// Initialize client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Check if Twilio is properly configured
  if (!client || !verifySid) {
    console.error('Twilio not configured. Using fallback verification for development.');
    return handleDevFallback(req, res);
  }

  const { phoneNumber, action, code } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    // Ensure phone number is in E.164 format
    const formattedPhone = formatPhoneToE164(phoneNumber);

    if (action === 'SEND') {
      // Send verification code via Twilio Verify
      const verification = await client.verify.v2
        .services(verifySid)
        .verifications.create({ to: formattedPhone, channel: 'sms' });

      console.log(`Verification sent to ${formattedPhone}, status: ${verification.status}`);

      return res.status(200).json({
        success: true,
        message: 'Verification code sent',
        status: verification.status,
      });
    } else if (action === 'VERIFY') {
      if (!code) {
        return res.status(400).json({ success: false, message: 'Verification code is required' });
      }

      // Verify the code via Twilio Verify
      const verification = await client.verify.v2
        .services(verifySid)
        .verificationChecks.create({ to: formattedPhone, code });

      const isValid = verification.status === 'approved';

      if (isValid) {
        return res.status(200).json({
          success: true,
          message: 'Phone number verified successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
          status: verification.status,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
    }
  } catch (error: any) {
    console.error('Phone verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during phone verification',
      details: error.message,
    });
  }
}

/**
 * Development fallback for when Twilio is not configured
 * Always returns success and logs actions to console
 */
const handleDevFallback = (req: NextApiRequest, res: NextApiResponse) => {
  const { phoneNumber, action, code } = req.body;

  if (action === 'SEND') {
    console.log(`[DEV FALLBACK] Sending verification code to ${phoneNumber}`);
    // For development, always return a mock code
    const mockCode = '123456';
    console.log(`[DEV FALLBACK] Mock verification code: ${mockCode}`);

    return res.status(200).json({
      success: true,
      message: '[DEV FALLBACK] Verification code sent (mock)',
    });
  } else if (action === 'VERIFY') {
    console.log(`[DEV FALLBACK] Verifying code ${code} for ${phoneNumber}`);

    // In development mode, accept any 6-digit code
    const isValid = /^\d{6}$/.test(code || '');

    if (isValid) {
      return res.status(200).json({
        success: true,
        message: '[DEV FALLBACK] Phone number verified successfully (mock)',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '[DEV FALLBACK] Invalid verification code (mock)',
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid action',
  });
};
