
import { ControllerRenderProps, FieldError } from 'react-hook-form';
import { useRef } from 'react';
import { FormValues } from '../register/types';

interface Props {
  field: ControllerRenderProps<FormValues, "inviteCode" | "verificationCode">;
  loading?: boolean;
  onlyNumber?: boolean;
}

const NocenaCodeInputs = ({ field, loading, onlyNumber }: Props) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const redexReplace = onlyNumber ? /[^0-9]/g : /[^a-zA-Z0-9]/g;

  const handleFocusNextInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleChange = (value: string, index: number) => {
    const newValue = value.replace(redexReplace, '').toUpperCase();
    const newFieldValue = [
      ...field.value.slice(0, index),
      ...((index > -1 && newValue) ? [newValue] : ['']),
      ...field.value.slice(index + 1),
    ]
    field.onChange(newFieldValue)
    if (index < 5 && newValue) {
      setTimeout(() => {
        handleFocusNextInput(index + 1);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Navigate to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !field.value[index] && index > 0) {
      handleFocusNextInput(index - 1);
    }
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData('text')
      .replace(redexReplace, '')
      .toUpperCase();


    if (pastedText) {
      const characters = pastedText.split('').slice(0, 6);
      field.onChange(characters);
      handleFocusNextInput(5);
    }
  };

  return (
    <>
      {field.value.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          className={`w-12 h-12 m-1 text-2xl text-center bg-gray-800 border focus:outline-none focus:ring-2 focus:ring-opacity-50 rounded-lg
                        ${index < 3
              ? 'text-nocenaPink border-nocenaPink focus:ring-nocenaPink'
              : 'text-nocenaBlue border-nocenaBlue focus:ring-nocenaBlue'
            }
                        ${index === 2 ? 'mr-4' : ''}
                      `}
          disabled={loading}
        />
      ))}
    </>
  );
};

export default NocenaCodeInputs;
