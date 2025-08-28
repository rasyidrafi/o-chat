// Clean Message component with unified markdown processing
import React, { useMemo, useEffect, useRef, useState } from "react";
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
}> = ({ url, alt = "Uploaded image", gcsPath, attachment }) => {
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

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);

    if (attachment?.isDirectUrl) {
      setShowExpiredPlaceholder(true);
    }
  };

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
};

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onLoaded: () => void;
  animationsDisabled: boolean;
}

// Custom CodeBlock component with copy functionality and syntax highlighting
const CodeBlock: React.FC<{ children: string; className?: string }> = ({
  children,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

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
  }, [children, className]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group mb-4 w-full max-w-full overflow-hidden">
      {/* Force container constraints */}
      <div
        className="relative w-full bg-zinc-50 dark:bg-zinc-900 rounded-lg"
        style={{
          maxWidth: "100%",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Scrollable wrapper */}
        <div
          className="overflow-x-auto thin-scrollbar"
          style={{
            maxWidth: "100%",
            width: "100%",
          }}
        >
          <code
            ref={codeRef}
            className={`${
              className ? className + " hljs" : "hljs"
            } block p-4 text-sm leading-relaxed whitespace-pre`}
            style={{
              margin: 0,
              width: "max-content",
              minWidth: "100%",
              maxWidth: "none",
            }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>

        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-800 rounded transition-colors opacity-0 group-hover:opacity-100 z-10 shadow-sm"
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
  );
};

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

    // Detect ASCII diagrams (multi-line OR contains box-drawing chars)
    const isAscii = text.includes("\n") || /[+|\-]{2,}/.test(text);

    if (isAscii) {
      // Render ASCII diagrams in a block
      return (
        <div className="mb-2 flex justify-center bg-zinc-200 dark:bg-zinc-700 rounded py-3">
          <code
            className="bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 text-xs font-mono block align-baseline"
            style={{
              lineHeight: "1.2",
              fontSize: "0.85em",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              whiteSpace: "pre", // preserve ASCII spacing
            }}
            {...props}
          >
            {children}
          </code>
        </div>
      );
    }

    // Inline code
    if (!className) {
      return (
        <code
          className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Block code with copy functionality
    return (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    );
  },

  // Table components for GFM
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table
        className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-600"
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

// Mermaid diagram component
const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
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
};

// Markdown processor (rehype-react, unified, etc.)
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
      console.log("Creating processor with math support");
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

const Message: React.FC<MessageProps> = ({
  message,
  isStreaming = false,
  onLoaded,
  animationsDisabled,
}) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const [processor, setProcessor] = useState<any>(null);
  const [isProcessorReady, setIsProcessorReady] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  // Load markdown processor lazily
  useEffect(() => {
    if (!isUser && !processor) {
      createMarkdownProcessor().then(({ processor: markdownProcessor }) => {
        setProcessor(markdownProcessor);
        setIsProcessorReady(true);
      });
    } else if (isUser) {
      setIsProcessorReady(true);
    }
  }, [isUser, processor]);

  // Set content ready when processor is ready or for user messages
  useEffect(() => {
    if (isProcessorReady) {
      const timer = setTimeout(() => {
        setIsContentReady(true);
      }, 50);

      const timer2 = setTimeout(() => {
        onLoaded();
      }, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
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

  const processedContent = useMemo(() => {
    if (isUser || !message.content) return null;

    if (!processor || !isProcessorReady) {
      return null;
    }

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
          console.log("Converting display math:", match);
          return `$$${content}$$`;
        }
      );

      // Convert inline math \(...\) to $...$ (non-greedy match)
      processedText = processedText.replace(
        /\\\(([\s\S]*?)\\\)/g,
        (match, content) => {
          console.log("Converting inline math:", match);
          return `$${content}$`;
        }
      );

      // Debug: Check the final result
      const finalMathMatches = processedText.match(
        /\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g
      );
      if (finalMathMatches) {
        console.log("Final math expressions:", finalMathMatches.slice(0, 5)); // Show first 5 only
      } else {
        console.log("No valid math expressions found after conversion");
      }

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
                : message.content.find((item) => item.type === "text")?.text ||
                  ""}
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
                : message.content.find((item) => item.type === "text")?.text ||
                  "Generated image"}
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
          </div>
        );
      }
    }

    if (isUser) {
      // Handle user messages with potentially complex content
      if (typeof message.content === "string") {
        return (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        );
      } else {
        // Handle complex content with text and images
        return (
          <div className="space-y-2 flex flex-col">
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
          </div>
        );
      }
    }

    return (
      <div className="space-y-3 w-full max-w-full min-w-0">
        <ReasoningDisplay
          reasoning={message.reasoning || ""}
          isReasoningComplete={message.isReasoningComplete || false}
          isStreaming={isStreaming}
        />

        <AnimatePresence mode="wait">
          {!isContentReady ? (
            <motion.div
              key="processing"
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              exit={animationsDisabled ? {} : "exit"}
              className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
            >
              <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span>Processing...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={fadeVariants}
              initial={animationsDisabled ? {} : "initial"}
              animate="animate"
              className="text-sm leading-relaxed w-full max-w-full min-w-0 overflow-hidden"
            >
              {processedContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
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

        <div
          className={`text-xs text-zinc-500 dark:text-zinc-400 ${
            isUser ? "text-right mt-2" : "text-left mt-4"
          }`}
        >
          {formatTime(message.timestamp)}
          {(message.model || message.modelName) && isAssistant && (
            <span className="ml-2">• {message.modelName || message.model}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
