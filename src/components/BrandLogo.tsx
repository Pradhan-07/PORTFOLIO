import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 20, className = '' }) => {
  return (
    <svg
      viewBox="0 0 96 80"
      width={size * (96 / 80)}
      height={size}
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Letter 'K': Left faceted polygon stem and sharp angular branches */}
      <path d="M0 12L12 0H18V32L36 12H52L30 38L54 80H36L20 50V80H0L0 12Z" />
      {/* Letter 'P': Right faceted polygon stem with precision geometric loop */}
      <path d="M58 0H86L96 12V36L86 48H74V80H58V0ZM74 14V34H84L88 30V18L84 14H74Z" />
    </svg>
  );
};
