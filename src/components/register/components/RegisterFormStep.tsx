import { useEffect, useState } from 'react';
import { Control, useWatch } from 'react-hook-form';
import { NocenaInput } from '@components/form';
import PrimaryButton from '../../ui/PrimaryButton';
import { FormValues } from '../types';
import { fetchAccountByUserName } from '@utils/lensUtils';

interface Props {
  control: Control<FormValues, any>;
  setStep: () => void;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const RegisterFormStep = ({ control, setStep }: Props) => {
  const [isExistingUsername, setIsExistingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const watchedUsername = useWatch({ control, name: 'username' });
  const debouncedUsername = useDebounce(watchedUsername, 300); // Wait 500ms after typing stops

  useEffect(() => {
    if (debouncedUsername) {
      (async () => {
        try {
          setIsLoading(true);
          const existingAccount = await fetchAccountByUserName(null, debouncedUsername);
          if (existingAccount) {
            setIsExistingUsername(true);
          } else {
            setIsExistingUsername(false);
          }
        } catch (e) {
          console.log('just LINT error');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [debouncedUsername]);

  return (
    <>
      <div className="bg-white bg-opacity-10 rounded-2xl overflow-hidden mb-6 backdrop-blur-sm">
        <div className="border-b border-white border-opacity-20">
          <NocenaInput control={control} name="username" placeholder="Enter username" required />
          {isExistingUsername ? (
            <p className="text-sm text-red-600 mt-2 ms-4">Sorry, that username is not available.</p>
          ) : null}
        </div>
        {/*
        <div className="border-b border-white border-opacity-20">
          <PhoneInput control={control} name="phoneNumber" placeholder="722 183 412" required />
        </div>
        <div>
          <PasswordInput control={control} name="password" placeholder="Enter password" />
        </div>
*/}
      </div>

      <div className="mb-3">
        <PrimaryButton
          text={isExistingUsername ? 'Username is in use' : isLoading ? 'Processing...' : 'Continue'}
          onClick={setStep}
          disabled={isLoading || isExistingUsername}
          className="w-full"
        />
      </div>
    </>
  );
};

export default RegisterFormStep;
