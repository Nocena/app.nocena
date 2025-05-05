import React, { ReactNode } from 'react';
import Image from 'next/image';

interface AuthenticationLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const AuthenticationLayout = ({ children, title, subtitle }: AuthenticationLayoutProps) => {
  return (
    <div className="bg-nocena-bg flex min-h-screen items-center justify-center text-white">
      <div className="mx-4 w-full max-w-md">
        <div className="flex w-full max-w-md flex-col items-center px-4">
          <div className="relative mx-auto mb-20 h-auto max-w-full">
            <Image src="/logo/eyes.png" alt="Nocena Logo" width={512} height={116} sizes="100vw" />
          </div>
          {title ? <h2 className="mb-2 text-center text-2xl font-bold">{title}</h2> : null}
          {subtitle ? <p className="mb-8 text-center text-gray-300">{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthenticationLayout;
