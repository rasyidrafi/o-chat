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
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:ring-primary-500',
    secondary: 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white focus:ring-neutral-500',
    destructive: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500',
    ghost: 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-neutral-500',
    outlined: 'border-1 border-neutral-300/50 dark:border-neutral-600 bg-transparent text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:ring-neutral-500',
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
    className
  );

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
