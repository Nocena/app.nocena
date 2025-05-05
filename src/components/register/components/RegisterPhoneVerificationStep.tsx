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
      <div className={`mb-6 flex justify-center ${error ? 'animate-shake' : ''}`}>
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
        <p className="mb-4 text-center text-sm text-red-500">{customError || error?.message}</p>
      ) : null}

      <div className="mb-6">
        <PrimaryButton
          text={loading ? 'Verifying...' : 'Verify'}
          type="submit"
          disabled={verificationCode.some((c) => !c) || loading}
        />
      </div>

      <div className="mt-4 text-center">
        <p className="mb-3 text-gray-400">Didn't receive the code?</p>
        <button onClick={onResend} className="text-nocena-blue transition-colors hover:text-white">
          Resend verification code
        </button>
      </div>
    </>
  );
};

export default RegisterPhoneVerificationStep;
