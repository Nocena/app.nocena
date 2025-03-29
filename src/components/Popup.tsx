import React, { useEffect, useRef } from 'react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, title, children, fullScreen = false }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
      <div
        ref={popupRef}
        className={`
          bg-nocenaBg border border-nocenaBorder rounded-t-xl sm:rounded-xl
          shadow-xl text-white overflow-hidden
          animate-slide-up
          ${fullScreen ? 'w-full h-[90vh] sm:h-[80vh] sm:max-w-2xl sm:w-full' : 'w-full max-w-md sm:max-w-lg'}
        `}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center border-b border-nocenaBorder p-4">
          {title && <h2 className="text-lg font-medium">{title}</h2>}

          {/* Close button - positioned absolute to keep title centered */}
          <button
            onClick={onClose}
            className="absolute right-4 rounded-full w-8 h-8 flex items-center justify-center 
                      hover:bg-nocenaBorder/20 transition-colors"
            aria-label="Close popup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className={`
          overflow-hidden h-full
          ${fullScreen ? 'h-[calc(90vh-4rem)] sm:h-[calc(80vh-4rem)]' : ''}
        `}
        >
          {children}
        </div>

        {/* Visual indicator for swipe down to close */}
        <div className="hidden absolute top-0 left-0 right-0 h-1 bg-gray-600 sm:hidden">
          <div className="mx-auto w-16 h-1 bg-gray-400 rounded-full mt-1"></div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
