import React, { useState, useMemo, useCallback } from "react";
import { Search, X } from "../Icons";
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
import LoadingState from "./LoadingState";

interface ModelOption {
  label: string;
  value: string;
  source: string;
  providerId?: string;
  providerName?: string;
  supported_parameters?: string[];
}

interface ModelSelectorSliderProps {
  modelOptions: ModelOption[];
  selectedModel?: string;
  selectedProviderId?: string;
  onModelSelect: (option: ModelOption) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  trigger?: React.ReactNode;
  isLoadingSystemModels?: boolean;
  animationsDisabled?: boolean;
}

export const ModelSelectorSlider: React.FC<ModelSelectorSliderProps> = ({
  modelOptions,
  selectedModel,
  selectedProviderId,
  onModelSelect,
  isOpen,
  onClose,
  className = "",
  trigger,
  isLoadingSystemModels = false,
  animationsDisabled = false,
}) => {
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [isSelectingModel, setIsSelectingModel] = useState(false);
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

  const handleModelSelect = (option: ModelOption) => {
    setIsSelectingModel(true);
    onModelSelect(option);
    onClose();
    setModelSearchQuery("");
    // Reset the flag after a short delay to allow the selection to complete
    setTimeout(() => setIsSelectingModel(false), 100);
  };

  // Desktop Popover Content
  const desktopContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: animationsDisabled ? 0 : 0.15 }}
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
          {isLoadingSystemModels &&
            modelOptions.filter((opt) => opt.source === "system").length ===
              0 && (
              <div
                className={`px-3 py-2 ${themes.sidebar.fg} flex items-center gap-2 text-sm`}
              >
                <LoadingState />
              </div>
            )}
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
                  option.value === selectedModel &&
                  (option.providerId || "") === (selectedProviderId || "");
                return (
                  <button
                    key={`${option.value}-${option.providerId || "system"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelSelect(option);
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
                          className={`px-2 py-1 rounded text-xs font-medium ${themes.special.bgGradient} ${themes.special.fg} flex-shrink-0`}
                        >
                          Custom
                        </span>
                      )}
                      <span className="truncate flex-1">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcons(option)}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {groupedModelOptions.length === 0 && modelSearchQuery && (
            <div
              className={`px-3 flex justify-center items-center text-sm text-center ${themes.sidebar.fg}`}
              style={{ height: "200px" }}
            >
              No models found for "{modelSearchQuery}"
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // Mobile Slider Content - EXACT same as ChatInput
  const mobileSlider = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationsDisabled ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: animationsDisabled ? 0 : 0.3,
              ease: "easeOut",
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-t-2xl shadow-md border-t overflow-hidden ${themes.chatview.inputBg} ${themes.chatview.border}`}
          >
            {/* Header */}
            <div className="pt-4 pb-0 px-4 flex items-center justify-between">
              <h3
                className={`text-lg font-semibold ${themes.sidebar.fgHoverAsFg}`}
              >
                Select Model
              </h3>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${themes.sidebar.fg} ${themes.sidebar.fgHover}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
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

            {/* Model Options */}
            <div className="overflow-y-auto thin-scrollbar scroll-fade h-[60vh]">
              {isLoadingSystemModels &&
                modelOptions.filter((opt) => opt.source === "system").length ===
                  0 && (
                  <div
                    className={`px-3 py-2 ${themes.sidebar.fg} flex items-center gap-2 text-sm`}
                  >
                    <LoadingState />
                  </div>
                )}
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
                      selectedModel === option.value &&
                      selectedProviderId === (option.providerId || "");
                    return (
                      <button
                        key={`${option.value}-${option.providerId || "system"}`}
                        onClick={() => handleModelSelect(option)}
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
                              className={`px-2 py-1 rounded text-xs font-medium ${themes.special.bgGradient} ${themes.special.fg} flex-shrink-0`}
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
              {groupedModelOptions.length === 0 && modelSearchQuery && (
                <div
                  className={`px-3 flex justify-center items-center text-sm text-center ${themes.sidebar.fg}`}
                  style={{ height: "inherit" }}
                >
                  No models found for "{modelSearchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Desktop Popover */}
      {!isMobile ? (
        <Popover
          isOpen={isOpen && !isMobile}
          positions={["top", "bottom"]}
          reposition={true}
          containerClassName="z-60"
          onClickOutside={() => {
            if (!isSelectingModel) {
              onClose();
            }
          }}
          content={desktopContent}
        >
          {trigger}
        </Popover>
      ) : (
        trigger
      )}

      {/* Mobile Slider */}
      {isMobile && mobileSlider}
    </div>
  );
};

export default ModelSelectorSlider;
