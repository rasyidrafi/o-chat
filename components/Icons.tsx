export const CancelSquare: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <rect x="3" y="3" width="18" height="18" rx="6" fill="#ef4444" />
    <rect x="1" y="1" width="20" height="20" rx="3" fill="#fff" />
  </svg>
);
import React from "react";

type IconProps = {
  className?: string;
  "aria-label"?: string;
  title?: string;
  size?: number;
};

export const ArrowLeft: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const LogOut: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const LogIn: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

export const Plus: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Logo: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

export const BookOpen: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

export const Search: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const User: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const Sparkles: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3L9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5z" />
  </svg>
);

export const Newspaper: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4M4 9h16M4 15h16M10 3v18" />
  </svg>
);

export const Code: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const GraduationCap: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export const Diamond: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.7 10.3a2.4 2.4 0 0 0 0 3.4l7.5 7.5c.9.9 2.5.9 3.4 0l7.5-7.5a2.4 2.4 0 0 0 0-3.4l-7.5-7.5a2.4 2.4 0 0 0-3.4 0Z" />
  </svg>
);

export const Globe: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const Paperclip: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export const ArrowUp: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
  </svg>
);

export const MoreHorizontal: React.FC<IconProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

export const SlidersHorizontal: React.FC<IconProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </svg>
);

export const Sun: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const Moon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const Desktop: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

export const Menu: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const X: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const Google: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,5 12,5C14.5,5 16.2,6.1 17.1,7L19,5.2C17.2,3.4 14.8,2 12,2C6.4,2 2,6.5 2,12C2,17.5 6.4,22 12,22C17.6,22 21.5,18.2 21.5,12.3C21.5,11.7 21.45,11.4 21.35,11.1Z" />
  </svg>
);

export const Key: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

export const Check: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const Copy: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const Info: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const InfinityIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
  </svg>
);

