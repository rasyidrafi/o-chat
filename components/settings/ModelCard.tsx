import React from "react";
import { Google, ChevronDown } from "../Icons";

interface ModelCardProps {
  name: string;
  description: string;
  features: string[];
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  logo?: string;
  disabled?: boolean;
  hideScroll?: boolean;
  isExpanded?: boolean;
  onToggleExpansion?: () => void;
  layout?: "card" | "row";
}

const ModelCard: React.FC<ModelCardProps> = ({
  name,
  description,
  features,
  isEnabled,
  onToggle,
  logo,
  disabled = false,
  hideScroll = false,
  isExpanded = false,
  onToggleExpansion,
  layout = "card",
}) => {
  const getFeatureColor = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "tool calling":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400";
      case "reasoning":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400";
      case "vision":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
      case "search url":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400";
      case "image generation":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      case "image editing":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const renderLogo = () => {
    if (logo === "google") {
      return (
        <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-600">
          <Google className="w-6 h-6 text-blue-500" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
      </div>
    );
  };

  return (
    <div className={`bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-700 h-full ${
      layout === "row" ? "p-4 flex flex-col" : "p-6 h-full flex flex-col flex-1"
    }`}>
      <div className={`flex flex-col h-full ${layout === "row" ? "gap-0" : "gap-2 flex-1 min-h-0"}`}>
        {/* Header - always at top with fixed position */}
        <div className={`flex items-center justify-between gap-2 flex-shrink-0 ${layout === "row" ? "mb-2" : ""}`}>
          <div className={`flex items-center gap-4 flex-1`}>
            <div style={{minWidth: "40px"}}>
                {renderLogo()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-1 text-left"
                title={name}
              >
                {name}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {layout === "row" && onToggleExpansion && description && description.trim() && (
              <button
                onClick={onToggleExpansion}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                aria-label={isExpanded ? "Collapse description" : "Expand description"}
              >
                <ChevronDown 
                  className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`} 
                />
              </button>
            )}
            
            {!disabled && (
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => onToggle(!isEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:ring-offset-zinc-800 cursor-pointer ${
                  isEnabled ? "bg-pink-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Description - fills available space in row layout */}
        {layout === "row" ? (
          <div className={`transition-all duration-300 overflow-hidden ${
            isExpanded ? "flex-1 opacity-100" : "h-0 opacity-0"
          }`}>
            <div className="h-full flex flex-col">
              <div className="flex-1 max-h-32 overflow-y-auto thin-scrollbar overflow-x-hidden">
                <p className="text-left text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pb-2 break-words whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex-1" style={{
              maxHeight: hideScroll ? "auto" : "150px"
            }}>
              <p
                className={`text-left text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed h-full ${
                  hideScroll ? "" : "overflow-y-auto thin-scrollbar"
                }`}
              >
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Features - always at bottom */}
        <div className="flex flex-wrap gap-2 flex-shrink-0 mt-2">
          {features.map((feature) => (
            <span
              key={feature}
              className={`text-xs font-medium px-2 py-1 rounded-full ${getFeatureColor(
                feature
              )}`}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
