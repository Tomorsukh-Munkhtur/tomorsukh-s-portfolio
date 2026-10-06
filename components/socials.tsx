import type { ReactNode } from 'react';

export const EMAIL = 'tomorsukh.official@gmail.com';

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const SOCIALS: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: 'Dribbble',
    href: 'https://dribbble.com/Tomorsukh',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
      </svg>
    ),
  },
  {
    label: 'Behance',
    href: 'https://www.behance.net/Tomorsukh',
    icon: (
      <svg {...iconProps}>
        <path d="M3 8h6.5a2.5 2.5 0 1 1 0 5H3V8z" />
        <path d="M3 13h7a2.5 2.5 0 1 1 0 5H3v-5z" />
        <path d="M14 7h7" />
        <path d="M17.5 11a3.5 3.5 0 1 1 0 7h-1a3.5 3.5 0 0 1-3.5-3.5V14a3.5 3.5 0 0 1 3.5-3.5h1z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/tomoroo.s_photo1/',
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
];