export const Mail: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const Lock: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const Brain: React.FC<IconProps> = ({
  className,
  size = 24,
  ...props
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path>
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path>
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path>
    <path d="M19.938 10.5a4 4 0 0 1 .585.396"></path>
    <path d="M6 18a4 4 0 0 1-1.967-.516"></path>
    <path d="M19.967 17.484A4 4 0 0 1 18 18"></path>
  </svg>
);

export const ChevronDown: React.FC<IconProps> = ({
  className,
  size = 24,
  ...props
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export const ChevronUp: React.FC<IconProps> = ({
  className,
  size = 24,
  ...props
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

export const ChevronRight: React.FC<IconProps> = ({
  className,
  size = 24,
  ...props
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

export const RefreshCw: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

export const RotateCcw: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="1 4 1 10 7 10" />
    <polyline points="23 20 23 14 17 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

export const GitBranch: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

export const Filter: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const Zap: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const Eye: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Palette: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

export const Gallery: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const Edit: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const Video: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export const Volume2: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const FullScreen: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
  </svg>
);

export const ArrowDown: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

export const Chat: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const OpenAI: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 260"
    fill="currentColor"
  >
    <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
  </svg>
);

export const Gemini: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    fillRule="nonzero"
  >
    <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" />
  </svg>
);

export const StabilityAI: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    fillRule="nonzero"
  >
    <g fill="currentColor">
      <path d="M7.223 21c4.252 0 7.018-2.22 7.018-5.56 0-2.59-1.682-4.236-4.69-4.918l-1.93-.571c-1.694-.375-2.683-.825-2.45-1.975.194-.957.773-1.497 2.122-1.497 4.285 0 5.873 1.497 5.873 1.497v-3.6S11.62 3 7.293 3C3.213 3 1 5.07 1 8.273c0 2.59 1.534 4.097 4.645 4.812l.334.083c.473.144 1.112.335 1.916.572 1.59.375 1.999.773 1.999 1.966 0 1.09-1.15 1.71-2.67 1.71C2.841 17.416 1 15.231 1 15.231v3.989S2.152 21 7.223 21z" />
      <path d="M20.374 20.73c1.505 0 2.626-1.073 2.626-2.526 0-1.484-1.089-2.526-2.626-2.526-1.505 0-2.594 1.042-2.594 2.526 0 1.484 1.089 2.526 2.594 2.526z" />
    </g>
  </svg>
);

export const BlackForestLabs: React.FC<IconProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    {...props}
    fill="currentColor"
    fillRule="evenodd"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
  >
    <path d="M0 20.683L12.01 2.5 24 20.683h-2.233L12.009 5.878 3.471 18.806h12.122l1.239 1.877H0z" />
    <path d="M8.069 16.724l2.073-3.115 2.074 3.115H8.069zM18.24 20.683l-5.668-8.707h2.177l5.686 8.707h-2.196zM19.74 11.676l2.13-3.19 2.13 3.19h-4.26z" />
  </svg>
);

export const ByteDance: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 26 24"
    fill="none"
  >
    <path
      d="M14.7392 9.80759C14.5931 9.92709 14.3806 9.83414 14.3806 9.63497V8.58596V2.23883C14.3806 2.05293 14.1549 1.9467 14.0221 2.06621L5.17862 9.56857C5.03256 9.68808 4.8201 9.59513 4.8201 9.39595V4.27044C4.8201 4.12438 4.70059 4.00487 4.55453 4.00487H0.26557C0.119507 4.00487 0 4.12438 0 4.27044V20.3242C0 20.5101 0.225735 20.6163 0.35852 20.4968L9.18873 12.9944C9.33479 12.8749 9.54725 12.9679 9.54725 13.1671V20.5765C9.54725 20.7624 9.77299 20.8686 9.90577 20.7491L18.736 13.2467C18.882 13.1272 19.0945 13.2202 19.0945 13.4193V18.5449C19.0945 18.6909 19.214 18.8104 19.3601 18.8104H23.649C23.7951 18.8104 23.9146 18.6909 23.9146 18.5449V2.47784C23.9146 2.29194 23.6889 2.18572 23.5561 2.30522L14.7392 9.80759Z"
      fill="currentColor"
    />
  </svg>
);

export const Meta: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a7 7 0 0 0 .265.86a5.3 5.3 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927c1.497 0 2.633-.671 3.965-2.444c.76-1.012 1.144-1.626 2.663-4.32l.756-1.339l.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314c1.046.987 1.992 1.22 3.06 1.22c1.075 0 1.876-.355 2.455-.843a3.7 3.7 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745c0-2.72-.681-5.357-2.084-7.45c-1.282-1.912-2.957-2.93-4.716-2.93c-1.047 0-2.088.467-3.053 1.308c-.652.57-1.257 1.29-1.82 2.05c-.69-.875-1.335-1.547-1.958-2.056c-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999c1.132 1.748 1.647 4.195 1.647 6.4c0 1.548-.368 2.9-1.839 2.9c-.58 0-1.027-.23-1.664-1.004c-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a45 45 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327c1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446c.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338c-1.191 1.649-1.81 1.817-2.486 1.817c-.524 0-1.038-.237-1.383-.794c-.263-.426-.464-1.13-.464-2.046c0-2.221.63-4.535 1.66-6.088c.454-.687.964-1.226 1.533-1.533a2.26 2.26 0 0 1 1.088-.285" />
  </svg>
);

export const Microsoft: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
  </svg>
);

