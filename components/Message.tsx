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
import HorizontalRule from "./ui/HorizontalRule";
import * as prod from "react/jsx-runtime";
import { ImageUploadService } from "../services/imageUploadService";
import { ImageGenerationService } from "../services/imageGenerationService";
import LoadingIndicator from "./ui/LoadingIndicator";
import "katex/dist/katex.min.css"; // Import KaTeX CSS

// Lazy load heavy dependencies only when needed
let mermaidPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid");
  }
  return mermaidPromise;
};

// Import the new Shiki-based Codeblock component
import { Codeblock } from "./Codeblock";
import { useSettingsContext } from "../contexts/SettingsContext";

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
    setImageLoading(true);
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
        className={`bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center ${displayDimensions.containerClass}`}
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
        className={`bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-lg ${displayDimensions.containerClass}`}
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
      className={`relative flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-black ${displayDimensions.containerClass}`}
      style={{ aspectRatio: displayDimensions.aspectRatio }}
    >
      {/* Loading placeholder */}
      {imageLoading && !imageError && !showExpiredPlaceholder && (
        <div
          className={`absolute inset-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-lg ${displayDimensions.containerClass}`}
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
          className={`bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-lg ${displayDimensions.containerClass}`}
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
}

// Custom components for rehype-react
const MarkdownComponents = {
  // Custom component for Mermaid diagrams
  pre: ({ children, ...props }: any) => {
    const codeElement = React.Children.only(children);
    const className = codeElement.props.className || "";

    if (className.includes("language-mermaid")) {
      return <MermaidDiagram code={codeElement.props.children} />;
    }

    return <pre {...props}>{children}</pre>;
  },

  // Custom styling for various elements
  p: ({ children, ...props }: any) => (
    <p className="mb-2 last:mb-0 leading-relaxed items-center" {...props}>
      {children}
    </p>
  ),

  ul: ({ children, ...props }: any) => (
    <ul className="mb-2 last:mb-0 pl-4 space-y-1" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: any) => (
    <ol className="mb-2 last:mb-0 pl-4 space-y-1 list-disc" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }: any) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),

  h1: ({ children, ...props }: any) => (
    <h1 className="text-lg font-semibold mb-3 mt-4 first:mt-0" {...props}>
      {children}
    </h1>
  ),

  h2: ({ children, ...props }: any) => (
    <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h2>
  ),

  h3: ({ children, ...props }: any) => (
    <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h3>
  ),

  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic my-3 text-zinc-700 dark:text-zinc-300"
      {...props}
    >
      {children}
    </blockquote>
  ),

  code: ({ children, className, ...props }: any) => {
    const text = String(children);

    // If there's a className (language specified), always render as code block
    if (className) {
      return (
        <Codeblock className={className} {...props}>
          {children}
        </Codeblock>
      );
    }

    // For inline code without language specification
    // Check if it's single line first
    const hasNewlines = text.includes("\n");

    if (!hasNewlines) {
      // Single-line inline code -> render as regular inline code
      return (
        <code
          className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Multi-line regular code -> render as code block
    return (
      <Codeblock {...props}>
        {children}
      </Codeblock>
    );
  },

  // Table components for GFM - Restored original responsive design
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4 border border-zinc-300 dark:border-zinc-600 rounded-lg">
      <table className="min-w-full text-xs sm:text-sm" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: any) => (
    <thead className="bg-zinc-100 dark:bg-zinc-800" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,

  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-zinc-200 dark:border-zinc-700" {...props}>
      {children}
    </tr>
  ),

  th: ({ children, ...props }: any) => (
    <th
      className="px-2 py-2 text-center font-semibold text-xs sm:text-sm border-r border-zinc-300 dark:border-zinc-600 last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }: any) => {
    return (
      <td
        className="px-2 py-2 text-xs sm:text-sm border-r border-zinc-300 dark:border-zinc-600 last:border-r-0"
        {...props}
      >
        {children}
      </td>
    );
  },

  // Strikethrough support for GFM
  del: ({ children, ...props }: any) => (
    <del className="line-through text-zinc-500 dark:text-zinc-400" {...props}>
      {children}
    </del>
  ),

  // Task list support
  input: ({ type, checked, disabled, ...props }: any) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="mr-2 rounded"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },

  // Custom horizontal rule
  hr: (props: any) => <HorizontalRule {...props} />, // Use extracted component

  // Custom span for KaTeX inline math
  span: ({ className, children, ...props }: any) => {
    if (
      className &&
      (className.includes("katex") || className.includes("math-inline"))
    ) {
      return (
        <span className={`katex-container ${className || ""}`} {...props}>
          {children}
        </span>
      );
    }
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  },

  // Custom div for KaTeX display math
  div: ({ className, children, ...props }: any) => {
    if (
      className &&
      (className.includes("katex-display") ||
        className.includes("math-display"))
    ) {
      return (
        <div className={`katex-container ${className || ""}`} {...props}>
          {children}
        </div>
      );
    }
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  },
};

