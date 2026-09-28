import React from 'react';

export function FlagUS({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <g fillRule="evenodd">
        <path fill="#bd3d44" d="M0 0h640v480H0z" />
        <path
          stroke="#fff"
          strokeWidth="37"
          d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640"
        />
        <path fill="#192f5d" d="M0 0h280v259H0z" />
        {/* Stars array for crisp flag aesthetic */}
        <g fill="#fff">
          <circle cx="35" cy="30" r="7" />
          <circle cx="85" cy="30" r="7" />
          <circle cx="135" cy="30" r="7" />
          <circle cx="185" cy="30" r="7" />
          <circle cx="235" cy="30" r="7" />
          <circle cx="60" cy="65" r="7" />
          <circle cx="110" cy="65" r="7" />
          <circle cx="160" cy="65" r="7" />
          <circle cx="210" cy="65" r="7" />
          <circle cx="35" cy="100" r="7" />
          <circle cx="85" cy="100" r="7" />
          <circle cx="135" cy="100" r="7" />
          <circle cx="185" cy="100" r="7" />
          <circle cx="235" cy="100" r="7" />
          <circle cx="60" cy="135" r="7" />
          <circle cx="110" cy="135" r="7" />
          <circle cx="160" cy="135" r="7" />
          <circle cx="210" cy="135" r="7" />
          <circle cx="35" cy="170" r="7" />
          <circle cx="85" cy="170" r="7" />
          <circle cx="135" cy="170" r="7" />
          <circle cx="185" cy="170" r="7" />
          <circle cx="235" cy="170" r="7" />
          <circle cx="60" cy="205" r="7" />
          <circle cx="110" cy="205" r="7" />
          <circle cx="160" cy="205" r="7" />
          <circle cx="210" cy="205" r="7" />
        </g>
      </g>
    </svg>
  );
}

export function FlagES({ className = 'w-4 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <path fill="#c60b1e" d="M0 0h640v480H0z" />
      <path fill="#ffc400" d="M0 120h640v240H0z" />
      <g fill="#c60b1e">
        <path d="M125 180h40v55a20 20 0 01-40 0z" />
        <circle cx="145" cy="165" r="7" fill="#c60b1e" />
        <path fill="#ffc400" d="M132 195h26v22a13 13 0 01-26 0z" />
      </g>
    </svg>
  );
}

interface LanguageBadgeProps {
  language?: string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}

export function LanguageBadge({
  language = 'Inglés',
  size = 'sm',
  showLabel = true,
}: LanguageBadgeProps) {
  const isEs = language === 'Español';

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const flagSizes = {
    xs: 'w-3.5 h-2.5',
    sm: 'w-4 h-2.5',
    md: 'w-4 h-3',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border backdrop-blur-sm shadow-sm flex-shrink-0 ${
        isEs
          ? 'bg-amber-950/85 text-amber-200 border-amber-600/70'
          : 'bg-blue-950/85 text-blue-200 border-blue-600/70'
      } ${sizeClasses[size]}`}
    >
      {isEs ? (
        <FlagES className={`${flagSizes[size]} rounded-[2px] shadow-sm flex-shrink-0 object-cover`} />
      ) : (
        <FlagUS className={`${flagSizes[size]} rounded-[2px] shadow-sm flex-shrink-0 object-cover`} />
      )}
      {showLabel && <span>{isEs ? 'ES' : 'EN'}</span>}
    </span>
  );
}
