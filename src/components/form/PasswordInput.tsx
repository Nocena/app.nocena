import { useState } from 'react';
import { Control, Controller } from 'react-hook-form';

export interface NocenaInputProps {
  control: Control<any>;
  name: string;
  placeholder?: string;
}

const PasswordInput = ({ control, name, placeholder }: NocenaInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-nocenaPink focus:outline-none focus:text-nocenaPink transition-colors cursor-pointer z-10"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <input
              id={name}
              {...field}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
              className="w-full pl-20 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors"
            />
          </div>
          {fieldState.error ? <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
};

export default PasswordInput;