export const Cohere: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 20"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.31969 11.9081C6.84472 11.9081 7.8891 11.8785 9.3327 11.2692C11.0149 10.559 14.3619 9.2699 16.7762 7.94576C18.4648 7.01963 19.2049 5.79474 19.2049 4.14523C19.205 1.85589 17.3949 0 15.1621 0H5.80704C2.59989 0 0 2.66571 0 5.95406C0 9.2424 2.43427 11.9081 6.31969 11.9081Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.90234 16.0108C7.90234 14.3989 8.84877 12.9456 10.3008 12.3277L13.2469 11.0741C16.2269 9.80599 19.5069 12.0514 19.5069 15.3595C19.5069 17.9226 17.4801 20.0001 14.9803 19.9994L11.7906 19.9985C9.643 19.998 7.90234 18.2128 7.90234 16.0108Z"
      fill="currentColor"
    />
    <path
      d="M3.3476 12.6914H3.34753C1.49874 12.6914 0 14.2281 0 16.1237V16.5683C0 18.4639 1.49874 20.0005 3.34753 20.0005H3.3476C5.19639 20.0005 6.69513 18.4639 6.69513 16.5683V16.1237C6.69513 14.2281 5.19639 12.6914 3.3476 12.6914Z"
      fill="currentColor"
    />
  </svg>
);

export const XAI: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 1024 1024"
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid meet"
  >
    <path
      fill="currentColor"
      d="M395.479 633.828 735.91 381.105c16.689-12.39 40.544-7.557 48.496 11.687 41.854 101.493 23.155 223.461-60.118 307.204s-199.137 102.108-305.041 60.281l-115.691 53.866c165.934 114.059 367.431 85.852 493.345-40.861 99.875-100.439 130.807-237.345 101.884-360.806l.262.263C857.105 231.37 909.358 158.874 1016.4 10.633c2.53-3.515 5.07-7.03 7.6-10.633L883.144 141.651v-.439L395.392 633.916M325.226 695.251c-119.098-114.411-98.564-291.475 3.059-393.583 75.146-75.571 198.264-106.414 305.741-61.072l115.428-53.602c-20.797-15.114-47.447-31.371-78.03-42.794-138.234-57.206-303.731-28.735-416.101 84.182-108.089 108.699-142.079 275.833-83.71 418.451 43.603 106.59-27.874 181.985-99.874 258.083C46.224 931.893 20.622 958.87 0 987.429l325.139-292.09"
    />
  </svg>
);

export const AI21: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 55 24"
    fill="none"
  >
    <path
      d="M14.8239 23.4225L13.9839 20.7661H6.23293L5.39254 23.4225H0.00976562L7.79104 1.54987H12.4287L20.3033 23.4225H14.8239ZM10.1256 7.79832L7.44868 16.7978H12.7401L10.1256 7.79832Z"
      fill="currentColor"
    />
    <path
      d="M20.9031 1.54987H26.0075V23.4225H20.9031V1.54987Z"
      fill="currentColor"
    />
    <path
      d="M27.3841 18.9538C27.6133 17.8739 28.0181 16.8393 28.5823 15.8915C29.0731 15.0906 29.6878 14.3733 30.4033 13.7666C31.1343 13.1579 31.9093 12.6045 32.722 12.111C33.3649 11.7357 33.9615 11.3763 34.5116 11.0328C35.019 10.7201 35.5028 10.3703 35.9589 9.98611C36.3529 9.65743 36.685 9.26053 36.9395 8.81424C37.1825 8.36933 37.3058 7.86855 37.2973 7.36123C37.2973 6.48638 37.0588 5.85624 36.5816 5.4708C36.0756 5.076 35.448 4.87145 34.8075 4.89264C34.0786 4.87051 33.3697 5.1339 32.8308 5.62709C32.3018 6.11673 32.0373 6.9344 32.0373 8.08012H27.0259C27.017 7.12836 27.1914 6.18385 27.5398 5.29861C27.8738 4.45642 28.3892 3.69881 29.049 3.08003C29.7518 2.43163 30.5775 1.93215 31.4769 1.61146C32.5364 1.23993 33.6531 1.05999 34.7752 1.07999C35.7381 1.07553 36.6968 1.20706 37.6232 1.47073C38.4849 1.71084 39.293 2.11386 40.0042 2.65817C40.703 3.20683 41.2629 3.91344 41.6382 4.72046C42.0622 5.65645 42.2697 6.67666 42.2451 7.70462C42.2563 8.57417 42.0531 9.43301 41.6537 10.2047C41.2711 10.9386 40.7835 11.6123 40.2064 12.2044C39.6429 12.7816 39.0225 13.2999 38.3548 13.7514C37.6901 14.1995 37.0882 14.5797 36.5493 14.8918C35.8017 15.3918 35.1844 15.8242 34.6973 16.1889C34.2794 16.4922 33.8889 16.8319 33.5304 17.2041C33.2621 17.4804 33.0552 17.8106 32.9232 18.173C32.803 18.5462 32.7451 18.9368 32.752 19.329H42.0897V23.4224H26.9639C26.9372 21.9218 27.0782 20.4229 27.3841 18.9538V18.9538Z"
      fill="currentColor"
    />
    <path
      d="M43.0532 5.39093C43.9254 5.40878 44.7969 5.33015 45.6519 5.15649C46.2231 5.04762 46.7612 4.80696 47.2239 4.4535C47.5952 4.14424 47.8661 3.73079 48.0019 3.26606C48.1575 2.70691 48.2309 2.12793 48.2196 1.54749H52.6723V23.4224H47.5369V8.95424H43.0532V5.39093Z"
      fill="currentColor"
    />
  </svg>
);

