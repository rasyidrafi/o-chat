import React, { useRef } from "react";
import HorizontalRuleDefault from "./ui/HorizontalRuleDefault";

interface ImageGenerationInputProps {
  isGenerating: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

const ImageGenerationInput = ({
  isGenerating,
  prompt,
  onPromptChange,
  disabled = false,
}: ImageGenerationInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onPromptChange(e.target.value);
    // Auto-resize textarea - exactly like chat mode
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Trigger the parent's generate function by dispatching a custom event
      const generateEvent = new CustomEvent('triggerImageGeneration');
      window.dispatchEvent(generateEvent);
    }
  };

  return (
    <>
      {/* Prompt Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Describe the image you want to generate..."
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-2 pt-1 pb-1 text-sm max-h-32 overflow-y-auto thin-scrollbar"
          rows={1}
          disabled={disabled || isGenerating}
        />
      </div>

      <HorizontalRuleDefault />
    </>
  );
};

export default ImageGenerationInput;
