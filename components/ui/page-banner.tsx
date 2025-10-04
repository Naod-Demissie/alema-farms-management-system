import React from 'react';
import { cn } from '@/lib/utils';

interface PageBannerProps {
  title: string;
  description: string;
  imageSrc: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageBanner({
  title,
  description,
  imageSrc,
  className,
  children,
}: PageBannerProps) {
  return (
    <div
      className={cn(
        "relative w-full h-32 md:h-40 rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageSrc})`,
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end items-start text-left px-6 pb-4">
        <div className="max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {title}
          </h1>
          <p className="text-sm md:text-base text-gray-200 drop-shadow-md">
            {description}
          </p>
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
    </div>
  );
}
