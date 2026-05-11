import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconHome = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);

export const IconQueue = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <rect x="3" y="10" width="18" height="4" rx="1" />
    <rect x="3" y="16" width="18" height="4" rx="1" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconRules = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 5h12" />
    <path d="M4 12h16" />
    <path d="M4 19h10" />
    <circle cx="19" cy="5" r="1.5" fill="currentColor" />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    <circle cx="17" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

export const IconMemory = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 4h9l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v5h5" />
    <path d="M9 14h6M9 17h4" />
  </svg>
);

export const IconRadar = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 12 19 7" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const IconSpark = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
    <path d="M18 16.5 18.6 18l1.5.6-1.5.6L18 20.7 17.4 19.2 15.9 18.6l1.5-.6L18 16.5Z" />
  </svg>
);

export const IconCommand = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6h3a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3 3 3 0 0 1 3-3h12a3 3 0 0 1 3 3 3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 3 3 0 0 1-3 3H6a3 3 0 0 1-3-3 3 3 0 0 1 3-3Z" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12.5 10 17 19 7.5" />
  </svg>
);

export const IconX = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconFlag = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 21V4l13 2-1.6 5L18 16l-13-2" />
  </svg>
);

export const IconWand = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 20 12-12" />
    <path d="m14 6 4 4" />
    <path d="M19 3v3M21 5h-3M19 11v3M21 13h-3M6 14v3M8 16H5" />
  </svg>
);

export const IconBolt = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const IconAlert = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 10v5" />
    <circle cx="12" cy="18" r="0.7" fill="currentColor" />
  </svg>
);

export const IconPin = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 17v5" />
    <path d="m8 4 8 0 1 4-3 3 3 5H7l3-5-3-3 1-4Z" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

export const IconArrowRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconClose = IconX;
