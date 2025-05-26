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
      <div className="bg-white bg-opacity-10 rounded-2xl overflow-hidden mb-6 backdrop-blur-sm">
        <div className="border-b border-white border-opacity-20">
          <NocenaInput control={control} name="username" placeholder="Enter username" required />
        </div>
        <div className="border-b border-white border-opacity-20">
          <PhoneInput control={control} name="phoneNumber" placeholder="722 183 412" required />
        </div>
        <div>
          <PasswordInput control={control} name="password" placeholder="Enter password" />
        </div>
      </div>

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