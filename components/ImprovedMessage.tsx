// Improved Message component with memoized markdown processing and performance optimizations
import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  memo,
} from "react";
import { ChatMessage, MessageAttachment } from "../types/chat";
import { motion } from "framer-motion";
import TypingIndicator from "./TypingIndicator";
import ReasoningDisplay from "./ReasoningDisplay";
import HorizontalRule from "./ui/HorizontalRule";
import { ImageUploadService } from "../services/imageUploadService";
import { ImageGenerationService } from "../services/imageGenerationService";
import LoadingIndicator from "./ui/LoadingIndicator";
import { MemoizedMarkdown } from "./MemoizedMarkdown";

// Lazy load heavy dependencies only when needed
let mermaidPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid");
  }
  return mermaidPromise;
};

const getImageUrlFromPath = async (gcsPath: string): Promise<string> => {
  try {
    return await ImageUploadService.getImageUrl(gcsPath);
  } catch (error) {
    console.error("Error getting image URL:", error);
    return "";
  }
};

// Simple image component with error handling
const MessageImage: React.FC<{ attachment: MessageAttachment }> = memo(({ attachment }) => {
  const [imageUrl, setImageUrl] = useState<string>(attachment.url);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (attachment.gcsPath && !attachment.isDirectUrl) {
      setIsLoading(true);
      getImageUrlFromPath(attachment.gcsPath)
        .then((url) => {
          if (url) {
            setImageUrl(url);
          } else {
            setHasError(true);
          }
        })
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    }
  }, [attachment.gcsPath, attachment.isDirectUrl]);

  if (isLoading) {
    return (
      <div className="w-full max-w-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 flex items-center justify-center">
        <LoadingIndicator size="sm" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full max-w-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-800 dark:text-red-200 text-sm">Failed to load image</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={attachment.filename}
      className="max-w-full max-h-96 rounded-lg shadow-sm object-contain"
      onError={() => setHasError(true)}
    />
  );
});

MessageImage.displayName = "MessageImage";

// Mermaid diagram component with memoization
const MermaidDiagram: React.FC<{ code: string }> = memo(({ code }) => {
  const [mermaidLib, setMermaidLib] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadMermaid().then((module: any) => {
      module.default.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      });
      setMermaidLib(module.default);
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidLib || !code) return;

      try {
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaidLib.render(uniqueId, code);
        setSvg(renderedSvg);
        setError("");
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError("Failed to render diagram");
      }
    };

    if (mermaidLib) {
      renderDiagram();
    }
  }, [mermaidLib, code]);

  if (error) {
    return (
      <div className="my-4 flex justify-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex justify-center bg-white dark:bg-zinc-900 rounded-lg p-4 text-zinc-500">
        Loading diagram...
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center bg-white dark:bg-zinc-900 rounded-lg p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

MermaidDiagram.displayName = "MermaidDiagram";

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  animationsDisabled?: boolean;
  isLastMessage?: boolean;
}

const Message: React.FC<MessageProps> = memo(
  ({
    message,
    isStreaming = false,
    animationsDisabled = false,
    isLastMessage = false,
  }) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const [isDark, setIsDark] = useState(false);

    // Detect dark mode
    useEffect(() => {
      const checkDarkMode = () => {
        setIsDark(document.documentElement.classList.contains("dark"));
      };
      checkDarkMode();
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }, []);

    // Format timestamp
    const formatTime = (date: Date) => {
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (messageDate.getTime() === today.getTime()) {
        return `Today at ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else {
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    };

    // Get message styles
    const getMessageStyles = () => {
      if (isUser) {
        return "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl px-4 py-3 max-w-[95%] sm:max-w-[85%] md:max-w-[75%] border border-zinc-300/50 dark:border-zinc-700/50 break-words overflow-wrap-anywhere";
      }
      if (message.isError) {
        return "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3 w-full max-w-full break-words overflow-wrap-anywhere";
      }
      return "text-zinc-900 dark:text-zinc-100 w-full max-w-full min-w-0";
    };

    // Extract text content from message
    const textContent = useMemo(() => {
      if (typeof message.content === "string") {
        return message.content;
      }
      
      return message.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("");
    }, [message.content]);

    // Check for mermaid diagrams
    const mermaidBlocks = useMemo(() => {
      const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
      const blocks: string[] = [];
      let match;
      
      while ((match = mermaidRegex.exec(textContent)) !== null) {
        blocks.push(match[1]);
      }
      
      return blocks;
    }, [textContent]);

    // Simple fade animation
    const fadeVariants = {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" }
      },
      exit: { 
        opacity: 0,
        transition: { duration: 0.2 }
      },
    };

    const MotionWrapper = animationsDisabled ? React.Fragment : motion.div;
    const motionProps = animationsDisabled 
      ? {} 
      : {
          variants: fadeVariants,
          initial: "initial",
          animate: "animate",
          exit: "exit",
        };

    return (
      <MotionWrapper {...motionProps}>
        <div className={`mb-4 ${isUser ? "flex justify-end" : "flex justify-start"}`}>
          <div className={getMessageStyles()}>
            {/* Timestamp */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              {formatTime(message.timestamp)}
            </div>

            {/* Reasoning Display */}
            {isAssistant && message.reasoning && (
              <ReasoningDisplay
                reasoning={message.reasoning}
                isComplete={message.isReasoningComplete}
                isStreaming={isStreaming}
              />
            )}

            {/* Message Content */}
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              {isUser ? (
                // User messages: simple text rendering
                <div className="whitespace-pre-wrap break-words">
                  {textContent}
                </div>
              ) : (
                // Assistant messages: full markdown rendering
                <MemoizedMarkdown 
                  content={textContent} 
                  id={message.id}
                  isDark={isDark}
                />
              )}
            </div>

            {/* Mermaid Diagrams */}
            {mermaidBlocks.map((diagramCode, index) => (
              <MermaidDiagram 
                key={`${message.id}-mermaid-${index}`} 
                code={diagramCode} 
              />
            ))}

            {/* Image Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment) => (
                  <MessageImage
                    key={attachment.id}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {/* Generated Image Display */}
            {message.generatedImageUrl && (
              <div className="mt-3">
                <img
                  src={message.generatedImageUrl}
                  alt="Generated image"
                  className="max-w-full max-h-96 rounded-lg shadow-sm object-contain"
                />
              </div>
            )}

            {/* Loading Indicators */}
            {isStreaming && isLastMessage && isAssistant && (
              <TypingIndicator />
            )}

            {message.isGeneratingImage && (
              <div className="mt-2">
                <LoadingIndicator text="Generating image..." />
              </div>
            )}
          </div>
        </div>
      </MotionWrapper>
    );
  }
);

Message.displayName = "Message";

export default Message;