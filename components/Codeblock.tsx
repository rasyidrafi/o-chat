import React, { memo, useMemo, useState, useEffect, useRef } from "react";
import { useCodeHighlighter } from "../hooks/useCodeHighlighter";
import { Copy, Check, ChevronDown, ChevronUp } from "./Icons";
import { AnimatePresence, motion } from "framer-motion";
import { useSettingsContext } from "../contexts/SettingsContext";

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
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const [negativeMargin, setNegativeMargin] = useState(0);
  
  // Get animationsDisabled and isMobile from settings context
  const { settings, isMobile } = useSettingsContext();
  const animationsDisabled = settings.animationsDisabled;

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

  // Calculate negative margin to break out of parent containers
  useEffect(() => {
    if (!codeBlockRef.current || inline || isSingleLineInline) return;

    const calculateNegativeMargin = () => {
      const codeBlock = codeBlockRef.current;
      if (!codeBlock) return;

      // Find the message content container or list containers
      let parent = codeBlock.parentElement;
      let totalPadding = 0;

      // Traverse up to find all padding/margin from list items and containers
      while (parent && !parent.classList.contains('message-content')) {
        const styles = window.getComputedStyle(parent);
        const paddingLeft = parseFloat(styles.paddingLeft) || 0;
        const marginLeft = parseFloat(styles.marginLeft) || 0;
        
        // Check for list elements that typically have indentation
        if (parent.tagName === 'LI' || parent.tagName === 'UL' || parent.tagName === 'OL') {
          totalPadding += paddingLeft + marginLeft;
        }
        
        parent = parent.parentElement;
        
        // Safety check to avoid infinite loop and excessive negative margins
        if (!parent || totalPadding > 100) break;
      }

      // Set the negative margin, capped to prevent layout issues
      setNegativeMargin(Math.min(totalPadding, 80));
    };

    // Calculate on mount and when content changes
    calculateNegativeMargin();
    
    // Recalculate on window resize
    const resizeHandler = () => setTimeout(calculateNegativeMargin, 100);
    window.addEventListener('resize', resizeHandler);
    
    return () => window.removeEventListener('resize', resizeHandler);
  }, [inline, isSingleLineInline, children]);

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
      <code className={`rounded-md border border-primary/20 bg-primary/10 px-1 py-0.5 font-medium font-mono text-foreground/80 text-sm leading-4`}>
        {children}
      </code>
    );
  }

  // Block code
  return (
    <div 
      ref={codeBlockRef}
      className="relative my-4 flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700/80 w-full"
      style={{
        marginLeft: negativeMargin > 0 ? `-${negativeMargin}px` : '0',
        marginRight: negativeMargin > 0 ? `-${negativeMargin}px` : '0',
        width: negativeMargin > 0 ? `calc(100% + ${negativeMargin}px)` : '100%'
      }}
    >
      {/* Header with three buttons */}
      <div className="flex items-center gap-2 rounded-t-md border-b border-zinc-200 dark:border-zinc-700/80 bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        <span className="font-mono text-zinc-600 dark:text-zinc-400 text-xs">
          {language}
        </span>
        {lineCount > 15 && (
          <span className="font-mono text-zinc-500 dark:text-zinc-500 text-xs">
            {lineCount} lines
          </span>
        )}
        
        <div className="flex-grow" />
        
        {/* Three control buttons */}
        <div className="flex items-center gap-1">
          {/* Show more/less button for long code (left) - only show if > 15 lines */}
          {lineCount > 15 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              title={expanded ? "Show less" : "Show more"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          
          {/* Text wrap toggle button (middle) */}
          <button
            onClick={() => setIsWrapped(!isWrapped)}
            className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer ${
              isWrapped ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'
            }`}
            title={isWrapped ? "Disable text wrap" : "Enable text wrap"}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>
          
          {/* Copy button (right) */}
          <button
            onClick={copyToClipboard}
            className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Code content with AnimatePresence */}
      <div 
        className={`relative ${!expanded && lineCount > 15 ? 'max-h-80 overflow-hidden' : ''}`}
      >
        {isHighlighting ? (
          <motion.div
            initial={animationsDisabled ? {} : { opacity: 0 }}
            animate={animationsDisabled ? {} : { opacity: 1 }}
            exit={animationsDisabled ? {} : { opacity: 0 }}
            transition={animationsDisabled ? {} : { duration: 0.2 }}
            className="p-4"
          >
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-sm">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              <span>Processing...</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={animationsDisabled ? {} : { opacity: 0 }}
            animate={animationsDisabled ? {} : { opacity: 1 }}
            transition={animationsDisabled ? {} : { duration: 0.3 }}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            className={`shiki-container font-mono ${isMobile ? 'text-xs' : 'text-sm'} ${isWrapped ? 'text-wrap-enabled' : 'text-wrap-disabled'}`}
            style={{
              whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
              wordWrap: isWrapped ? 'break-word' : 'normal',
              overflowWrap: isWrapped ? 'break-word' : 'normal',
              overflowX: isWrapped ? 'visible' : 'auto'
            }}
          />
        )}
        
        {/* Gradient overlay for collapsed long code with AnimatePresence */}
        <AnimatePresence>
          {!expanded && !isHighlighting && lineCount > 15 && (
            <motion.div
              initial={animationsDisabled ? {} : { opacity: 0 }}
              animate={animationsDisabled ? {} : { opacity: 1 }}
              exit={animationsDisabled ? {} : { opacity: 0 }}
              transition={animationsDisabled ? {} : { duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent flex items-end justify-center pb-4"
            >
              <button
                onClick={() => setExpanded(true)}
                className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-xs hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer"
              >
                Show {lineCount - 15} more lines
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

Codeblock.displayName = "Codeblock";