// Mermaid diagram component with memoization
const MermaidDiagram: React.FC<{ code: string }> = memo(({ code }) => {
  const [mermaidLib, setMermaidLib] = useState<any>(null);

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

  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidLib) return;

      try {
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
  }, [code, mermaidLib]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-x-auto">
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
      className="my-4 flex justify-center bg-white dark:bg-zinc-900 rounded-lg p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

MermaidDiagram.displayName = "MermaidDiagram";
const createMarkdownProcessor = () =>
  Promise.all([
    import("unified"),
    import("remark-parse"),
    import("remark-gfm"),
    import("remark-math"),
    import("remark-rehype"),
    import("rehype-katex"),
    import("rehype-react"),
  ]).then(
    ([
      unified,
      remarkParse,
      remarkGfm,
      remarkMath,
      remarkRehype,
      rehypeKatex,
      rehypeReactModule,
    ]) => {
      return {
        processor: unified
          .unified()
          .use(remarkParse.default)
          .use(remarkGfm.default)
          .use(remarkMath.default) // This processes $...$ and $$...$$
          .use(remarkRehype.default, { allowDangerousHtml: true })
          .use(rehypeKatex.default) // This renders the math
          .use(rehypeReactModule.default, {
            ...prod,
            components: MarkdownComponents,
          }),
      };
    }
  );

const Message: React.FC<MessageProps> = memo(
  ({
    message,
    isStreaming = false,
    isLastMessage = false,
  }) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const [processor, setProcessor] = useState<any>(null);
    const [isProcessorReady, setIsProcessorReady] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false);
    
    // Get animationsDisabled from settings context
    const { settings } = useSettingsContext();
    const animationsDisabled = settings.animationsDisabled;

    // Memoized markdown processor creation
    const createProcessorMemo = useMemo(() => {
      if (isUser) return null;
      return createMarkdownProcessor();
    }, [isUser]);

    // Load markdown processor lazily with memoization
    useEffect(() => {
      if (!isUser && !processor && createProcessorMemo) {
        createProcessorMemo.then(({ processor: markdownProcessor }) => {
          setProcessor(markdownProcessor);
          setIsProcessorReady(true);
        });
      } else if (isUser) {
        setIsProcessorReady(true);
      }
    }, [isUser, processor, createProcessorMemo]);

    // Set content ready when processor is ready or for user messages
    useEffect(() => {
      if (isProcessorReady) {
        const timer = setTimeout(() => {
          setIsContentReady(true);
        }, 50);

        return () => {
          clearTimeout(timer);
        };
      }
    }, [isProcessorReady]);

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

    const formatTime = (date: Date) => {
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffInHours < 48) {
        return `Yesterday ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else {
        return `${date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    };

    const getMessageStyles = () => {
      if (isUser) {
        return "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl px-4 py-3 max-w-[95%] sm:max-w-[85%] md:max-w-[75%] border border-zinc-300/50 dark:border-zinc-700/50 break-words overflow-wrap-anywhere";
      }
      if (message.isError) {
        return "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3 w-full max-w-full break-words overflow-wrap-anywhere";
      }
      return "text-zinc-900 dark:text-zinc-100 w-full max-w-full min-w-0";
    };

    // Memoized content processing with stable dependencies
    const processedContent = useMemo(() => {
      if (isUser || !message.content || !processor || !isProcessorReady)
        return null;

      const preProcessLatex = (text: string) => {
        // Step 1: Unicode sanitization
        let processedText = text
          .replace(/[\u00A0\u200B-\u200F\u202F\u205F\u3000]/g, " ")
          .replace(/[\u2010-\u2015\u2212]/g, "-")
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"');

        // Step 2: Handle LaTeX delimiters properly - FIXED VERSION
        // Convert display math \[...\] to $$...$$ (non-greedy match)
        processedText = processedText.replace(
          /\\\[([\s\S]*?)\\\]/g,
          (_match, content) => {
            return `$$${content}$$`;
          }
        );

        // Convert inline math \(...\) to $...$ (non-greedy match)
        processedText = processedText.replace(
          /\\\(([\s\S]*?)\\\)/g,
          (_match, content) => {
            return `$${content}$`;
          }
        );

        return processedText;
      };

      try {
        if (typeof message.content === "string") {
          const preProcessedContent = preProcessLatex(message.content);
          const result = processor.processSync(preProcessedContent);
          return result.result as React.ReactElement;
        }
        return null;
      } catch (error) {
        console.error("Markdown processing error:", error);
        if (typeof message.content === "string") {
          return (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
              {message.content}
            </div>
          );
        }
        return null;
      }
    }, [message.content, processor, isUser, isProcessorReady]);

    const renderContent = () => {
      // Handle image generation messages
      if (message.messageType === "image_generation") {
        if (isUser) {
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Image Generation Request:</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {typeof message.content === "string"
                  ? message.content
                  : message.content.find((item) => item.type === "text")
                      ?.text || ""}
              </div>

              {/* Display input image for editing if attachments exist */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    Input image for editing:
                  </div>
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
                        className="bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={{
                          width: dimensions.width,
                          height: dimensions.height,
                          aspectRatio: dimensions.aspectRatio,
                        }}
                      >
                        {/* Shimmer effect background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]"></div>

                        {/* Loading content */}
                        <div className="flex flex-col items-center space-y-3 text-zinc-500 dark:text-zinc-400 z-10">
                          <LoadingIndicator size="md" color="primary" />
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
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  Image will be expired after several hours.
                </div>
              )}

              {/* Model name and timestamp for AI image generation responses */}
              <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                {formatTime(message.timestamp)}
                {(message.model || message.modelName) && isAssistant && (
                  <>
                    <span className="ml-2">•</span>
                    <span className="ml-2">
                      {message.modelName || message.model}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        }
      }

      if (isUser) {
        // Handle user messages with potentially complex content
        if (typeof message.content === "string") {
          return (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
            >
              {message.content}
            </motion.div>
          );
        } else {
          // Handle complex content with text and images
          return (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="space-y-2 flex flex-col"
            >
              {message.content.map((item, index) => {
                if (item.type === "text") {
                  return (
                    <div
                      key={index}
                      className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
                    >
                      {item.text}
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
              isReasoningComplete={message.isReasoningComplete || false}
              isStreaming={isStreaming}
            />
          </motion.div>

          {/* Show typing indicator ONLY for new empty AI messages that aren't streaming yet */}
          {!isUser &&
          !message.isError &&
          (!message.content || message.content === "") &&
          !isStreaming ? (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
            >
              <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                <TypingIndicator />
              </div>
            </motion.div>
          ) : !isContentReady ? (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
            >
              <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span>Processing...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
            >
              <div className="space-y-3">
                {processedContent}

                {/* Show typing indicator at the end when streaming with content */}
                {isStreaming && !isUser && (
                  <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                    <TypingIndicator />
                  </div>
                )}

                {/* Model name and timestamp for AI responses - only show when streaming is complete and content is ready */}
                {!isUser &&
                  !isStreaming &&
                  isContentReady &&
                  processedContent && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                      {formatTime(message.timestamp)}
                      {(message.model || message.modelName) && isAssistant && (
                        <>
                          <span className="ml-2">•</span>
                          <span className="ml-2">
                            {message.modelName || message.model}
                          </span>
                        </>
                      )}
                      {/* AI disclaimer for last message */}
                      {isLastMessage && !message.isError && (
                        <div className="mt-4 md:mt-2 mb-0 sm:mb-4 text-zinc-400 dark:text-zinc-500 text-xs text-right">
                          AI can make mistakes. Please verify important
                          information.
                        </div>
                      )}
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
            className={`mt-4 flex flex-col w-full ${
              isUser ? "max-w-full items-end" : "max-w-full items-start min-w-0"
            }`}
          >
            <div className={getMessageStyles()}>{renderContent()}</div>

            <motion.div
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className={`text-xs text-zinc-500 dark:text-zinc-400 ${
                isUser ? "text-right mt-2" : "text-left mt-4"
              }`}
            >
              {/* Only show timestamp and model for user messages, AI messages have it inside renderContent */}
              {isUser && (
                <>
                  {formatTime(message.timestamp)}
                  {(message.model || message.modelName) && isAssistant && (
                    <>
                      <span className="ml-2">•</span>
                      <span className="ml-2">
                        {message.modelName || message.model}
                      </span>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

Message.displayName = "Message";

export default Message;
