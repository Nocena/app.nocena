import React from 'react';
import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  useFormState,
  useWatch,
} from 'react-hook-form';
import PrimaryButton from '../../ui/PrimaryButton';
import NocenaCodeInputs from '../../form/NocenaCodeInput';
import { FormValues } from '../types';

interface Props {
  control: Control<FormValues, any>;
  customError?: string;
  loading?: boolean;
  onResend: () => void;
}

const INPUT_NAME = 'verificationCode';

const RegisterPhoneVerificationStep = ({ control, customError, loading, onResend }: Props) => {
  const verificationCode = useWatch({ control, name: INPUT_NAME });
  const { errors } = useFormState({ control, name: INPUT_NAME });
  const error = errors?.[INPUT_NAME]?.slice?.(-1)?.[0];

  return (
    <>
      <div className={`flex justify-center mb-6 ${error ? 'animate-shake' : ''}`}>
        <Controller
          name={INPUT_NAME}
          control={control}
          render={({
            field,
          }: {
            field: ControllerRenderProps<FormValues, 'verificationCode'>;
            fieldState: ControllerFieldState;
          }) => <NocenaCodeInputs field={field} onlyNumber />}
        />
      </div>

      {customError || error ? (
        <p className="text-red-500 text-sm mb-4 text-center">{customError || error?.message}</p>
      ) : null}

      <div className="mb-6">
        <PrimaryButton
          text={loading ? 'Verifying...' : 'Verify'}
          type="submit"
          disabled={verificationCode.some((c) => !c) || loading}
          className="w-full"
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-400 mb-3">Didn't receive the code?</p>
        <button onClick={onResend} className="text-nocenaBlue hover:text-white transition-colors">
          Resend verification code
        </button>
      </div>
    </>
  );
};

export default RegisterPhoneVerificationStep;
