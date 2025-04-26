import { Control, Controller } from 'react-hook-form';

export interface NocenaInputProps {
  control: Control<any>;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: HTMLInputElement['type'];
}

const NocenaInput = ({ control, label, name, placeholder, required, type = 'text' }: NocenaInputProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'Toto pole je povinné' : undefined }}
      render={({ field, fieldState }) => (
        <div className="mb-3">
          <label htmlFor={name} className="block mb-1">
            {label}
          </label>
          <input
            {...field}
            type={type}
            id={name}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {fieldState.error ? <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
};

export default NocenaInput;
