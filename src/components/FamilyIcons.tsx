import React from 'react';
import { FamilyIconId } from '../types';

export interface FamilyIconMeta {
  id: FamilyIconId;
  emoji: string;
  label: string;
}

export const FAMILY_ICONS: FamilyIconMeta[] = [
  {
    id: 'chef-family',
    emoji: '👨‍👩‍👧',
    label: 'Gia đình nhỏ',
  },
  {
    id: 'sunshine-home',
    emoji: '👧',
    label: 'Công chúa nhỏ',
  },
  {
    id: 'happy-bears',
    emoji: '👦',
    label: 'Hoàng tử nhí',
  },
  {
    id: 'star-sprout',
    emoji: '🦸‍♂️',
    label: 'Siêu anh hùng',
  },
  {
    id: 'heart-hands',
    emoji: '🧚‍♀️',
    label: 'Nàng tiên nhí',
  },
  {
    id: 'rainbow-kids',
    emoji: '🧸',
    label: 'Gấu bông yêu',
  },
];

export const FamilyEmblemSvg: React.FC<{
  iconId: FamilyIconId;
  className?: string;
}> = ({ iconId, className = 'text-2xl' }) => {
  const found = FAMILY_ICONS.find((item) => item.id === iconId) || FAMILY_ICONS[0];
  return (
    <span className={`inline-flex items-center justify-center select-none leading-none ${className}`} role="img" aria-label={found.label}>
      {found.emoji}
    </span>
  );
};

export const WelstoryLogoSvg: React.FC<{ className?: string }> = ({
  className = 'h-12 sm:h-14 w-auto',
}) => (
  <svg
    className={className}
    viewBox="0 0 790 155"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Welstory Vietnam"
  >
    {/* Dấu thanh trên đầu bên trái */}
    <path d="M5 26.5C5 21 8.5 17 14 17H32C32 28.5 22 36.5 5 36.5V26.5Z" fill="#EA5514" />
    {/* Chữ w */}
    <path
      d="M42 66.5C42 41 53 23 71.5 23C85 23 93 33 94.5 44C96 33 104 23 117.5 23C136 23 147 41 147 66.5H130C130 48.5 124 37 117 37C110 37 105.5 44 105.5 54.5V111.5H89.5V54.5C89.5 44 85 37 78 37C71 37 65 48.5 65 66.5V111.5H42V66.5Z"
      transform="scale(1, -1) translate(0, -135)"
      fill="#EA5514"
    />
    {/* Chữ e */}
    <path
      d="M149 67C149 41 168.5 22 195 22C221.5 22 239.5 41 239.5 67.5C239.5 69.5 239.5 72 239 74H172C173.5 90 183 98.5 196.5 98.5C206.5 98.5 214.5 93.5 218 85.5H238C232.5 103.5 216.5 114 195 114C168.5 114 149 93 149 67ZM195 37.5C182.5 37.5 174 46 172.5 60.5H217C215.5 46 207 37.5 195 37.5Z"
      fill="#EA5514"
    />
    {/* Chữ l */}
    <path d="M248 1H270V112H248V1Z" fill="#EA5514" />
    {/* Chữ s */}
    <path
      d="M276 96C276 82 288.5 73.5 304 69.5L313 67C322 64.5 327.5 60.5 327.5 54C327.5 44.5 318.5 38 305 38C292 38 283.5 44 282 54H260C261.5 33 280 22 305 22C331.5 22 350.5 35 350.5 55C350.5 68.5 340 76.5 324 81L314 83.5C304 86.5 298.5 91 298.5 97.5C298.5 106.5 307.5 113.5 321.5 113.5C334 113.5 344 107 346 95H368C366 116.5 346.5 129 321.5 129C295 129 276 115.5 276 96Z"
      transform="translate(70, -3)"
      fill="#EA5514"
    />
    {/* Chữ t */}
    <path
      d="M366 38H350V24H366V4H388V24H407V38H388V90C388 97.5 392 100.5 398 100.5C401.5 100.5 405 99.5 408 97.5V113C403 115 397 116 390 116C374 116 366 107 366 90V38Z"
      transform="translate(56, -3)"
      fill="#EA5514"
    />
    {/* Chữ o */}
    <path
      d="M410 67C410 41 429 22 455.5 22C482 22 501 41 501 67C501 93 482 112 455.5 112C429 112 410 93 410 67ZM478.5 67C478.5 50.5 469 38 455.5 38C442 38 432.5 50.5 432.5 67C432.5 83.5 442 96 455.5 96C469 96 478.5 83.5 478.5 67Z"
      transform="translate(68, -1)"
      fill="#EA5514"
    />
    {/* Chữ r */}
    <path
      d="M512 24H533V39C537.5 28 547.5 22 559 22C562 22 565 22.5 568 23.5V45C564 43.5 560 43 555 43C542 43 534 52.5 534 68V112H512V24Z"
      transform="translate(74, -1)"
      fill="#EA5514"
    />
    {/* Chữ y */}
    <path
      d="M572 24H596L611 72L626 24H650L626 95L617 122C611 138 599 146 582 146C576 146 569 144.5 564 142V124C568 126 572.5 127 577 127C586 127 592 122 595 113L599 101L572 24Z"
      transform="translate(76, -1)"
      fill="#EA5514"
    />
    {/* Dấu thanh trên đầu bên phải */}
    <path
      d="M748 17H766C771.5 17 775 21 775 26.5V36.5C758 36.5 748 28.5 748 17Z"
      transform="translate(-15, 0)"
      fill="#EA5514"
    />
    {/* Chữ Vietnam màu xám #7D8389 */}
    <g transform="translate(42, 148) scale(1.15)">
      <text
        x="0"
        y="0"
        fontFamily="'Quicksand', 'Plus Jakarta Sans', sans-serif"
        fontWeight="700"
        fontSize="28"
        fill="#7D8389"
        letterSpacing="0.5"
      >
        Vietnam
      </text>
    </g>
  </svg>
);
