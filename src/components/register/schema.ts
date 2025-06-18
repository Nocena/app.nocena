import * as yup from 'yup';
import { sanitizeInput } from '../../lib/utils/security';

export const schema = yup.object().shape({
  username: yup
    .string()
    .transform((value) => sanitizeInput(value))
    .required('Username is required'),
  // phoneNumber: yup
  //   .string()
  //   .transform((value) => sanitizeInput(value))
  //   .required('Phone number is required'),
  // password: yup
  //   .string()
  //   .transform((value) => sanitizeInput(value))
  //   .min(6, 'Password must be at least 6 characters')
  //   .required('Password is required'),
  inviteCode: yup
    .array()
    .of(yup.string().length(1, 'Please enter your invite code').required('Please enter your invite code'))
    .required('Please enter your invite code'),
  // verificationCode: yup
  //   .array()
  //   .of(
  //     yup
  //       .string()
  //       .length(1, 'Please enter all 6 digits of the verification code')
  //       .required('Please enter all 6 digits of the verification code'),
  //   )
  //   .required('Please enter all 6 digits of the verification code'),
});
