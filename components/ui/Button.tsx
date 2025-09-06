import React from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outlined' | 'none';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'none';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'default', 
  children, 
  className, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 focus:ring-pink-500',
    secondary: 'bg-[var(--color-secondary)] hover:bg-[var(--color-muted)] text-[var(--color-foreground)] focus:ring-[var(--color-ring)] border border-[var(--color-border)]',
    destructive: 'bg-[var(--color-destructive)] text-white hover:opacity-90 focus:ring-[var(--color-destructive)]',
    ghost: 'hover:bg-[var(--color-muted)] text-[var(--color-foreground)] focus:ring-[var(--color-ring)]',
    outlined: 'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus:ring-[var(--color-ring)]',
    none: ''
  };

  const sizeClasses = {
    default: 'py-2.5 px-4',
    sm: 'py-2 px-3 text-sm',
    lg: 'py-3 px-8 text-lg',
    icon: 'h-10 w-10',
    none: ''
  };

  const combinedClasses = twMerge(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    'rounded-[var(--radius)]',
    className
  );

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
