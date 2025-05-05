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
          <label htmlFor={name} className="mb-1 block">
            {label}
          </label>
          <input
            {...field}
            type={type}
            id={name}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-gray-600 bg-gray-700 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
          {fieldState.error ? <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
};

export default NocenaInput;