export const Anthropic: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    fillRule="evenodd"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="M13.827 3.52h3.603L24 20h-3.603zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

export const DeepSeek: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid meet"
  >
    <path
      fill="currentColor"
      d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.5 5.5 0 0 1-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11 11 0 0 0-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428s-1.67.295-2.687.684a3 3 0 0 1-.465.137 9.6 9.6 0 0 0-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.2 4.2 0 0 0 1.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.7 4.7 0 0 1 1.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614m1-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .2.288.306.306 0 0 1-.31.307.303.303 0 0 1-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.552-.758a1.7 1.7 0 0 1 .016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.56.56 0 0 1-.254-.078.253.253 0 0 1-.114-.358c.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452"
    />
  </svg>
);

export const Mistral: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 256 233"
    width={size}
    height={size}
  >
    <path fill="currentColor" d="M186.182 0h46.545v46.545h-46.545z" />
    <path fill="currentColor" d="M209.455 0H256v46.545h-46.545z" />
    <path
      fill="currentColor"
      d="M0 0h46.545v46.545H0zm0 46.545h46.545v46.546H0zm0 46.546h46.545v46.545H0zm0 46.545h46.545v46.546H0zm0 46.546h46.545v46.545H0z"
    />
    <path fill="currentColor" d="M23.273 0h46.545v46.545H23.273z" />
    <path
      fill="currentColor"
      d="M209.455 46.545H256v46.546h-46.545zm-186.182 0h46.545v46.546H23.273z"
    />
    <path fill="currentColor" d="M139.636 46.545h46.546v46.546h-46.546z" />
    <path
      fill="currentColor"
      d="M162.91 46.545h46.545v46.546h-46.546zm-93.092 0h46.546v46.546H69.818z"
    />
    <path
      fill="currentColor"
      d="M116.364 93.09h46.545v46.546h-46.545zm46.545 0h46.546v46.546h-46.546zm-93.09 0h46.545v46.546H69.818z"
    />
    <path fill="currentColor" d="M93.09 139.636h46.546v46.546H93.091z" />
    <path fill="currentColor" d="M116.364 139.636h46.545v46.546h-46.545z" />
    <path
      fill="currentColor"
      d="M209.455 93.09H256v46.546h-46.545zm-186.182 0h46.545v46.546H23.273z"
    />
    <path fill="currentColor" d="M186.182 139.636h46.545v46.546h-46.545z" />
    <path fill="currentColor" d="M209.455 139.636H256v46.546h-46.545z" />
    <path fill="currentColor" d="M186.182 186.182h46.545v46.545h-46.545z" />
    <path fill="currentColor" d="M23.273 139.636h46.545v46.546H23.273z" />
    <path
      fill="currentColor"
      d="M209.455 186.182H256v46.545h-46.545zm-186.182 0h46.545v46.545H23.273z"
    />
  </svg>
);

