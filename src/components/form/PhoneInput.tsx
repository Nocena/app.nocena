import { useState, useEffect } from 'react';
import { Controller, Control } from 'react-hook-form';

interface Props {
  control: Control<any>;
  name: string;
  required?: boolean;
  placeholder?: string;
}

const PhoneInput = ({ control, name, placeholder, required }: Props) => {
  const [defaultCountry, setDefaultCountry] = useState('us');
  const [isDetecting, setIsDetecting] = useState(true);

  // Auto-detect country using IP geolocation
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.country_code) {
          setDefaultCountry(data.country_code.toLowerCase());
        }
      } catch (error) {
        console.log('Could not auto-detect country, using default US');
        // Try timezone fallback
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (timezone.includes('Europe/Prague')) {
            setDefaultCountry('cz');
          } else if (timezone.includes('Europe/London')) {
            setDefaultCountry('gb');
          } else if (timezone.includes('Europe/Paris')) {
            setDefaultCountry('fr');
          } else if (timezone.includes('Europe/Berlin')) {
            setDefaultCountry('de');
          }
        } catch (timezoneError) {
          console.log('Timezone detection also failed');
        }
      } finally {
        setIsDetecting(false);
      }
    };

    detectCountry();
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: true }}
      render={({ field, fieldState }) => (
        <div className="relative">
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>

          {isDetecting ? (
            <div className="w-full pl-20 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors flex items-center">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-gray-400">Detecting region...</span>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-20 top-1/2 transform -translate-y-1/2 text-white text-sm font-medium">
                {defaultCountry === 'cz' && '+420'}
                {defaultCountry === 'us' && '+1'}
                {defaultCountry === 'gb' && '+44'}
                {defaultCountry === 'fr' && '+33'}
                {defaultCountry === 'de' && '+49'}
                {!['cz', 'us', 'gb', 'fr', 'de'].includes(defaultCountry) && '+1'}
              </span>
              <input
                {...field}
                type="tel"
                placeholder={placeholder || '555 123 4567'}
                className="w-full pl-32 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors"
                value={(() => {
                  if (!field.value) return '';

                  // Get the country code for current country
                  const countryCode =
                    defaultCountry === 'cz'
                      ? '+420'
                      : defaultCountry === 'us'
                        ? '+1'
                        : defaultCountry === 'gb'
                          ? '+44'
                          : defaultCountry === 'fr'
                            ? '+33'
                            : defaultCountry === 'de'
                              ? '+49'
                              : '+1';

                  // Remove the country code from the display value
                  if (field.value.startsWith(countryCode)) {
                    return field.value.substring(countryCode.length);
                  }

                  // Fallback: remove any country code pattern
                  return field.value.replace(/^\+\d{1,4}/, '');
                })()}
                onChange={(e) => {
                  // Only keep digits
                  const digitsOnly = e.target.value.replace(/\D/g, '');

                  // Get the country code based on detected country
                  const countryCode =
                    defaultCountry === 'cz'
                      ? '+420'
                      : defaultCountry === 'us'
                        ? '+1'
                        : defaultCountry === 'gb'
                          ? '+44'
                          : defaultCountry === 'fr'
                            ? '+33'
                            : defaultCountry === 'de'
                              ? '+49'
                              : '+1';

                  // Combine country code with digits
                  const fullPhoneNumber = countryCode + digitsOnly;

                  console.log('Phone input onChange:', {
                    inputValue: e.target.value,
                    digitsOnly,
                    countryCode,
                    fullPhoneNumber,
                  });

                  field.onChange(fullPhoneNumber);
                }}
              />
            </div>
          )}

          {fieldState.error && <p className="text-sm text-red-600 mt-2 px-4 pb-2">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
};

export default PhoneInput;
