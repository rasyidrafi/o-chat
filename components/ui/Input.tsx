import React from "react";
import { themes } from "@/constants/themes";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ icon, className, ...props }) => {
  return (
    <div className={`flex items-center w-full border-1 ${themes.sidebar.bg} ${themes.sidebar.bgHover} ${themes.sidebar.border} rounded-lg shadow-sm transition-colors ${themes.sidebar.fg} ${themes.sidebar.fgHover} ${className}`}>
      {icon && (
        <div className="flex items-center justify-center px-4 flex-shrink-0">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`flex-grow bg-transparent py-2.5 ${icon ? "pr-4" : "px-4"} text-sm focus:outline-none ${themes.sidebar.fgRaw("placeholder:")} border-none`}
      />
    </div>
  );
};

export default Input;