export const MoonshotAI: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    fill="currentColor"
    fillRule="evenodd"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M1.052 16.916l9.539 2.552a21.007 21.007 0 00.06 2.033l5.956 1.593a11.997 11.997 0 01-5.586.865l-.18-.016-.044-.004-.084-.009-.094-.01a11.605 11.605 0 01-.157-.02l-.107-.014-.11-.016a11.962 11.962 0 01-.32-.051l-.042-.008-.075-.013-.107-.02-.07-.015-.093-.019-.075-.016-.095-.02-.097-.023-.094-.022-.068-.017-.088-.022-.09-.024-.095-.025-.082-.023-.109-.03-.062-.02-.084-.025-.093-.028-.105-.034-.058-.019-.08-.026-.09-.031-.066-.024a6.293 6.293 0 01-.044-.015l-.068-.025-.101-.037-.057-.022-.08-.03-.087-.035-.088-.035-.079-.032-.095-.04-.063-.028-.063-.027a5.655 5.655 0 01-.041-.018l-.066-.03-.103-.047-.052-.024-.096-.046-.062-.03-.084-.04-.086-.044-.093-.047-.052-.027-.103-.055-.057-.03-.058-.032a6.49 6.49 0 01-.046-.026l-.094-.053-.06-.034-.051-.03-.072-.041-.082-.05-.093-.056-.052-.032-.084-.053-.061-.039-.079-.05-.07-.047-.053-.035a7.785 7.785 0 01-.054-.036l-.044-.03-.044-.03a6.066 6.066 0 01-.04-.028l-.057-.04-.076-.054-.069-.05-.074-.054-.056-.042-.076-.057-.076-.059-.086-.067-.045-.035-.064-.052-.074-.06-.089-.073-.046-.039-.046-.039a7.516 7.516 0 01-.043-.037l-.045-.04-.061-.053-.07-.062-.068-.06-.062-.058-.067-.062-.053-.05-.088-.084a13.28 13.28 0 01-.099-.097l-.029-.028-.041-.042-.069-.07-.05-.051-.05-.053a6.457 6.457 0 01-.168-.179l-.08-.088-.062-.07-.071-.08-.042-.049-.053-.062-.058-.068-.046-.056a7.175 7.175 0 01-.027-.033l-.045-.055-.066-.082-.041-.052-.05-.064-.02-.025a11.99 11.99 0 01-1.44-2.402zm-1.02-5.794l11.353 3.037a20.468 20.468 0 00-.469 2.011l10.817 2.894a12.076 12.076 0 01-1.845 2.005L.657 15.923l-.016-.046-.035-.104a11.965 11.965 0 01-.05-.153l-.007-.023a11.896 11.896 0 01-.207-.741l-.03-.126-.018-.08-.021-.097-.018-.081-.018-.09-.017-.084-.018-.094c-.026-.141-.05-.283-.071-.426l-.017-.118-.011-.083-.013-.102a12.01 12.01 0 01-.019-.161l-.005-.047a12.12 12.12 0 01-.034-2.145zm1.593-5.15l11.948 3.196c-.368.605-.705 1.231-1.01 1.875l11.295 3.022c-.142.82-.368 1.612-.668 2.365l-11.55-3.09L.124 10.26l.015-.1.008-.049.01-.067.015-.087.018-.098c.026-.148.056-.295.088-.442l.028-.124.02-.085.024-.097c.022-.09.045-.18.07-.268l.028-.102.023-.083.03-.1.025-.082.03-.096.026-.082.031-.095a11.896 11.896 0 011.01-2.232zm4.442-4.4L17.352 4.59a20.77 20.77 0 00-1.688 1.721l7.823 2.093c.267.852.442 1.744.513 2.665L2.106 5.213l.045-.065.027-.04.04-.055.046-.065.055-.076.054-.072.064-.086.05-.065.057-.073.055-.07.06-.074.055-.069.065-.077.054-.066.066-.077.053-.06.072-.082.053-.06.067-.074.054-.058.073-.078.058-.06.063-.067.168-.17.1-.098.059-.056.076-.071a12.084 12.084 0 012.272-1.677zM12.017 0h.097l.082.001.069.001.054.002.068.002.046.001.076.003.047.002.06.003.054.002.087.005.105.007.144.011.088.007.044.004.077.008.082.008.047.005.102.012.05.006.108.014.081.01.042.006.065.01.207.032.07.012.065.011.14.026.092.018.11.022.046.01.075.016.041.01L14.7.3l.042.01.065.015.049.012.071.017.096.024.112.03.113.03.113.032.05.015.07.02.078.024.073.023.05.016.05.016.076.025.099.033.102.036.048.017.064.023.093.034.11.041.116.045.1.04.047.02.06.024.041.018.063.026.04.018.057.025.11.048.1.046.074.035.075.036.06.028.092.046.091.045.102.052.053.028.049.026.046.024.06.033.041.022.052.029.088.05.106.06.087.051.057.034.053.032.096.059.088.055.098.062.036.024.064.041.084.056.04.027.062.042.062.043.023.017c.054.037.108.075.161.114l.083.06.065.048.056.043.086.065.082.064.04.03.05.041.086.069.079.065.085.071c.712.6 1.353 1.283 1.909 2.031L7.222.994l.062-.027.065-.028.081-.034.086-.035c.113-.045.227-.09.341-.131l.096-.035.093-.033.084-.03.096-.031c.087-.03.176-.058.264-.085l.091-.027.086-.025.102-.03.085-.023.1-.026L9.04.37l.09-.023.091-.022.095-.022.09-.02.098-.021.091-.02.095-.018.092-.018.1-.018.091-.016.098-.017.092-.014.097-.015.092-.013.102-.013.091-.012.105-.012.09-.01.105-.01c.093-.01.186-.018.28-.024l.106-.008.09-.005.11-.006.093-.004.1-.004.097-.002.099-.002.197-.002z" />
  </svg>
);

