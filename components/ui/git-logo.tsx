import React from 'react';
import Image from 'next/image';

interface GITLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GITLogo({ className = "", size = 'md' }: GITLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src="/gitlogo.png"
        alt="GLAN INSTITUTE OF TECHNOLOGY Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
