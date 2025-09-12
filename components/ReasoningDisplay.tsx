import React, { useState } from "react";
import { ChevronDown, Brain } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
import { themes } from "@/constants/themes";
import { MemoizedMarkdown } from "./MemoizedMarkdown";

interface ReasoningDisplayProps {
  reasoning: string;
  thinkContent?: string;
  isStreaming: boolean;
}

const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoning,
  thinkContent = "",
  isStreaming,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = reasoning || thinkContent;
  const combinedContent = [thinkContent, reasoning].filter(Boolean).join('\n\n');

  if (!hasContent) return null;

  return (
    <div className={`mb-4`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-1 cursor-pointer w-full flex items-center gap-4 transition-all text-left"
      >
        <Brain className={`w-5 h-4 ${themes.special.fgLeft}`} />
        <span
          className={`text-sm mr-1 font-semibold ${themes.sidebar.fgHoverAsFg}`}
        >
          Reasoning
        </span>
        {isStreaming && (
          <div className="w-5 flex items-center gap-1 justify-center">
            <div
              className={`w-1 h-1 rounded-full animate-pulse ${themes.special.bgLeft}`}
            ></div>
            <div
              className={`w-1 h-1 ${themes.special.bgLeft} rounded-full animate-pulse`}
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className={`w-1 h-1 ${themes.special.bgLeft} rounded-full animate-pulse`}
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        )}
        <div className="ml-auto px-1">
          <ChevronDown
            className={`w-4 h-4 ${
              themes.sidebar.fgHoverAsFg
            } transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl md:rounded-lg text-sm overflow-hidden px-5 py-4 mt-4 border-1 ${themes.chatview.border} md:mx-0 -mx-4`}
          >
            <div className="">
              <MemoizedMarkdown 
                content={combinedContent}
                id={`reasoning-${Date.now()}`}
                isReasoning={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReasoningDisplay;