export const Zai: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    fill="currentColor"
    fillRule="evenodd"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z" />
  </svg>
);

export const Qwen: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    fillRule="evenodd"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="M12.604 1.34q.59 1.035 1.174 2.075a.18.18 0 0 0 .157.091h5.552q.26 0 .446.327l1.454 2.57c.19.337.24.478.024.837q-.39.646-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77q-.656 1.177-1.335 2.34c-.159.272-.352.375-.68.37a43 43 0 0 0-2.327.016.1.1 0 0 0-.081.05 575 575 0 0 1-2.705 4.74c-.169.293-.38.363-.725.364q-1.495.005-3.017.002a.54.54 0 0 1-.465-.271l-1.335-2.323a.09.09 0 0 0-.083-.049H4.982a1.8 1.8 0 0 1-.805-.092l-1.603-2.77a.54.54 0 0 1-.002-.54l1.207-2.12a.2.2 0 0 0 0-.197 551 551 0 0 1-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965q.697-1.22 1.387-2.436c.132-.234.304-.334.584-.335a338 338 0 0 1 2.589-.001.12.12 0 0 0 .107-.063l2.806-4.895a.49.49 0 0 1 .422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34m-3.432.403a.06.06 0 0 0-.052.03L6.254 6.788a.16.16 0 0 1-.135.078H3.253q-.084 0-.041.074l5.81 10.156q.037.062-.034.063l-2.795.015a.22.22 0 0 0-.2.116l-1.32 2.31q-.066.117.068.118l5.716.008q.068 0 .104.061l1.403 2.454q.069.122.139 0l5.006-8.76.783-1.382a.055.055 0 0 1 .096 0l1.424 2.53a.12.12 0 0 0 .107.062l2.763-.02a.04.04 0 0 0 .035-.02.04.04 0 0 0 0-.04l-2.9-5.086a.11.11 0 0 1 0-.113l.293-.507 1.12-1.977q.036-.062-.035-.062H9.2q-.088 0-.043-.077l1.434-2.505a.11.11 0 0 0 0-.114L9.225 1.774a.06.06 0 0 0-.053-.031m6.29 8.02q.07 0 .034.06l-.832 1.465-2.613 4.585a.06.06 0 0 1-.05.029.06.06 0 0 1-.05-.029L8.498 9.841q-.03-.051.028-.054l.216-.012 6.722-.012z" />
  </svg>
);

