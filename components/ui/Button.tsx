import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

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
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1c1c1c] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 focus:ring-pink-500',
    secondary: 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white focus:ring-zinc-500',
    destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-zinc-500',
  };

  const sizeClasses = {
    default: 'py-2.5 px-4',
    sm: 'py-2 px-3 text-sm',
    lg: 'py-3 px-8 text-lg',
    icon: 'h-10 w-10',
  };

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
