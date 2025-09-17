import React, { useState } from "react";
import { RefreshCw, ChevronDown, ChevronLeft, ChevronRight } from "../Icons";
import { useSettingsContext } from "../../contexts/SettingsContext";
import ModelSelectorSlider from "./ModelSelectorSlider";

interface ModelOption {
  label: string;
  value: string;
  source: string;
  providerId?: string;
  providerName?: string;
  supported_parameters?: string[];
}

interface RetryButtonProps {
  onRetry: (model: string, source: string, providerId?: string) => void;
  modelOptions: ModelOption[];
  disabled?: boolean;
  currentModel?: string;
  currentSource?: string;
  currentProviderId?: string;
  className?: string;
}

interface VersionNavigationProps {
  currentVersion: number;
  totalVersions: number;
  onVersionChange: (version: number) => void;
  disabled?: boolean;
  className?: string;
}

// Version Navigation Component
export const VersionNavigation: React.FC<VersionNavigationProps> = ({
  currentVersion,
  totalVersions,
  onVersionChange,
  disabled = false,
  className = "",
}) => {
  if (totalVersions <= 1) return null;

  const canGoPrevious = currentVersion > 0;
  const canGoNext = currentVersion < totalVersions - 1;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => canGoPrevious && onVersionChange(currentVersion - 1)}
        disabled={disabled || !canGoPrevious}
        className={`cursor-pointer p-1 rounded transition-all duration-200 ${
          disabled || !canGoPrevious
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
        title="Previous version"
      >
        <ChevronLeft size={14} />
      </button>

      <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
        {currentVersion + 1}/{totalVersions}
      </span>

      <button
        onClick={() => canGoNext && onVersionChange(currentVersion + 1)}
        disabled={disabled || !canGoNext}
        className={`cursor-pointer p-1 rounded transition-all duration-200 ${
          disabled || !canGoNext
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
        title="Next version"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

// Retry Button Component - using reusable ModelSelectorSlider
export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  modelOptions,
  disabled = false,
  currentModel,
  currentSource,
  currentProviderId,
  className = "",
}) => {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const { settings } = useSettingsContext();
  const animationsDisabled = settings.animationsDisabled;

  const handleRetryWithSameModel = () => {
    if (currentModel && currentSource) {
      onRetry(currentModel, currentSource, currentProviderId);
    }
  };

  const handleRetryWithModel = (model: ModelOption) => {
    onRetry(model.value, model.source, model.providerId);
  };

  const triggerButton = (
    <div className="flex items-stretch gap-0">
      {/* Retry same button */}
      <button
        onClick={handleRetryWithSameModel}
        disabled={disabled}
        className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
        title="Retry with same model"
      >
        <RefreshCw size={12} />
        <span>Retry</span>
      </button>

      {/* Dropdown toggle */}
      <button
        onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
        disabled={disabled}
        className={`cursor-pointer p-1 rounded-md transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
        title="Choose different model"
      >
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            isModelSelectorOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <ModelSelectorSlider
        modelOptions={modelOptions}
        selectedModel={currentModel}
        selectedProviderId={currentProviderId}
        onModelSelect={handleRetryWithModel}
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        animationsDisabled={animationsDisabled}
        trigger={triggerButton}
      />
    </div>
  );
};

export default RetryButton;
