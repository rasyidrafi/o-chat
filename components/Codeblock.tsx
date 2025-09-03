import React, { memo, useMemo, useState, useRef, useEffect } from "react";
import { useCodeHighlighter } from "../hooks/useCodeHighlighter";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface CodeblockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
  isDark?: boolean;
}

export const Codeblock = memo<CodeblockProps>(({ 
  children, 
  className, 
  inline = false 
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Extract language from className
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "plaintext";

  // Get code string from children
  const codeString = useMemo(() => {
    return [...(Array.isArray(children) ? children : [children])]
      .filter((x: any) => typeof x === "string")
      .join("");
  }, [children]);

  // Check if it's multiline
  const [isMultiLine, lineCount] = useMemo(() => {
    const lines = codeString.match(/\n/g)?.length ?? 0;
    return [lines > 0, lines + 1];
  }, [codeString]);

  // Check if it's a single line inline code (no newlines and no language)
  const isSingleLineInline = !className && !isMultiLine;

  // Handle dark mode detection
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

  // Use shiki for highlighting
  const { highlightedCode, isHighlighting } = useCodeHighlighter({
    codeString,
    language,
    isDark,
    inline: inline || isSingleLineInline,
    shouldHighlight: !inline && !isSingleLineInline && isMultiLine
  });

  // Copy function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!children) return null;

  // Inline code
  if (inline || isSingleLineInline) {
    return (
      <code className="rounded-md border border-primary/20 bg-primary/10 px-1 py-0.5 font-medium font-mono text-foreground/80 text-sm leading-4">
        {children}
      </code>
    );
  }

  // Block code
  return (
    <div className="relative mt-1 mb-1 flex flex-col overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md border-b border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        <span className="font-mono text-zinc-600 dark:text-zinc-400 text-xs">
          {language}
        </span>
        {lineCount > 15 && (
          <span className="font-mono text-zinc-500 dark:text-zinc-500 text-xs">
            {lineCount} lines
          </span>
        )}
        
        <div className="flex-grow" />
        
        {/* Expand/Collapse button for long code */}
        {lineCount > 15 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        
        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Code content */}
      <div 
        className={`relative ${!expanded && lineCount > 15 ? 'max-h-80 overflow-hidden' : ''}`}
      >
        {isHighlighting ? (
          <div className="p-4 text-sm text-zinc-500">Highlighting...</div>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            className="shiki-container font-mono text-sm"
          />
        )}
        
        {/* Gradient overlay for collapsed long code */}
        {!expanded && lineCount > 15 && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent flex items-end justify-center pb-2">
            <button
              onClick={() => setExpanded(true)}
              className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              Show {lineCount - 15} more lines
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

Codeblock.displayName = "Codeblock";