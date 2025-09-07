import React from "react";
import { themes } from "@/constants/themes";

interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xs";
  className?: string;
  centerContent?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  subtitle,
  size = "md",
  className = "",
  centerContent = true,
}) => {
  const containerClasses = centerContent
    ? "flex flex-col items-center justify-center"
    : "flex flex-col items-center";

  const spinnerSizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4",
    xs: "w-4 h-4 border-1",
  };

  const spacingClasses = {
    sm: "mb-2",
    md: "mb-3",
    lg: "mb-4",
    xs: "mb-1",
  };

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Loading spinner with pink theme colors */}
      <div className={Boolean(message.trim()) ? spacingClasses[size] : ""}>
        <div
          className={`animate-spin ${spinnerSizeClasses[size]} ${themes.special.bgLeftAsBorder} border-t-transparent rounded-full mx-auto`}
        ></div>
      </div>

      {/* Text content */}
      <div className="space-y-1 text-center">
        <span className={`text-sm`}>{message}</span>
        {subtitle && (
          <p
            className={`${
              size === "sm" || size === "xs" ? "text-xs" : "text-sm"
            } ${themes.sidebar.fg} max-w-xs`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;
