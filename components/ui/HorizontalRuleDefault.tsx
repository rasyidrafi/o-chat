// HorizontalRuleDefault.tsx
import React from "react";

interface HorizontalRuleDefaultProps {
  className?: string;
}

const HorizontalRuleDefault: React.FC<HorizontalRuleDefaultProps> = ({ className = "" }) => {
  return (
    <div className={`relative my-3 ${className}`}>
      {/* Main separator with shadow */}
      <div 
        className="h-px bg-zinc-200 dark:bg-zinc-700"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)',
        }}
      ></div>
    </div>
  );
};

export default HorizontalRuleDefault;