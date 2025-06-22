import { ControllerRenderProps } from 'react-hook-form';
import { useRef, useState } from 'react';
import ThematicContainer from '../ui/ThematicContainer';
import { FormValues } from '../register/types';

interface Props {
  field: ControllerRenderProps<FormValues, 'inviteCode'> | ControllerRenderProps<any, 'verificationCode'>;
  loading?: boolean;
  onlyNumber?: boolean;
  onValidateInvite?: (code: string) => Promise<void>;
  validationError?: string;
}

const NocenaCodeInputs = ({ field, loading, onlyNumber, onValidateInvite, validationError }: Props) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const redexReplace = onlyNumber ? /[^0-9]/g : /[^a-zA-Z0-9]/g;

  const handleFocusNextInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleChange = async (value: string, index: number) => {
    const newValue = value.replace(redexReplace, '').toUpperCase();
    const newFieldValue = [
      ...field.value.slice(0, index),
      ...(index > -1 && newValue ? [newValue] : ['']),
      ...field.value.slice(index + 1),
    ];
    field.onChange(newFieldValue);

    if (index < 5 && newValue) {
      setTimeout(() => {
        handleFocusNextInput(index + 1);
      }, 0);
    }

    // Auto-validate when all 6 characters are entered (for invite codes only)
    if (!onlyNumber && newFieldValue.every((char) => char !== '') && onValidateInvite) {
      const fullCode = newFieldValue.join('');
      if (fullCode.length === 6) {
        setIsValidating(true);
        try {
          await onValidateInvite(fullCode);
        } catch (error) {
          // Error handling is done in parent component
        } finally {
          setIsValidating(false);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Navigate to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !field.value[index] && index > 0) {
      handleFocusNextInput(index - 1);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(redexReplace, '').toUpperCase();

    if (pastedText) {
      const characters = pastedText.split('').slice(0, 6);
      field.onChange(characters);
      handleFocusNextInput(5);

      // Auto-validate pasted invite code
      if (!onlyNumber && characters.length === 6 && onValidateInvite) {
        const fullCode = characters.join('');
        setIsValidating(true);
        try {
          await onValidateInvite(fullCode);
        } catch (error) {
          // Error handling is done in parent component
        } finally {
          setIsValidating(false);
        }
      }
    }
  };

  const getInputColor = (index: number, isFilled: boolean) => {
    // Show error state if there's a validation error
    if (validationError && !onlyNumber) {
      return 'nocenaPink';
    }

    if (!isFilled) return 'nocenaBlue';
    if (index < 3) return 'nocenaPurple';
    return 'nocenaPink';
  };

  const isCurrentlyLoading = loading || isValidating;

  // Ensure field.value is treated as string array
  const fieldValue: string[] = Array.isArray(field.value) ? field.value : [];

  return (
    <div className="relative">
      {/* Code Input Grid */}
      <div className="flex justify-center items-center">
        {fieldValue.map((value: string, index: number) => (
          <ThematicContainer
            key={index}
            asButton={false}
            color={getInputColor(index, !!value)}
            className={`w-10 h-14 m-1 ${index === 2 ? 'mr-4' : ''} !rounded-xl ${
              validationError && !onlyNumber ? 'border-red-500 border-2' : ''
            }`}
          >
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-full h-full text-2xl text-center bg-transparent border-0 focus:outline-none text-white"
              disabled={isCurrentlyLoading}
            />
          </ThematicContainer>
        ))}
      </div>
    </div>
  );
};

export default NocenaCodeInputs;
