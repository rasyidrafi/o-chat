import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "../Icons";
import { motion, AnimatePresence } from "framer-motion";
import { Popover } from "react-tiny-popover";
import { useSettingsContext } from "../../contexts/SettingsContext";
import {
  Eye,
  Edit,
  Gallery,
  Brain,
  AI21,
  OpenAI,
  StabilityAI,
  BlackForestLabs,
  ByteDance,
  Meta,
  Anthropic,
  Microsoft,
  Cohere,
  XAI,
  DeepSeek,
  Mistral,
  MoonshotAI,
  Zai,
  Qwen,
  Venice,
  Google,
} from "../Icons";
import { themes } from "../../constants/themes";
import { getModelCapabilities } from "../../services/modelService";

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

// Retry Button Component - using EXACT same pattern as ChatInput
export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  modelOptions,
  disabled = false,
  currentModel,
  currentSource,
  currentProviderId,
  className = "",
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModelSliderOpen, setIsModelSliderOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [isSelectingModel, setIsSelectingModel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useSettingsContext();

  // Get capability icons for a model (EXACT same as ChatInput)
  const getCapabilityIcons = useCallback((option: ModelOption) => {
    if (!option.supported_parameters) return [];

    const capabilities = getModelCapabilities(option.supported_parameters);
    const icons = [];

    if (capabilities.hasImageEditing) {
      icons.push(
        <div
          key="edit"
          title="Image Editing"
          className={`${themes.disabled.bg} rounded p-1`}
        >
          <Edit className="w-3 h-3" />
        </div>
      );
    }

    if (
      capabilities.hasImageGeneration ||
      capabilities.hasImageGenerationJobs
    ) {
      icons.push(
        <div
          key="generation"
          title="Image Generation"
          className={`${themes.disabled.bg} rounded p-1`}
        >
          <Gallery className="w-3 h-3" />
        </div>
      );
    }

    if (capabilities.hasVision) {
      icons.push(
        <div
          key="vision"
          title="Vision"
          className={`${themes.disabled.bg} rounded p-1`}
        >
          <Eye className="w-3 h-3" />
        </div>
      );
    }

    if (capabilities.hasReasoning) {
      icons.push(
        <div
          key="reasoning"
          title="Reasoning"
          className={`${themes.disabled.bg} rounded p-1`}
        >
          <Brain className="w-3 h-3" />
        </div>
      );
    }

    return icons;
  }, []);

  // Get provider icon (EXACT same as ChatInput)
  const getProviderIcon = useCallback((providerName: string) => {
    const lowerProviderName = providerName.toLowerCase();

    if (lowerProviderName.includes("ai21")) {
      return <AI21 size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("openai")) {
      return <OpenAI size={18} className="text-current" />;
    }
    if (
      lowerProviderName.includes("google") ||
      lowerProviderName.includes("gemini")
    ) {
      return <Google size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("anthropic")) {
      return <Anthropic size={18} className="text-current" />;
    }
    if (
      lowerProviderName.includes("stability") ||
      lowerProviderName.includes("stabilityai")
    ) {
      return <StabilityAI size={18} className="text-current" />;
    }
    if (
      lowerProviderName.includes("black forest") ||
      lowerProviderName.includes("flux")
    ) {
      return <BlackForestLabs size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("bytedance")) {
      return <ByteDance size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("meta")) {
      return <Meta size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("microsoft")) {
      return <Microsoft size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("cohere")) {
      return <Cohere size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("xai")) {
      return <XAI size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("deepseek")) {
      return <DeepSeek size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("mistral")) {
      return <Mistral size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("moonshot")) {
      return <MoonshotAI size={18} className="text-current" />;
    }
    if (
      lowerProviderName.includes("zai") ||
      lowerProviderName.includes("z.ai")
    ) {
      return <Zai size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("qwen")) {
      return <Qwen size={18} className="text-current" />;
    }
    if (lowerProviderName.includes("venice")) {
      return <Venice size={18} className="text-current" />;
    }

    return null; // No icon for unknown providers
  }, []);

  // Close dropdown when clicking outside (removed manual handling to avoid conflicts with Popover)

  // Group models exactly like ChatInput
  const groupedModelOptions = useMemo(() => {
    const filteredOptions = modelOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        option.providerName
          ?.toLowerCase()
          .includes(modelSearchQuery.toLowerCase())
    );

    // Group models by provider and source
    const groupedModels = filteredOptions.reduce(
      (groups: { [key: string]: ModelOption[] }, option) => {
        let groupName: string;

        if (option.source === "custom") {
          groupName = "Custom Models";
        } else {
          groupName =
            option.providerId && option.providerId.trim()
              ? option.providerName || "Other"
              : "Other";
        }

        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(option);
        return groups;
      },
      {}
    );

    // Sort providers alphabetically, but put "Other" and "Custom Models" at the end
    return Object.keys(groupedModels)
      .sort((a, b) => {
        if (a === "Custom Models" && b !== "Custom Models") return 1;
        if (a !== "Custom Models" && b === "Custom Models") return -1;
        if (a === "Other" && b !== "Other" && b !== "Custom Models") return 1;
        if (a !== "Other" && a !== "Custom Models" && b === "Other") return -1;
        return a.localeCompare(b);
      })
      .map((providerName) => ({
        name: providerName,
        models: groupedModels[providerName],
      }));
  }, [modelOptions, modelSearchQuery]);

  const handleRetryWithSameModel = () => {
    if (currentModel && currentSource) {
      onRetry(currentModel, currentSource, currentProviderId);
    }
  };

  const handleRetryWithModel = (model: ModelOption) => {
    setIsSelectingModel(true);
    onRetry(model.value, model.source, model.providerId);
    setIsModelDropdownOpen(false);
    setIsModelSliderOpen(false);
    setModelSearchQuery("");
    // Reset the flag after a short delay to allow the retry to complete
    setTimeout(() => setIsSelectingModel(false), 100);
  };

  const handleModelSelectorClick = () => {
    if (isMobile) {
      setIsModelSliderOpen(true);
    } else {
      setIsModelDropdownOpen(!isModelDropdownOpen);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Model Selector */}
      <Popover
        isOpen={isModelDropdownOpen && !isMobile}
        positions={["top", "bottom"]}
        reposition={true}
        containerClassName="z-60"
        onClickOutside={() => {
          if (!isSelectingModel) {
            setIsModelDropdownOpen(false);
          }
        }}
        content={
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`w-[calc(100vw-2rem)] sm:w-80 max-w-80 rounded-lg shadow-sm border overflow-hidden ${themes.chatview.inputBg} ${themes.chatview.border}`}
            >
              {/* Search bar */}
              <div className={`p-3 ${themes.sidebar.fg}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className={`w-full ${themes.chatview.inputBg} border ${
                      themes.chatview.border
                    } ${themes.sidebar.fgRaw("placeholder:")} ${
                      themes.sidebar.fgHoverAsFg
                    } rounded-lg py-2 pl-10 pr-3 focus:outline-none transition-colors text-sm`}
                    autoFocus={!isMobile}
                  />
                  {modelSearchQuery && (
                    <button
                      onClick={() => setModelSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-zinc-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Model list */}
              <div className="h-76 overflow-y-auto thin-scrollbar scroll-fade">
                {groupedModelOptions.map((group) => (
                  <div key={group.name} className="mb-2 last:mb-0 first:mt-2">
                    {/* Provider header */}
                    <div
                      className={`px-3 py-1 text-xs font-medium ${themes.sidebar.fg} flex items-center gap-2`}
                    >
                      {group.name !== "Other" &&
                        group.name !== "Custom Models" &&
                        getProviderIcon(group.name)}
                      <span>{group.name}</span>
                    </div>

                    {/* Models in this provider */}
                    {group.models.map((option) => {
                      const isSelected =
                        option.value === currentModel &&
                        option.source === currentSource &&
                        (option.providerId || "") === (currentProviderId || "");
                      return (
                        <button
                          key={`${option.value}-${
                            option.providerId || "system"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectingModel(true);
                            handleRetryWithModel(option);
                          }}
                          className={`cursor-pointer w-full text-left flex items-center justify-between px-3 py-2 transition-colors text-sm ${
                            themes.sidebar.fgHoverAsFg
                          } ${
                            isSelected
                              ? `${themes.sidebar.bgHoverAsBg}`
                              : `${themes.sidebar.bgHover}`
                          }`}
                          title={option.label}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {option.source === "custom" && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${themes.special.bgGradient} ${themes.special.fg} flex-shrink-0`}
                              >
                                Custom
                              </span>
                            )}
                            <span className="truncate flex-1">
                              {option.label}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {getCapabilityIcons(option)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        }
      >
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
            onClick={handleModelSelectorClick}
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
                isModelDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </Popover>

      {/* Mobile Slider - EXACT same as ChatInput */}
      {isMobile && isModelSliderOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div
            className={`w-full max-h-[80vh] rounded-t-2xl shadow-md border-t overflow-hidden ${themes.chatview.inputBg} ${themes.chatview.border}`}
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-lg font-medium">Select Model</h3>
              <button
                onClick={() => setIsModelSliderOpen(false)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search bar */}
            <div className={`p-3 ${themes.sidebar.fg}`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  className={`w-full ${themes.chatview.inputBg} border ${
                    themes.chatview.border
                  } ${themes.sidebar.fgRaw("placeholder:")} ${
                    themes.sidebar.fgHoverAsFg
                  } rounded-lg py-2 pl-10 pr-3 focus:outline-none transition-colors text-sm`}
                />
              </div>
            </div>

            {/* Model list */}
            <div className="overflow-y-auto">
              {groupedModelOptions.map((group) => (
                <div key={group.name} className="mb-2 last:mb-0 first:mt-2">
                  <div
                    className={`px-4 py-1 text-xs font-medium ${themes.sidebar.fg} flex items-center gap-2`}
                  >
                    {group.name !== "Other" &&
                      group.name !== "Custom Models" &&
                      getProviderIcon(group.name)}
                    <span>{group.name}</span>
                  </div>
                  {group.models.map((option) => {
                    const isSelected =
                      option.value === currentModel &&
                      option.source === currentSource &&
                      (option.providerId || "") === (currentProviderId || "");
                    return (
                      <button
                        key={`${option.value}-${option.providerId || "system"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSelectingModel(true);
                          handleRetryWithModel(option);
                        }}
                        className={`cursor-pointer w-full text-left flex items-center justify-between px-4 py-2 transition-colors text-sm ${
                          themes.sidebar.fgHoverAsFg
                        } ${
                          isSelected
                            ? `${themes.sidebar.bgHoverAsBg}`
                            : `${themes.sidebar.bgHover}`
                        }`}
                        title={option.label}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {option.source === "custom" && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${themes.special.bgGradient} ${themes.special.fg} flex-shrink-0`}
                            >
                              Custom
                            </span>
                          )}
                          <span className="truncate flex-1">
                            {option.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getCapabilityIcons(option)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetryButton;
