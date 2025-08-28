import React from "react";
import { motion } from "framer-motion";

interface LoadingOverlayProps {
  title: string;
  subtitle?: string;
  isVisible: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  title,
  subtitle,
  isVisible,
  className = "",
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`absolute inset-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg ${className}`}
    >
      <div className="text-center">
        {/* Loading spinner with theme-consistent colors */}
        <div className="mb-4">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
        </div>

        {/* Text content */}
        <div className="space-y-1">
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Alternative compact loading spinner for smaller spaces
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`animate-spin ${sizeClasses[size]} border-pink-500 border-t-transparent rounded-full ${className}`}
    />
  );
};
