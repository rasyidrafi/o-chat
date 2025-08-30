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

// highlight.js imports
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import markdown from "highlight.js/lib/languages/markdown";

// Register languages you want to support
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("markdown", markdown);

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
  alt?: string;
  gcsPath?: string;
  attachment?: MessageAttachment;
}> = memo(({ url, alt = "Uploaded image", gcsPath, attachment }) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showExpiredPlaceholder, setShowExpiredPlaceholder] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Max dimensions for container
  const maxWidth = 320;
  const maxHeight = 240;

  // Calculate display dimensions based on natural image dimensions
  const displayDimensions = useMemo(() => {
    if (!naturalDimensions) {
      // Fallback dimensions while loading - use full container size
      return {
        width: maxWidth,
        height: maxHeight,
        containerWidth: maxWidth,
        containerHeight: maxHeight,
        fillsContainer: true,
      };
    }

    const { width: naturalWidth, height: naturalHeight } = naturalDimensions;
    const aspectRatio = naturalWidth / naturalHeight;

    // Calculate dimensions that fit within max constraints while maintaining aspect ratio
    let displayWidth = naturalWidth;
    let displayHeight = naturalHeight;

    // Scale down if image is too large
    if (displayWidth > maxWidth) {
      displayWidth = maxWidth;
      displayHeight = displayWidth / aspectRatio;
    }

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }

    const finalWidth = Math.round(displayWidth);
    const finalHeight = Math.round(displayHeight);

    // Check if image fills the entire container (no black borders)
    const fillsContainer = finalWidth === maxWidth && finalHeight === maxHeight;

    return {
      width: finalWidth,
      height: finalHeight,
      containerWidth: maxWidth,
      containerHeight: maxHeight,
      fillsContainer,
    };
  }, [naturalDimensions, maxWidth, maxHeight]);

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

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      setNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setImageLoading(false);
    },
    []
  );

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
        className="bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center"
        style={{
          width: `${displayDimensions.containerWidth}px`,
          height: `${displayDimensions.containerHeight}px`,
          minWidth: `${displayDimensions.containerWidth}px`,
          minHeight: `${displayDimensions.containerHeight}px`,
        }}
      >
        <div className="text-zinc-500 text-xs">Loading...</div>
      </div>
    );
  }

  // Expired placeholder
  if (showExpiredPlaceholder) {
    return (
      <div
        className="bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-lg"
        style={{
          width: `${displayDimensions.containerWidth}px`,
          height: `${displayDimensions.containerHeight}px`,
          minWidth: `${displayDimensions.containerWidth}px`,
          minHeight: `${displayDimensions.containerHeight}px`,
        }}
      >
        <div className="text-zinc-500 text-xs text-center px-2">
          Generated image is no longer available
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-black"
      style={{
        width: `${displayDimensions.containerWidth}px`,
        height: `${displayDimensions.containerHeight}px`,
        minWidth: `${displayDimensions.containerWidth}px`,
        minHeight: `${displayDimensions.containerHeight}px`,
      }}
    >
      {/* Loading placeholder */}
      {imageLoading && !imageError && !showExpiredPlaceholder && (
        <div
          className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-lg"
          style={{
            minWidth: `${displayDimensions.containerWidth}px`,
            minHeight: `${displayDimensions.containerHeight}px`,
          }}
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
          alt={alt}
          className={`cursor-pointer hover:opacity-90 transition-opacity object-contain ${
            displayDimensions.fillsContainer ? "rounded-lg" : ""
          } ${imageLoading ? "opacity-0" : "opacity-100"}`}
          style={{
            width: `${displayDimensions.width}px`,
            height: `${displayDimensions.height}px`,
            maxWidth: `${displayDimensions.containerWidth}px`,
            maxHeight: `${displayDimensions.containerHeight}px`,
            position: imageLoading ? "absolute" : "relative",
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => {
            window.open(currentUrl, "_blank");
          }}
          title="Click to view full size"
        />
      ) : imageError && !showExpiredPlaceholder ? (
        <div
          className="bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-lg"
          style={{
            width: `${displayDimensions.containerWidth}px`,
            height: `${displayDimensions.containerHeight}px`,
            minWidth: `${displayDimensions.containerWidth}px`,
            minHeight: `${displayDimensions.containerHeight}px`,
          }}
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
  animationsDisabled: boolean;
}

const CodeBlock: React.FC<{
  children: string;
  className?: string;
  forceAscii?: boolean;
  isInlineMultiLine?: boolean;
}> = memo(
  ({ children, className, forceAscii = false, isInlineMultiLine = false }) => {
    const [copied, setCopied] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [viewMode, setViewMode] = useState<"code" | "ascii">(
      forceAscii ? "ascii" : "code"
    );
    const [isWrapped, setIsWrapped] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    // Check if it's a single line inline code (no newlines and no language)
    const isSingleLineInline =
      !className && !isInlineMultiLine && !children.includes("\n");

    // Show header for everything EXCEPT single line inline code
    const showHeader = !isSingleLineInline;

    // Handle view mode changes (simplified since AnimatePresence handles transitions)
    const handleViewModeChange = useCallback(
      (newMode: "code" | "ascii") => {
        if (newMode === viewMode) return;
        setViewMode(newMode);
      },
      [viewMode]
    );

    // Dynamically load highlight.js theme based on isDark
    useEffect(() => {
      const darkHref =
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.0/styles/panda-syntax-dark.min.css";
      const lightHref =
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.0/styles/panda-syntax-light.min.css";
      const themeId = "hljs-theme-dynamic";

      // Helper to add or update theme link
      const setTheme = (dark: boolean) => {
        let link = document.getElementById(themeId) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "stylesheet";
          link.id = themeId;
          document.head.appendChild(link);
        }
        link.href = dark ? darkHref : lightHref;
      };

      setTheme(isDark);

      return () => {
        // Optionally remove theme link on unmount
        // const link = document.getElementById(themeId);
        // if (link) link.remove();
      };
    }, [isDark]);

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

    // Highlight code using highlight.js
    const [highlighted, setHighlighted] = useState<string>("");
    useEffect(() => {
      if (viewMode === "code") {
        let lang = className?.replace("language-", "") || "";
        if (!hljs.getLanguage(lang)) lang = "plaintext";
        try {
          const result =
            lang === "plaintext"
              ? hljs.highlightAuto(children)
              : hljs.highlight(children, { language: lang });
          setHighlighted(result.value);
        } catch {
          setHighlighted(children);
        }
      }
    }, [children, className, viewMode]);

    const copyToClipboard = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [children]);


    const renderContent = () => {
      // if (viewMode === "ascii") {
      //   return (
      //     <div
      //       className={`${showHeader ? "p-4" : "px-1.5 py-0.5"} ${
      //         showHeader ? "" : "rounded"
      //       }`}
      //       style={{
      //         backgroundColor: isDark ? "#2a2c2d" : "#e6e6e6",
      //       }}
      //     >
      //       <code
      //         className="text-zinc-800 dark:text-zinc-200 text-xs font-mono block"
      //         style={{
      //           lineHeight: "1.2",
      //           fontSize: "0.85em",
      //           fontFamily:
      //             'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      //           whiteSpace: isWrapped ? "pre-wrap" : "pre",
      //         }}
      //       >
      //         {children}
      //       </code>
      //     </div>
      //   );
      // }

      return (
        <div
          className={`${showHeader ? "" : "rounded-lg"} overflow-hidden`}
          style={{
            backgroundColor: isDark ? "#2a2c2d" : "#e6e6e6",
          }}
        >
          <div
            className={`${
              isWrapped ? "overflow-x-visible" : "overflow-x-auto"
            } thin-scrollbar`}
            style={{
              maxWidth: "100%",
              width: "100%",
            }}
          >
            <code
              ref={codeRef}
              className={`${
                className ? className + " hljs" : "hljs"
              } block p-4 text-sm leading-[1.4] ${
                isWrapped ? "whitespace-pre-wrap" : "whitespace-pre"
              }`}
              style={{
                margin: 0,
                width: isWrapped ? "100%" : "max-content",
                minWidth: isWrapped ? "auto" : "100%",
                maxWidth: isWrapped ? "100%" : "none",
              }}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        </div>
      );
    };

    if (!showHeader) {
      // Simple inline code without header (only for single-line inline)
      return (
        <code className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono">
          {children}
        </code>
      );
    }

    // Code block or multi-line with header
    return (
      <div className="relative group my-4 w-full max-w-full overflow-hidden">
        <div
          className="relative w-full rounded-lg"
          style={{
            maxWidth: "100%",
            width: "100%",
            overflow: "hidden",
            backgroundColor: isDark ? "#2a2c2d" : "#e6e6e6",
          }}
        >
          {/* Header with controls */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
            {/* Left side: View mode selector (only show if has ASCII patterns or forced) */}
            <div className="flex items-center">
              {/* <div className="inline-flex rounded-md bg-zinc-200 dark:bg-zinc-700 p-0.5">
                <button
                  onClick={() => handleViewModeChange("code")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 focus:outline-none ${
                    viewMode === "code"
                      ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => handleViewModeChange("ascii")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 focus:outline-none ${
                    viewMode === "ascii"
                      ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Raw Format
                </button>
              </div> */}
            </div>

            {/* Right side: Controls */}
            <div className="flex items-center space-x-2">
              {/* Text wrap toggle */}
              <button
                onClick={() => setIsWrapped(!isWrapped)}
                className="p-1.5 bg-white/90 dark:bg-zinc-700/90 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors duration-150 shadow-sm"
                title={isWrapped ? "Disable text wrap" : "Enable text wrap"}
              >
                <svg
                  className={`w-4 h-4 transition-colors duration-150 ${
                    isWrapped
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h8m-8 6h16"
                  />
                </svg>
              </button>

              {/* Copy button */}
              <button
                onClick={copyToClipboard}
                className="p-1.5 bg-white/90 dark:bg-zinc-700/90 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors duration-150 shadow-sm"
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                {copied ? (
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Content container with proper flex layout */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode} // This ensures animation when switching between modes
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-1 min-h-0"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

// Set display names for debugging
CodeBlock.displayName = "CodeBlock";

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
    <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  ul: ({ children, ...props }: any) => (
    <ul className="mb-2 last:mb-0 pl-4 space-y-1" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: any) => (
    <ol className="mb-2 last:mb-0 pl-4 space-y-1 list-decimal" {...props}>
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
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
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

    // // Multi-line code - check if it's ASCII art/table
    // const isAsciiArt =
    //   /[+\-|═│┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬]/.test(text) || // Box drawing chars
    //   /^\s*[+\-|]+\s*$/.test(text.split("\n")[0]) || // ASCII table headers
    //   /\+[-=]+\+/.test(text) || // Table borders like +---+
    //   /\|.*\|/.test(text); // Content between pipes

    // if (isAsciiArt) {
    //   // Multi-line ASCII art -> render with header and view options
    //   return (
    //     <CodeBlock forceAscii={true} isInlineMultiLine={true} {...props}>
    //       {children}
    //     </CodeBlock>
    //   );
    // }

    // Multi-line regular code -> render as code block with header
    return (
      <CodeBlock isInlineMultiLine={true} {...props}>
        {children}
      </CodeBlock>
    );
  },

  // Table components for GFM
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4 border-collapse border border-zinc-300 dark:border-zinc-600 rounded-lg">
      <table
        className="min-w-full"
        {...props}
      >
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
      className="px-3 py-2 text-left font-semibold text-sm border-r border-zinc-300 dark:border-zinc-600 last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }: any) => (
    <td
      className="px-3 py-2 text-sm border-r border-zinc-300 dark:border-zinc-600 last:border-r-0"
      {...props}
    >
      {children}
    </td>
  ),

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
  ({ message, isStreaming = false, animationsDisabled }) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const [processor, setProcessor] = useState<any>(null);
    const [isProcessorReady, setIsProcessorReady] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false);

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
        return "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl px-4 py-3 max-w-100 border border-zinc-300/50 dark:border-zinc-700/50";
      }
      if (message.isError) {
        return "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3 w-full max-w-full";
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
          (match, content) => {
            return `$$${content}$$`;
          }
        );

        // Convert inline math \(...\) to $...$ (non-greedy match)
        processedText = processedText.replace(
          /\\\(([\s\S]*?)\\\)/g,
          (match, content) => {
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
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
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
                      alt="Input image for editing"
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
                    alt="Generated image"
                    gcsPath={message.attachments?.[0]?.gcsPath}
                    attachment={message.attachments?.[0]}
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
                  <span className="ml-2">
                    • {message.modelName || message.model}
                  </span>
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
              className="text-sm leading-relaxed whitespace-pre-wrap"
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
                      className="text-sm leading-relaxed whitespace-pre-wrap"
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
                      alt="User uploaded image"
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

          {!isContentReady ? (
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
                
                {/* Model name and timestamp for AI responses */}
                {(!isUser && !isStreaming) && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                    {formatTime(message.timestamp)}
                    {(message.model || message.modelName) && isAssistant && (
                      <span className="ml-2">
                        • {message.modelName || message.model}
                      </span>
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
          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`my-4 flex flex-col ${
              isUser
                ? "max-w-full items-end"
                : "w-full max-w-full items-start min-w-0"
            }`}
          >
            <div className={getMessageStyles()}>
              {renderContent()}

              {isStreaming && !isUser && (
                <span className="inline-block w-0.5 h-4 bg-current opacity-75 animate-pulse ml-1" />
              )}

              {isStreaming && !isUser && (
                <div className="mt-3 flex items-center justify-between">
                  <TypingIndicator />
                </div>
              )}
            </div>

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
                    <span className="ml-2">
                      • {message.modelName || message.model}
                    </span>
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
