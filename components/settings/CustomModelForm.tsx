import React, { useState, useEffect } from "react";
import { Check, X, Eye, Brain, Code } from "../Icons";
import { themes } from "@/constants/themes";

interface CustomModel {
  id: string;
  name: string;
  description?: string;
  hasVision: boolean;
  hasReasoning: boolean;
  hasFunctionCalling: boolean;
  supported_parameters: string[];
}

interface CustomModelFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (model: CustomModel) => void;
  editingModel?: CustomModel | null;
}

const CustomModelForm: React.FC<CustomModelFormProps> = ({
  isVisible,
  onClose,
  onSave,
  editingModel,
}) => {
  const [modelName, setModelName] = useState(editingModel?.name || "");
  const [modelId, setModelId] = useState(editingModel?.id || "");
  const [description, setDescription] = useState(
    editingModel?.description || ""
  );
  const [hasVision, setHasVision] = useState(editingModel?.hasVision || false);
  const [hasReasoning, setHasReasoning] = useState(
    editingModel?.hasReasoning || false
  );
  const [hasFunctionCalling, setHasFunctionCalling] = useState(
    editingModel?.hasFunctionCalling || false
  );

  // Update form fields when editingModel changes
  useEffect(() => {
    setModelName(editingModel?.name || "");
    setModelId(editingModel?.id || "");
    setDescription(editingModel?.description || "");
    setHasVision(editingModel?.hasVision || false);
    setHasReasoning(editingModel?.hasReasoning || false);
    setHasFunctionCalling(editingModel?.hasFunctionCalling || false);
  }, [editingModel]);

  const generateSupportedParameters = () => {
    const params = ["text_generation"];
    if (hasVision) params.push("vision");
    if (hasReasoning) params.push("reasoning");
    if (hasFunctionCalling) params.push("tools");
    return params;
  };

  const handleSave = () => {
    if (!modelName.trim() || !modelId.trim()) return;

    const model: CustomModel = {
      id: modelId.trim(),
      name: modelName.trim(),
      description: description.trim() || "",
      hasVision,
      hasReasoning,
      hasFunctionCalling,
      supported_parameters: generateSupportedParameters(),
    };

    onSave(model);
    handleClose();
  };

  const handleClose = () => {
    setModelName(editingModel?.name || "");
    setModelId(editingModel?.id || "");
    setDescription(editingModel?.description || "");
    setHasVision(editingModel?.hasVision || false);
    setHasReasoning(editingModel?.hasReasoning || false);
    setHasFunctionCalling(editingModel?.hasFunctionCalling || false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
            {editingModel ? "Edit Custom Model" : "Add Custom Model"}
          </h3>

          <div className="space-y-4">
            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="GPT-4 Custom"
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              />
            </div>

            {/* Model ID */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Model ID
              </label>
              <input
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="gpt-4-custom"
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A custom GPT-4 model with enhanced capabilities..."
                rows={3}
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-none"
              />
            </div>

            {/* Abilities */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Abilities
              </label>
              <div className="flex gap-3 flex-row">
                {/* Vision */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer ${hasVision ? themes.special.bgGradient : "bg-zinc-50 dark:bg-zinc-800/30"}`} onClick={() => setHasVision(!hasVision)}>
                  <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
                    <Eye size={18} />
                    <div className="text-sm font-medium">
                      Vision
                    </div>
                  </div>
                  {/* <button
                    type="button"
                    onClick={() => setHasVision(!hasVision)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      hasVision
                        ? "bg-pink-500 border-pink-500 text-white"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-pink-500"
                    }`}
                  >
                    {hasVision && <Check size={12} />}
                  </button> */}
                </div>

                {/* Reasoning */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer ${hasReasoning ? themes.special.bgGradient : "bg-zinc-50 dark:bg-zinc-800/30"}`} onClick={() => setHasReasoning(!hasReasoning)}>
                  <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
                    <Brain size={18} />
                    <div className="text-sm font-medium">
                      Reasoning
                    </div>
                  </div>
                  {/* <button
                    type="button"
                    onClick={() => setHasReasoning(!hasReasoning)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      hasReasoning
                        ? "bg-pink-500 border-pink-500 text-white"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-pink-500"
                    }`}
                  >
                    {hasReasoning && <Check size={12} />}
                  </button> */}
                </div>

                {/* Function Calling */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer ${hasFunctionCalling ? themes.special.bgGradient : "bg-zinc-50 dark:bg-zinc-800/30"}`} onClick={() => setHasFunctionCalling(!hasFunctionCalling)}>
                  <div className="flex items-center gap-3 text-zinc-900 dark:text-white">
                    <Code size={18} />
                    <div className="text-sm font-medium">
                      Function Calling
                    </div>
                  </div>
                  {/* <button
                    type="button"
                    onClick={() => setHasFunctionCalling(!hasFunctionCalling)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      hasFunctionCalling
                        ? "bg-pink-500 border-pink-500 text-white"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-pink-500"
                    }`}
                  >
                    {hasFunctionCalling && <Check size={12} />}
                  </button> */}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={!modelName.trim() || !modelId.trim()}
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} />
              {editingModel ? "Update Model" : "Add Model"}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModelForm;