export const Venice: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    width={size}
    height={size}
    viewBox="0 0 56 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M18.0516 42.0963C17.0236 41.3321 15.7829 40.6918 14.4109 40.3028C13.0389 39.9138 11.5356 39.7763 10.0657 39.9393C8.59572 40.1024 7.15914 40.5661 5.90573 41.2462C4.65235 41.9264 3.58213 42.8231 2.74661 43.7941C1.9088 44.7631 1.1789 45.9533 0.690033 47.293C0.201165 48.6326 -0.0466665 50.1217 0.00780252 51.5997C0.0622421 53.0776 0.418983 54.5445 1.00508 55.8445C1.5912 57.1446 2.4067 58.2778 3.31358 59.1825C4.21828 60.0894 5.35156 60.9049 6.65161 61.491C7.95166 62.0771 9.4185 62.4339 10.8964 62.4883C12.3744 62.5428 13.8635 62.295 15.2031 61.8061C16.5428 61.3172 17.733 60.5873 18.702 59.7495C19.673 58.914 20.5697 57.8438 21.2499 56.5904C21.93 55.337 22.3938 53.9004 22.5568 52.4304C22.7199 50.9605 22.5823 49.4572 22.1933 48.0852C21.8044 46.7132 21.164 45.4725 20.3998 44.4445L22.9241 41.9201L24.7616 43.7576H25.8053L27.0648 42.498V41.4544L25.2273 39.6169L27.895 36.9493L30.5627 39.6169L28.7252 41.4544V42.498L29.9848 43.7576H31.0284L32.8659 41.9201L35.3903 44.4445C34.626 45.4725 33.9857 46.7132 33.5968 48.0852C33.2078 49.4572 33.0702 50.9605 33.2333 52.4304C33.3963 53.9004 33.86 55.337 34.5402 56.5904C35.2204 57.8438 36.1171 58.914 37.0881 59.7495C38.057 60.5873 39.2473 61.3172 40.5869 61.8061C41.9266 62.295 43.4157 62.5428 44.8936 62.4883C46.3716 62.4339 47.8384 62.0771 49.1385 61.491C50.4385 60.9049 51.5718 60.0894 52.4765 59.1825C53.3834 58.2778 54.1989 57.1446 54.785 55.8445C55.3711 54.5445 55.7278 53.0776 55.7823 51.5997C55.8368 50.1217 55.5889 48.6326 55.1 47.293C54.6112 45.9533 53.8813 44.7631 53.0435 43.7941C52.2079 42.8231 51.1377 41.9264 49.8843 41.2462C48.6309 40.5661 47.1944 40.1024 45.7244 39.9393C44.2545 39.7763 42.7512 39.9138 41.3792 40.3028C40.0072 40.6918 38.7664 41.3321 37.7385 42.0963L35.261 39.6149L37.0975 37.7785V36.7348L35.793 35.4303H34.7494L32.9119 37.2678L30.2432 34.6011L44.2338 20.6104L49.8973 26.2739V20.3812H55.79L50.1265 14.7178L55.79 9.05434V8.01072L54.4854 6.70617H53.4418L27.895 32.2529L2.34829 6.70617H1.30467L0.00012207 8.01072V9.05434L5.66355 14.7178L0.00012207 20.3812H5.89281V26.2739L11.5562 20.6104L25.5469 34.6011L22.8782 37.2678L21.0407 35.4303H19.9971L18.6925 36.7348V37.7785L20.529 39.6149L18.0516 42.0963ZM40.7548 55.0565C40.1787 56.2382 40.2983 57.8757 41.0401 58.9611C41.7215 60.0853 43.163 60.8714 44.4771 60.8356C45.7912 60.8714 47.2327 60.0853 47.9141 58.9611C48.6559 57.8757 48.7755 56.2382 48.1994 55.0565L48.3429 54.902C49.5245 55.4812 51.1644 55.3639 52.2515 54.6224C53.3776 53.9416 54.1655 52.4985 54.1295 51.1831C54.1655 49.8677 53.3776 48.4247 52.2515 47.7438C51.1644 47.0024 49.5245 46.8851 48.3429 47.4642L48.1994 47.3098C48.7755 46.1281 48.6559 44.4906 47.9141 43.4052C47.2327 42.281 45.7912 41.4949 44.4771 41.5307C43.163 41.4949 41.7215 42.281 41.0401 43.4052C40.2983 44.4906 40.1787 46.1281 40.7548 47.3098L40.6113 47.4642C39.4297 46.8851 37.7898 47.0024 36.7027 47.7438C35.5766 48.4247 34.7887 49.8677 34.8247 51.1831C34.7887 52.4985 35.5766 53.9416 36.7027 54.6224C37.7898 55.3639 39.4297 55.4812 40.6113 54.902L40.7548 55.0565ZM14.7495 58.9611C15.4912 57.8757 15.6109 56.2382 15.0348 55.0565L15.1783 54.902C16.3598 55.4812 17.9998 55.3639 19.0869 54.6224C20.2129 53.9416 21.0008 52.4985 20.9649 51.1831C21.0008 49.8677 20.2129 48.4247 19.0869 47.7438C17.9998 47.0024 16.3598 46.8851 15.1783 47.4642L15.0348 47.3098C15.6109 46.1281 15.4912 44.4906 14.7495 43.4052C14.068 42.281 12.6266 41.4949 11.3124 41.5307C9.99831 41.4949 8.55687 42.281 7.8754 43.4052C7.13367 44.4906 7.01402 46.1281 7.59011 47.3098L7.44662 47.4642C6.26505 46.8851 4.62512 47.0024 3.538 47.7438C2.41196 48.4247 1.62402 49.8677 1.66001 51.1831C1.62402 52.4985 2.41196 53.9416 3.538 54.6224C4.62512 55.3639 6.26505 55.4812 7.44662 54.902L7.59011 55.0565C7.01402 56.2382 7.13367 57.8757 7.8754 58.9611C8.55687 60.0853 9.99831 60.8714 11.3124 60.8356C12.6266 60.8714 14.068 60.0853 14.7495 58.9611Z"
      fill="currentColor"
    ></path>
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M27.8764 6.70614L34.5826 0L37.9034 3.32082V14.5147L28.7066 23.7115H27.0462L17.8494 14.5147V3.32082L21.1703 0L27.8764 6.70614ZM21.1703 2.34818L27.0463 8.22415V19.0152L21.1703 13.1392V2.34818ZM28.7069 8.22415L34.5829 2.34818V13.1392L28.7069 19.0152V8.22415Z"
      fill="currentColor"
    ></path>
  </svg>
);

export const CommandK: React.FC<
  IconProps & { isMac?: boolean; eachClass?: string }
> = ({ isMac = true, eachClass = "", ...props }) => (
  <div
    className="flex items-center gap-0.5 text-xs font-mono opacity-70"
    {...props}
  >
    <span
      className={`px-1 py-0.5 ${eachClass} rounded font-medium leading-none`}
    >
      {isMac ? "⌘" : "Ctrl"}
    </span>
    <span
      className={`px-1 py-0.5 ${eachClass} rounded font-medium leading-none`}
    >
      K
    </span>
  </div>
);

export const Clear: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
