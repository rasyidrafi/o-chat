// Clean Message component with unified markdown processing and performance optimizations
import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import { ChatMessage, MessageAttachment } from "../types/chat";
import { motion, AnimatePresence } from "framer-motion";
import TypingIndicator from "./TypingIndicator";
import ReasoningDisplay from "./ReasoningDisplay";
import { ImageUploadService } from "../services/imageUploadService";
import { ImageGenerationService } from "../services/imageGenerationService";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import { Copy, GitBranch, Edit, Check } from "./Icons";
import { RetryButton, VersionNavigation } from "./ui/RetryButton";
import { themes } from "@/constants/themes";
import "katex/dist/katex.min.css"; // Import KaTeX CSS

// Lazy load heavy dependencies only when needed
let mermaidPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid");
  }
  return mermaidPromise;
};

import { useSettingsContext } from "../contexts/SettingsContext";
import LoadingState from "./ui/LoadingState";

const getImageUrlFromPath = async (gcsPath: string): Promise<string> => {
  try {
    return await ImageUploadService.getImageUrl(gcsPath);
  } catch (error) {
    console.error("Error getting image URL:", error);
    return "";
  }
};

const ImageContentComponent: React.FC<{
  url: string;
  gcsPath?: string;
  attachment?: MessageAttachment;
  isUser?: boolean;
}> = memo(({ url, gcsPath, attachment, isUser = false }) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showExpiredPlaceholder, setShowExpiredPlaceholder] = useState(false);

  // Responsive dimensions for container - use CSS classes instead of fixed dimensions
  const displayDimensions = useMemo(() => {
    return {
      // Use CSS classes for responsive sizing instead of fixed pixel values
      containerClass: isUser
        ? "w-full max-w-full"
        : "w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg",
      aspectRatio: "4/3", // Maintain 4:3 aspect ratio
    };
  }, [isUser]);

  useEffect(() => {
    if (gcsPath && gcsPath !== url) {
      setIsLoading(true);
      getImageUrlFromPath(gcsPath).then((newUrl) => {
        if (newUrl) {
          setCurrentUrl(newUrl);
        }
        setIsLoading(false);
      });
    }
  }, [gcsPath, url]);

  useEffect(() => {
    // setImageLoading(true);
    setImageError(false);
    setShowExpiredPlaceholder(false);
  }, [currentUrl]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);

    if (attachment?.isDirectUrl) {
      setShowExpiredPlaceholder(true);
    }
  }, [attachment?.isDirectUrl]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`bg-dark dark:bg-zinc-800 rounded-lg flex items-center justify-center ${displayDimensions.containerClass}`}
        style={{ aspectRatio: displayDimensions.aspectRatio }}
      >
        <div className="text-zinc-500 text-xs">Loading...</div>
      </div>
    );
  }

  // Expired placeholder
  if (showExpiredPlaceholder) {
    return (
      <div
        className={`bg-[#e3dedb] dark:bg-zinc-800 flex items-center justify-center rounded-lg ${displayDimensions.containerClass}`}
        style={{ aspectRatio: displayDimensions.aspectRatio }}
      >
        <div className="text-zinc-500 text-xs text-center px-2">
          Generated image is no longer available
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg bg-[#e3dedb] dark:bg-black ${displayDimensions.containerClass}`}
      style={{ aspectRatio: displayDimensions.aspectRatio }}
    >
      {/* Loading placeholder */}
      {imageLoading && !imageError && !showExpiredPlaceholder && (
        <div
          className={`absolute inset-0 bg-[#e3dedb] dark:bg-zinc-800 flex items-center justify-center rounded-lg ${displayDimensions.containerClass}`}
        >
          <div className="flex items-center space-x-2 text-zinc-500">
            <div className="w-3 h-3 bg-zinc-400 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-zinc-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-3 h-3 bg-zinc-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {!imageError && !showExpiredPlaceholder ? (
        <img
          src={currentUrl}
          alt={""}
          className={`cursor-pointer hover:opacity-90 transition-opacity object-contain rounded-lg w-full h-full ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          style={{
            position: imageLoading ? "absolute" : "relative",
          }}
          onLoad={() => setImageLoading(false)}
          onError={handleImageError}
          onClick={() => {
            window.open(currentUrl, "_blank");
          }}
          title="Click to view full size"
        />
      ) : imageError && !showExpiredPlaceholder ? (
        <div
          className={`bg-[#e3dedb] dark:bg-zinc-800 flex items-center justify-center rounded-lg ${displayDimensions.containerClass}`}
          style={{ aspectRatio: displayDimensions.aspectRatio }}
        >
          <div className="text-zinc-500 text-xs text-center px-2">
            {gcsPath ? "Error loading image" : "Failed to load image"}
          </div>
        </div>
      ) : null}
    </div>
  );
});

ImageContentComponent.displayName = "ImageContentComponent";

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isLastMessage?: boolean;
  onRetry?: (
    messageId: string,
    model: string,
    source: string,
    providerId?: string
  ) => void;
  onVersionChange?: (messageId: string, versionIndex: number) => void;
  modelOptions?: Array<{
    label: string;
    value: string;
    source: string;
    providerId?: string;
    providerName?: string;
    supported_parameters?: string[];
  }>;
}

// Mermaid diagram component with memoization
const MermaidDiagram: React.FC<{ code: string; isDark: boolean }> = memo(
  ({ code, isDark }) => {
    const [mermaidLib, setMermaidLib] = useState<any>(null);

    useEffect(() => {
      loadMermaid().then((module: any) => {
        setMermaidLib(module.default);
      });
    }, []);

    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = React.useState<string>("");
    const [error, setError] = React.useState<string>("");

    useEffect(() => {
      const renderDiagram = async () => {
        if (!mermaidLib) return;

        try {
          // Initialize mermaid with the current theme
          mermaidLib.initialize({
            startOnLoad: false,
            theme: isDark ? "dark" : "default",
            securityLevel: "loose",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          });

          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg: renderedSvg } = await mermaidLib.render(id, code);
          setSvg(renderedSvg);
          setError("");
        } catch (err) {
          setError("Failed to render Mermaid diagram");
          console.error("Mermaid render error:", err);
        }
      };

      renderDiagram();
    }, [code, mermaidLib, isDark]);

    if (error) {
      if (error == "Failed to render Mermaid diagram") return null;
      return (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-x-auto thin-scrollbar">
            {code}
          </pre>
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
        className="my-4 flex justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg p-4"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
);

MermaidDiagram.displayName = "MermaidDiagram";

const Message: React.FC<MessageProps> = memo(
  ({
    message,
    isStreaming = false,
    onRetry,
    onVersionChange,
    modelOptions = [],
  }) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const [isDark, setIsDark] = useState(false);
    const [copied, setCopied] = useState(false);
    // Removed hover state - buttons always visible now

    // Get animationsDisabled and isMobile from settings context
    const { settings, isMobile } = useSettingsContext();
    const animationsDisabled = settings.animationsDisabled;

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

    // Extract <think> content and clean text content
    const { thinkContent, cleanedContent } = useMemo(() => {
      const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
      let thinkMatches: string[] = [];
      let match;

      // Extract all <think> content
      while ((match = thinkRegex.exec(textContent)) !== null) {
        thinkMatches.push(match[1].trim());
      }

      // Remove <think> tags from content
      const cleaned = textContent.replace(thinkRegex, "").trim();

      return {
        thinkContent: thinkMatches.join("\n\n"),
        cleanedContent: cleaned,
      };
    }, [textContent]);

    // Copy function for messages
    const copyMessageToClipboard = useCallback(async () => {
      try {
        let textToCopy = "";

        if (typeof message.content === "string") {
          // For AI messages, use cleaned content (without <think> tags)
          textToCopy = isUser
            ? message.content
            : cleanedContent || message.content;
        } else {
          // Extract text content from complex content
          textToCopy = message.content
            .filter((item) => item.type === "text")
            .map((item) => {
              // For AI messages, clean <think> tags from text content
              if (!isUser) {
                return item.text
                  .replace(/<think>([\s\S]*?)<\/think>/g, "")
                  .trim();
              }
              return item.text;
            })
            .join("");
        }

        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy message: ", err);
      }
    }, [message.content, isUser, cleanedContent]);

    // For streaming messages, handle real-time <think> processing
    const streamingThinkData = useMemo(() => {
      if (!isStreaming || !textContent) {
        return { streamThinkContent: "", streamCleanedContent: textContent };
      }

      // Check if we're currently inside a <think> block during streaming
      const hasOpenThink = textContent.includes("<think>");
      const hasCloseThink = textContent.includes("</think>");

      if (!hasOpenThink) {
        // No <think> tags at all, show everything as normal content
        return { streamThinkContent: "", streamCleanedContent: textContent };
      }

      if (hasOpenThink && !hasCloseThink) {
        // We're inside an unclosed <think> block during streaming
        const thinkStartIndex = textContent.lastIndexOf("<think>");
        const beforeThink = textContent.substring(0, thinkStartIndex);
        const insideThink = textContent.substring(thinkStartIndex + 7); // 7 = '<think>'.length

        return {
          streamThinkContent: insideThink,
          streamCleanedContent: beforeThink,
        };
      }

      // Has both opening and closing tags, use normal processing
      return {
        streamThinkContent: thinkContent,
        streamCleanedContent: cleanedContent,
      };
    }, [isStreaming, textContent, thinkContent, cleanedContent]);

    // Determine if reasoning content is actively streaming
    const isReasoningStreaming = useMemo(() => {
      if (!isStreaming) {
        // Not streaming at all, so no reasoning streaming
        return false;
      }

      if (message.reasoning && message.reasoning.trim()) {
        return true;
      }

      // Check if we have active streaming think content (unclosed <think> block)
      if (textContent) {
        const hasOpenThink = textContent.includes("<think>");
        const hasCloseThink = textContent.includes("</think>");
        // Reasoning is streaming if we have an open <think> without a close </think>
        return hasOpenThink && !hasCloseThink;
      }

      return false;
    }, [isStreaming, textContent, message.reasoning]);

    // Check for mermaid diagrams
    const mermaidBlocks = useMemo(() => {
      const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
      const blocks: string[] = [];
      let match;

      while ((match = mermaidRegex.exec(cleanedContent)) !== null) {
        blocks.push(match[1]);
      }

      return blocks;
    }, [cleanedContent]);

    // Simple fade animation
    const fadeVariants = {
      initial: {
        opacity: 0,
      },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.2,
        },
      },
    };

    // Format timestamp
    const formatTime = (date: Date) => {
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      // Calculate the difference in days
      const diffTime = today.getTime() - messageDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const timeString = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (diffDays === 0) {
        return `Today at ${timeString}`;
      } else if (diffDays === 1) {
        return `Yesterday at ${timeString}`;
      } else {
        return `${date.toLocaleDateString()} at ${timeString}`;
      }
    };

    // Get message styles
    const getMessageStyles = () => {
      // Check if user message contains image attachments
      const hasImageAttachments =
        isUser &&
        ((message.attachments && message.attachments.length > 0) ||
          (Array.isArray(message.content) &&
            message.content.length > 0 &&
            message.content.some((item) => item.type === "image_url")));

      if (isUser) {
        // For messages with image attachments, use responsive width scaling
        if (hasImageAttachments) {
          return "bg-[#f2eeec] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl px-3 py-[6px] w-[100%] sm:w-[85%] md:w-[75%] lg:w-[50%] border border-[#e7e4e2] dark:border-zinc-700/50 break-words overflow-wrap-anywhere";
        }
        // For text-only messages, keep original styling
        return "bg-[#f2eeec] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl px-3 py-[6px] max-w-[90%] sm:max-w-[85%] md:max-w-[75%] border border-[#e7e4e2] dark:border-zinc-700/50 break-words overflow-wrap-anywhere";
      }
      if (message.isError && !message.errorMessage) {
        // Only apply error styling for legacy errors without errorMessage
        return "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl px-3 py-[6px] w-full max-w-full break-words overflow-wrap-anywhere";
      }
      return "text-zinc-900 dark:text-zinc-100 w-full max-w-full min-w-0";
    };

    const renderContent = () => {
      // Handle image generation messages
      if (message.messageType === "image_generation") {
        if (isUser) {
          return (
            <div>
              <div className={`text-xs my-1 ${themes.sidebar.fg}`}>
                Image{" "}
                {Boolean(message.attachments && message.attachments.length > 0)
                  ? "Editing"
                  : "Generation"}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {typeof message.content === "string"
                  ? message.content
                  : message.content.find((item) => item.type === "text")
                      ?.text || ""}
              </div>

              {/* Display input image for editing if attachments exist */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2 py-2">
                  {message.attachments.map((attachment, index) => (
                    <ImageContentComponent
                      key={index}
                      url={attachment.url}
                      gcsPath={attachment.gcsPath}
                      attachment={attachment}
                      isUser={isUser}
                    />
                  ))}
                </div>
              )}

              {message.imageGenerationParams && (
                <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
                  {/* Hide size for user messages since it's generation size, not original image size */}
                  {message.imageGenerationParams.seed !== undefined &&
                    message.imageGenerationParams.seed !== -1 && (
                      <div>Seed: {message.imageGenerationParams.seed}</div>
                    )}
                  {message.imageGenerationParams.guidance_scale && (
                    <div>
                      Guidance Scale:{" "}
                      {message.imageGenerationParams.guidance_scale}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="space-y-3">
              <div className="text-sm leading-relaxed">
                {typeof message.content === "string"
                  ? message.content
                  : message.content.find((item) => item.type === "text")
                      ?.text || "Generated image"}
              </div>
              {message.isGeneratingImage && message.imageGenerationParams ? (
                <div className="max-w-md">
                  {(() => {
                    const dimensions =
                      ImageGenerationService.calculatePlaceholderDimensions(
                        message.imageGenerationParams.size || "1024x1024",
                        320
                      );

                    const isAsyncJob = message.isAsyncImageGeneration;
                    const job = message.imageGenerationJob;

                    // Check if non-async job has timed out (more than 1 hour)
                    const messageAge = Date.now() - message.timestamp.getTime();
                    const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
                    const hasTimedOut = !isAsyncJob && messageAge > oneHourInMs;

                    if (hasTimedOut) {
                      // Show timeout error state instead of loading
                      return (
                        <div
                          className="bg-[#e3dedb] dark:bg-zinc-800 flex items-center justify-center rounded-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                          style={{
                            aspectRatio: dimensions.aspectRatio,
                          }}
                        >
                          <div className="text-zinc-500 text-xs text-center px-2">
                            {isAsyncJob
                              ? "Async job timed out"
                              : "Image generation timed out"}
                          </div>
                        </div>
                      );
                    }

                    let loadingText = "Generating image...";

                    if (isAsyncJob && job) {
                      switch (job.status) {
                        case "CREATED":
                          loadingText = "Creating image generation job...";
                          break;
                        case "WAITING":
                          if (job.info?.queueRank && job.info?.queueLen) {
                            loadingText = `You are on queue ${job.info.queueRank} of ${job.info.queueLen}`;
                          } else {
                            loadingText = "Waiting in queue...";
                          }
                          break;
                        case "RUNNING":
                          loadingText = "Generating...";
                          break;
                        default:
                          loadingText = "Processing...";
                      }
                    }

                    return (
                      <div
                        className="bg-[#e3dedb] dark:bg-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                        style={{
                          aspectRatio: dimensions.aspectRatio,
                        }}
                      >
                        {/* Shimmer effect background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]"></div>

                        {/* Loading content */}
                        <div className="flex flex-col items-center space-y-3 text-zinc-500 dark:text-zinc-400 z-10">
                          <LoadingState size="md" message="" />
                          <div className="text-xs text-center px-4">
                            <div>{loadingText}</div>
                            {isAsyncJob && (
                              <div className="mt-1 text-zinc-400 dark:text-zinc-500">
                                You can leave this page and come back later
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : message.generatedImageUrl ||
                (message.attachments && message.attachments.length > 0) ? (
                <div className="max-w-md">
                  <ImageContentComponent
                    url={
                      message.generatedImageUrl ||
                      message.attachments?.[0]?.url ||
                      ""
                    }
                    gcsPath={message.attachments?.[0]?.gcsPath}
                    attachment={message.attachments?.[0]}
                    isUser={isUser}
                  />
                </div>
              ) : null}
              {(message.generatedImageUrl ||
                (message.attachments && message.attachments.length > 0)) && (
                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                  Image will be expired after several hours.
                </div>
              )}

              {/* Model name and timestamp for AI image generation responses */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                {/* Timestamp and model name - always visible */}
                <div className="flex items-center mb-3">
                  <span>{formatTime(message.timestamp)}</span>
                  {(message.model || message.modelName) && isAssistant && (
                    <>
                      <span className="ml-2">•</span>
                      <span className="ml-2">
                        {message.modelName || message.model}
                      </span>
                    </>
                  )}
                </div>

                {/* Action buttons below - show/hide on hover */}
                <motion.div
                  variants={
                    !animationsDisabled
                      ? {
                          hidden: { opacity: 0 },
                          visible: { opacity: 1 },
                        }
                      : {}
                  }
                  initial={
                    !animationsDisabled ? (isMobile ? "visible" : "hidden") : {}
                  }
                  animate={!animationsDisabled ? "visible" : {}}
                  transition={
                    !animationsDisabled
                      ? { duration: 0.2, ease: "easeInOut" }
                      : {}
                  }
                  className="flex items-center gap-2 mt-1"
                  style={
                    animationsDisabled
                      ? {
                          opacity: 1,
                          transition: "opacity 0.2s ease-in-out",
                        }
                      : {}
                  }
                >
                  {/* Version Navigation */}
                  {message.totalVersions && message.totalVersions > 1 && (
                    <VersionNavigation
                      currentVersion={message.currentVersionIndex || 0}
                      totalVersions={message.totalVersions}
                      onVersionChange={(version: number) =>
                        onVersionChange?.(
                          message.originalMessageId ||
                            message.parentMessageId ||
                            message.id,
                          version
                        )
                      }
                      disabled={isStreaming}
                    />
                  )}

                  {/* Retry button */}
                  {onRetry && modelOptions.length > 0 && (
                    <RetryButton
                      onRetry={(
                        model: string,
                        source: string,
                        providerId?: string
                      ) => onRetry(message.id, model, source, providerId)}
                      modelOptions={modelOptions}
                      disabled={
                        isStreaming ||
                        !!(
                          message.isGeneratingImage ||
                          message.generatedImageUrl ||
                          message.imageGenerationParams
                        )
                      }
                      currentModel={message.model}
                      currentSource={message.providerId ? "custom" : "system"}
                      currentProviderId={message.providerId}
                    />
                  )}

                  {/* Copy button */}
                  <button
                    onClick={copyMessageToClipboard}
                    disabled={
                      !!(
                        message.isGeneratingImage ||
                        message.generatedImageUrl ||
                        message.imageGenerationParams ||
                        message.isError
                      )
                    }
                    className={`p-1.5 rounded transition-colors ${
                      message.isGeneratingImage ||
                      message.generatedImageUrl ||
                      message.imageGenerationParams ||
                      message.isError
                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    }`}
                    title={
                      message.isError
                        ? "Copy not available when there's an error"
                        : message.isGeneratingImage ||
                          message.generatedImageUrl ||
                          message.imageGenerationParams
                        ? "Copy not available for image generation"
                        : copied
                        ? "Copied!"
                        : "Copy message"
                    }
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </motion.div>
              </div>
            </div>
          );
        }
      }

      if (isUser) {
        // Handle user messages with potentially complex content
        if (typeof message.content === "string") {
          return (
            <div>
              {/* Show thinking content for user messages if present */}
              {thinkContent && (
                <motion.div
                  variants={fadeVariants}
                  initial={animationsDisabled ? {} : "initial"}
                  animate="animate"
                  className="mb-3"
                >
                  <ReasoningDisplay
                    reasoning=""
                    thinkContent={thinkContent}
                    isStreaming={false}
                  />
                </motion.div>
              )}
              <motion.div
                variants={fadeVariants}
                initial={animationsDisabled ? {} : "initial"}
                animate="animate"
                className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
              >
                {cleanedContent || message.content}
              </motion.div>
            </div>
          );
        } else {
          // Handle complex content with text and images
          return (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="space-y-2 flex flex-col pb-2"
            >
              {/* Show thinking content for user messages if present */}
              {thinkContent && (
                <ReasoningDisplay
                  reasoning=""
                  thinkContent={thinkContent}
                  isStreaming={false}
                />
              )}
              {message.content.map((item, index) => {
                if (item.type === "text") {
                  // Clean <think> tags from text content for user messages too
                  const userCleanedText = item.text
                    .replace(/<think>([\s\S]*?)<\/think>/g, "")
                    .trim();
                  return (
                    <div
                      key={index}
                      className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
                    >
                      {userCleanedText || item.text}
                    </div>
                  );
                } else if (item.type === "image_url") {
                  // Find matching attachment for GCS path
                  const attachment = message.attachments?.find(
                    (att) => att.url === item.image_url.url
                  );

                  return (
                    <ImageContentComponent
                      key={index}
                      url={item.image_url.url}
                      gcsPath={attachment?.gcsPath}
                      attachment={attachment}
                      isUser={isUser}
                    />
                  );
                }
                return null;
              })}
            </motion.div>
          );
        }
      }

      return (
        <div className="space-y-3 w-full max-w-full min-w-0">
          <motion.div
            variants={fadeVariants}
            initial={animationsDisabled ? {} : "initial"}
            animate="animate"
          >
            <ReasoningDisplay
              reasoning={message.reasoning || ""}
              thinkContent={
                isStreaming
                  ? streamingThinkData.streamThinkContent
                  : thinkContent
              }
              isStreaming={isReasoningStreaming}
            />
          </motion.div>

          {/* Show typing indicator ONLY for new empty AI messages that aren't streaming yet */}
          {!isUser &&
          !message.isError &&
          (!message.content || message.content === "") &&
          !isStreaming ? (
            (() => {
              // Check if AI response message has timed out (more than 5 minutes)
              const messageAge = Date.now() - message.timestamp.getTime();
              const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds
              const hasTimedOut = messageAge > fiveMinutesInMs;

              if (hasTimedOut) {
                // Show timeout error state instead of typing indicator
                return (
                  <motion.div
                    variants={fadeVariants}
                    initial={animationsDisabled ? {} : "initial"}
                    animate="animate"
                    className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
                  >
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl px-3 py-[6px] max-w-[90%] sm:max-w-[85%] md:max-w-[75%] break-words overflow-wrap-anywhere">
                      Response timeout - The AI took too long to respond
                    </div>
                  </motion.div>
                );
              }

              // Show normal typing indicator
              return (
                <motion.div
                  variants={fadeVariants}
                  initial={animationsDisabled ? {} : "initial"}
                  animate="animate"
                  className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
                >
                  <div className="mt-4 flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                    <TypingIndicator />
                  </div>
                </motion.div>
              );
            })()
          ) : (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
            >
              <div className={isStreaming && !isUser ? "" : "space-y-3"}>
                {/* Assistant messages: full markdown rendering */}
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <MemoizedMarkdown
                    content={
                      isStreaming
                        ? streamingThinkData.streamCleanedContent
                        : cleanedContent
                    }
                    id={message.id}
                    isDark={isDark}
                  />
                </div>

                {/* Mermaid Diagrams */}
                {mermaidBlocks.map((diagramCode, index) => (
                  <MermaidDiagram
                    key={`${message.id}-mermaid-${index}`}
                    code={diagramCode}
                    isDark={isDark}
                  />
                ))}

                {/* Show typing indicator at the end when streaming with content */}
                {isStreaming &&
                  !isUser &&
                  (() => {
                    // Check if streaming AI response message has timed out (more than 5 minutes)
                    const messageAge = Date.now() - message.timestamp.getTime();
                    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds
                    const hasTimedOut = messageAge > fiveMinutesInMs;

                    if (hasTimedOut) {
                      // Show timeout error instead of typing indicator
                      return (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="text-sm text-red-800 dark:text-red-200">
                            Response timeout - The AI took too long to respond
                            (over 5 minutes)
                          </div>
                        </div>
                      );
                    }

                    // Show normal typing indicator during streaming
                    return (
                      <div className="mt-4 flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                        <TypingIndicator />
                      </div>
                    );
                  })()}

                {/* Show error message below incomplete content */}
                {message.isError && message.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 text-red-500 mt-0.5">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-red-800 dark:text-red-200">
                        <div className="font-medium">
                          Error occurred during streaming
                        </div>
                        <div className="mt-1 text-red-700 dark:text-red-300">
                          {message.errorMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model name and timestamp for AI responses - only show when streaming is complete */}
                {!isUser && !isStreaming && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                    {/* Timestamp and model name - always visible */}
                    <div className="flex items-center mb-3">
                      <span>{formatTime(message.timestamp)}</span>
                      {(message.model || message.modelName) && isAssistant && (
                        <>
                          <span className="ml-2">•</span>
                          <span className="ml-2">
                            {message.modelName || message.model}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action buttons below - show/hide on hover */}
                    <motion.div
                      variants={
                        !animationsDisabled
                          ? {
                              hidden: { opacity: 0 },
                              visible: { opacity: 1 },
                            }
                          : {}
                      }
                      initial={
                        !animationsDisabled
                          ? isMobile
                            ? "visible"
                            : "hidden"
                          : {}
                      }
                      animate={!animationsDisabled ? "visible" : {}}
                      transition={
                        !animationsDisabled
                          ? { duration: 0.2, ease: "easeInOut" }
                          : {}
                      }
                      className="flex items-center gap-2 mt-1"
                      style={
                        animationsDisabled
                          ? {
                              opacity: 1,
                              transition: "opacity 0.2s ease-in-out",
                            }
                          : {}
                      }
                    >
                      {/* Version Navigation */}
                      {message.totalVersions && message.totalVersions > 1 && (
                        <VersionNavigation
                          currentVersion={message.currentVersionIndex || 0}
                          totalVersions={message.totalVersions}
                          onVersionChange={(version: number) =>
                            onVersionChange?.(
                              message.originalMessageId ||
                                message.parentMessageId ||
                                message.id,
                              version
                            )
                          }
                          disabled={isStreaming}
                        />
                      )}

                      {/* Retry button */}
                      {onRetry && modelOptions.length > 0 && (
                        <RetryButton
                          onRetry={(
                            model: string,
                            source: string,
                            providerId?: string
                          ) => onRetry(message.id, model, source, providerId)}
                          modelOptions={modelOptions}
                          disabled={
                            isStreaming ||
                            !!(
                              message.isGeneratingImage ||
                              message.generatedImageUrl ||
                              message.imageGenerationParams
                            )
                          }
                          currentModel={message.model}
                          currentSource={
                            message.providerId ? "custom" : "system"
                          }
                          currentProviderId={message.providerId}
                        />
                      )}

                      {/* Copy button */}
                      <button
                        onClick={copyMessageToClipboard}
                        disabled={
                          !!(
                            message.isGeneratingImage ||
                            message.generatedImageUrl ||
                            message.imageGenerationParams ||
                            message.isError
                          )
                        }
                        className={`p-1.5 rounded transition-colors ${
                          message.isGeneratingImage ||
                          message.generatedImageUrl ||
                          message.imageGenerationParams ||
                          message.isError
                            ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                        }`}
                        title={
                          message.isError
                            ? "Copy not available when there's an error"
                            : message.isGeneratingImage ||
                              message.generatedImageUrl ||
                              message.imageGenerationParams
                            ? "Copy not available for image generation"
                            : copied
                            ? "Copied!"
                            : "Copy message"
                        }
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      );
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`message-${message.id || message.timestamp.getTime()}`}
          variants={fadeVariants}
          initial={animationsDisabled ? {} : "initial"}
          animate="animate"
          exit={animationsDisabled ? {} : "exit"}
          className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
        >
          <div
            className={`flex flex-col w-full ${
              isUser
                ? "max-w-full items-end mt-4 pb-4"
                : "max-w-full items-start min-w-0"
            }`}
          >
            <div className={getMessageStyles()}>{renderContent()}</div>

            {/* Timestamp for user messages - responsive display with hover on desktop */}
            {isUser && (
              <motion.div
                variants={
                  !animationsDisabled
                    ? {
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 },
                      }
                    : {}
                }
                initial={
                  !animationsDisabled ? (isMobile ? "visible" : "hidden") : {}
                }
                animate={!animationsDisabled ? "visible" : {}}
                transition={
                  !animationsDisabled
                    ? { duration: 0.2, ease: "easeInOut" }
                    : {}
                }
                className="text-xs text-zinc-500 dark:text-zinc-400 text-right mt-2 flex items-center justify-end gap-2"
                style={
                  animationsDisabled
                    ? {
                        opacity: 1,
                        pointerEvents: "auto",
                        transition: "opacity 0.2s ease-in-out",
                      }
                    : {}
                }
              >
                {/* Action buttons */}
                <motion.div
                  variants={
                    !animationsDisabled
                      ? {
                          hidden: { opacity: 0 },
                          visible: { opacity: 1 },
                        }
                      : {}
                  }
                  initial={
                    !animationsDisabled ? (isMobile ? "visible" : "hidden") : {}
                  }
                  animate={!animationsDisabled ? "visible" : {}}
                  transition={
                    !animationsDisabled
                      ? { duration: 0.2, ease: "easeInOut" }
                      : {}
                  }
                  className="flex items-center gap-2"
                  style={
                    animationsDisabled
                      ? {
                          opacity: 1,
                          transition: "opacity 0.2s ease-in-out",
                        }
                      : {}
                  }
                >
                  {/* Version Navigation */}
                  {message.totalVersions && message.totalVersions > 1 && (
                    <VersionNavigation
                      currentVersion={message.currentVersionIndex || 0}
                      totalVersions={message.totalVersions}
                      onVersionChange={(version: number) =>
                        onVersionChange?.(
                          message.originalMessageId ||
                            message.parentMessageId ||
                            message.id,
                          version
                        )
                      }
                      disabled={isStreaming}
                    />
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => {
                      /* TODO: Implement edit */
                    }}
                    disabled={message.messageType === "image_generation"}
                    className={`p-1.5 rounded transition-colors ${
                      message.messageType === "image_generation"
                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    }`}
                    title={
                      message.messageType === "image_generation"
                        ? "Edit not available for image generation"
                        : "Edit message"
                    }
                  >
                    <Edit size={14} />
                  </button>

                  {/* Copy button */}
                  <button
                    onClick={copyMessageToClipboard}
                    className="p-1.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                    title={copied ? "Copied!" : "Copy message"}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </motion.div>

                <span className="">•</span>
                {/* Timestamp */}
                <span>{formatTime(message.timestamp)}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

Message.displayName = "Message";

export default Message;
