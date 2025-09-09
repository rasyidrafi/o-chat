import React, { useState } from "react";
import { ChevronDown, ChevronRight, Brain, ChevronUp } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
import { themes } from "@/constants/themes";

interface ReasoningDisplayProps {
  reasoning: string;
  thinkContent?: string;
  isReasoningComplete: boolean;
  isStreaming: boolean;
}

const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoning,
  thinkContent = "",
  isReasoningComplete,
  isStreaming,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = reasoning || thinkContent;

  if (!hasContent) return null;

  return (
    <div className={`mb-4`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-1 cursor-pointer w-full flex items-center gap-4 transition-all text-left"
      >
        {!isReasoningComplete && isStreaming ? (
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
        ) : (
          <Brain className={`w-5 h-4 ${themes.special.fgLeft}`} />
        )}
        <span className={`text-sm mr-1 font-semibold ${themes.sidebar.fgHoverAsFg} opacity-70`}>
          Reasoning
        </span>
        <div className="opacity-70">
          {isExpanded ? (
            <ChevronUp className={`w-4 h-4 ${themes.sidebar.fgHoverAsFg}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${themes.sidebar.fgHoverAsFg}`} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg px-5 py-4 mt-4 border-1 ${themes.chatview.border}`}
          >
            <div className="">
              <div className={`text-sm ${themes.sidebar.fg} break-words whitespace-pre-wrap`}>
                {thinkContent && thinkContent}
                {reasoning && reasoning}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReasoningDisplay;
