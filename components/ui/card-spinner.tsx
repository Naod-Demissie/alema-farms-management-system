import React from "react";

interface CardSpinnerProps {
  className?: string;
}

export function CardSpinner({ className = "h-16" }: CardSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
