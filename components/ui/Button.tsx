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
    primary: 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-ring',
    secondary: 'bg-secondary hover:bg-muted text-secondary-foreground focus:ring-ring border border-border',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive',
    ghost: 'hover:bg-muted text-foreground focus:ring-ring',
    outlined: 'border border-border bg-transparent text-foreground hover:bg-muted focus:ring-ring',
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
