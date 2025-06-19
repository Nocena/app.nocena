import { Control, useWatch } from 'react-hook-form';
import { NocenaInput, PasswordInput } from '@components/form';
import PrimaryButton from '../../ui/PrimaryButton';
import { FormValues } from '../types';

interface Props {
  control: Control<FormValues, any>;
  loading?: boolean;
  setStep: () => void;
}

const RegisterFormStep = ({ control, loading, setStep }: Props) => {
  // Watch required fields (removed phoneNumber)
  const username = useWatch({
    control,
    name: 'username',
    defaultValue: ''
  });

  const password = useWatch({
    control,
    name: 'password',
    defaultValue: ''
  });

  // Check if all required fields are valid (removed phoneNumber validation)
  const isFormValid = username && username.trim().length >= 3 && 
                     password && password.length >= 6; // Assuming minimum password length

  return (
    <>
      <div className="bg-white bg-opacity-10 rounded-[2rem] overflow-hidden mb-6 backdrop-blur-sm">
        <div className="border-b border-white border-opacity-20">
          <NocenaInput control={control} name="username" placeholder="Enter username" required />
        </div>
        <div>
          <PasswordInput control={control} name="password" placeholder="Enter password" />
        </div>
      </div>

      <div className="text-center font-light text-xs">
        <p>
          Firstly choose the name by which you want to be known
        </p>
      </div>

      <div className="mb-3">
        <PrimaryButton
          text={loading ? 'Processing...' : 'Continue'}
          onClick={setStep}
          disabled={loading || !isFormValid}
          className="w-full"
        />
      </div>
    </>
  );
};

export default RegisterFormStep;