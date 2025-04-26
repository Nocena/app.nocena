import { useState } from 'react';
import { Control, Controller } from 'react-hook-form';

export interface NocenaInputProps {
  control: Control<any>;
  label: string;
  name: string;
  placeholder?: string;
}

const PasswordInput = ({ control, label, name, placeholder }: NocenaInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="mb-3">
          <label htmlFor={name} className="block mb-1">
            {label}
          </label>
          <div className="relative">
            <input
              id="hs-toggle-password"
              {...field}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
              className="w-full block px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 end-0 flex items-center z-20 px-3 cursor-pointer text-white rounded-e-md focus:outline-hidden focus:text-nocena-blue"
            >
              <svg
                className="shrink-0 size-3.5"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path className={showPassword ? 'hidden' : 'block'} d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                <path
                  className={showPassword ? 'hidden' : 'block'}
                  d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                ></path>
                <path
                  className={showPassword ? 'hidden' : 'block'}
                  d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
                ></path>
                <line className={showPassword ? 'hidden' : 'block'} x1="2" x2="22" y1="2" y2="22"></line>
                <path
                  className={showPassword ? 'block' : 'hidden'}
                  d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                ></path>
                <circle className={showPassword ? 'block' : 'hidden'} cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          {fieldState.error ? <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
};

export default PasswordInput;
