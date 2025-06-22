import { Control, Controller } from 'react-hook-form';

export interface NocenaInputProps {
  control: Control<any>;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: HTMLInputElement['type'];
  disabled?: boolean;
}

const NocenaInput = ({ control, name, placeholder, required, type = 'text', disabled = false }: NocenaInputProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'Toto pole je povinné' : undefined }}
      render={({ field, fieldState }) => (
        <div className="relative">
          <div
            className={`absolute left-8 top-1/2 transform -translate-y-1/2 ${
              disabled ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <input
            {...field}
            type={type}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full pl-20 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none transition-colors ${
              disabled ? 'cursor-not-allowed opacity-60 text-gray-300' : 'focus:bg-gray-700/50 hover:bg-gray-800/30'
            }`}
          />
          {fieldState.error ? <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
};

export default NocenaInput;
