import React from 'react';
import { motion } from 'framer-motion';

interface SmallButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onTransitionEnd'> {
  children: React.ReactNode;
  className?: string;
  animationsDisabled?: boolean;
}

const SmallButton: React.FC<SmallButtonProps> = ({
  children,
  className,
  animationsDisabled = false,
  ...props
}) => (
  <motion.button
    type="button"
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium bg-white/90 dark:bg-[#1c1c1c]/90 text-zinc-900 dark:text-zinc-200 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${className}`}
    {...props}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      duration: animationsDisabled ? 0 : 0.2,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.button>
);

export default SmallButton;
