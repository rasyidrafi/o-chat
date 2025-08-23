import React from "react";
import { Google } from "../Icons";

interface ModelCardProps {
  name: string;
  description: string;
  features: string[];
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  logo?: string;
  disabled?: boolean;
  hideScroll?: boolean;
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
    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 h-full flex flex-col flex-1">
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-1">
            <div style={{minWidth: "40px"}}>
                {renderLogo()}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-1 text-left"
                title={name}
              >
                {name}
              </h3>
            </div>
          </div>
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

          {/* Always show features - pushed to bottom */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
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
    </div>
  );
};

export default ModelCard;
