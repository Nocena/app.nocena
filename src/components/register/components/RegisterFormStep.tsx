import { useState } from 'react';
import { Control } from 'react-hook-form';
import { NocenaInput, PasswordInput, PhoneInput } from '@components/form';
import { verifyPhoneNumber } from '../../../lib/utils/verification';
import PrimaryButton from '../../ui/PrimaryButton';
import { formatPhoneToE164 } from '../../../lib/utils/phoneUtils';
import { FormValues } from '../types';

interface Props {
  control: Control<FormValues, any>;
  loading?: boolean;
  setStep: () => void;
}

const RegisterFormStep = ({ control, loading, setStep }: Props) => {
  return (
    <>
      <NocenaInput control={control} name="username" label="Username" placeholder="Enter username" required />

      <PhoneInput control={control} name="phoneNumber" label="Phone Number" placeholder="Search" required />
      <PasswordInput control={control} name="password" label="Password" placeholder="Enter password" />

      <div className="mb-3">
        <PrimaryButton
          text={loading ? 'Processing...' : 'Continue'}
          onClick={setStep}
          disabled={loading}
          className="w-full"
        />
      </div>
    </>
  );
};

export default RegisterFormStep;
