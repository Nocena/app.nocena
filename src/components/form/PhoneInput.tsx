import ReactPhoneInput from 'react-phone-input-2';
import { Controller, Control } from 'react-hook-form';
import 'react-phone-input-2/lib/style.css';

interface Props {
  control: Control<any>;
  name: string;
  required?: boolean;
  label: string;
  placeholder?: string;
}

const PhoneInput = ({ control, name, label, placeholder, required, ...rest }: Props) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: true }}
      render={({ field: { ref, ...field }, fieldState }) => (
        <div className="mb-3">
          <label htmlFor={name} className="block mb-1">
            {label}
          </label>
          <ReactPhoneInput
            country={'us'}
            enableSearch={true}
            searchPlaceholder={placeholder}
            {...field}
            {...rest}
            inputProps={{
              name: name,
              required: required,
            }}
            inputStyle={{
              width: '100%',
              backgroundColor: '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '1rem',
              height: '42px',
              padding: '0.5rem 1rem 0.5rem 3.5rem',
            }}
            buttonStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '1rem 0 0 1rem',
            }}
            dropdownStyle={{
              backgroundColor: '#111827',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              margin: '0.25rem 0',
              maxHeight: '300px',
            }}
            searchStyle={{
              backgroundColor: '#1f2937',
              color: 'white',
              width: '100%',
              margin: '0',
              border: 'none',
              borderBottom: '1px solid #374151',
              borderRadius: '0',
            }}
            containerClass="w-full"
            dropdownClass="bg-gray-900! text-white!"
            searchClass="bg-gray-800! text-white! border-gray-700!"
            containerStyle={{
              width: '100%',
            }}
          />
          {fieldState.error ? <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p> : null}
        </div>
      )}
    />
  );
};

export default PhoneInput;
