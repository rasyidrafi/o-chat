import type { Schema } from "hast-util-sanitize";
import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Codeblock } from "./Codeblock";
import HorizontalRule from "./ui/HorizontalRule";
import { themes } from "@/constants/themes";
import "katex/dist/katex.min.css";

// Custom sanitization schema
const sanitizeSchema: Schema = {
  tagNames: [
    "h1",
    "h2", 
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "blockquote",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "del",
    "code",
    "pre",
    "hr",
    "br",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ],
  attributes: {
    "*": ["className", "id", "data-theme"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"]
  }
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  try {
    const tokens = marked.lexer(markdown);
    return tokens.map((token) => token.raw);
  } catch (error) {
    // Fallback: if marked.lexer fails, return the entire content as one block
    console.warn('Failed to parse markdown into blocks, using fallback:', error);
    return [markdown];
  }
}

// Function to detect if content contains currency patterns
const containsCurrency = (text: string): boolean => {
  // Check for currency patterns: $number followed by optional currency words or decimal/period
  const currencyPattern = /\$\d+(?:[.,]\d+)*(?:\s*(?:miliar|juta|ribu|million|billion|thousand|k|m|b|per|\/|day|TH|hari|kWh))?/gi;
  return currencyPattern.test(text);
};

// Function to detect if content contains LaTeX math patterns
const containsLatexMath = (text: string): boolean => {
  // More comprehensive LaTeX detection patterns
  const mathPatterns = [
    // Single letter variables: $x$, $e$, $i$, etc.
    /\$[a-zA-Z]\$/g,
    // Greek letters: $\theta$, $\alpha$, etc.
    /\$\\[a-zA-Z]+\$/g,
    // Complex expressions with operators: $e^{i\theta}$, $\cos\theta$, etc.
    /\$[a-zA-Z\\]+[\w\\{}^_+\-*/=().,\s]*[a-zA-Z\\{}^_]\$/g,
    // Math expressions with brackets: ${...}$
    /\$\{[^}]+\}\$/g,
    // Expressions with backslash commands: $\cos$, $\sin$, etc.
    /\$\\[a-zA-Z]+[\w\\{}^_+\-*/=().,\s]*\$/g,
    // Scientific notation patterns: $10^{-10}$, $6.7 \times 10^{-10}$
    /\$\d+(?:\.\d+)?\s*\\times\s*\d+\^?\{?-?\d+\}?\$/g,
    // Math with multiplication symbols: $*$, $\times$
    /\$[^$]*\\times[^$]*\$/g,
    // Math expressions with equals: $Valor = ...$
    /\$[^$]*=[^$]*\$/g
  ];
  
  return mathPatterns.some(pattern => pattern.test(text));
};

// LaTeX preprocessing function to handle system prompt LaTeX patterns
const preProcessLatex = (text: string): string => {
  // Only handle the specific LaTeX delimiters from system prompt
  let processedText = text;

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

  // Remove horizontal rules that immediately follow code blocks
  processedText = processedText.replace(
    /(```[\s\S]*?```)\s*\n\s*---+\s*\n/g,
    '$1\n\n'
  );

  // Remove horizontal rules that immediately follow code blocks (alternative pattern)
  processedText = processedText.replace(
    /(```[\s\S]*?```)\s*\n\s*\*\*\*+\s*\n/g,
    '$1\n\n'
  );

  // // Remove horizontal rules that immediately follow tables
  processedText = processedText.replace(
    /(\|.*\|[\s\S]*?\|.*\|)\s*\n\s*---+\s*\n/g,
    '$1\n\n'
  );

  // Remove horizontal rules that immediately follow tables (alternative pattern)
  processedText = processedText.replace(
    /(\|.*\|[\s\S]*?\|.*\|)\s*\n\s*\*\*\*+\s*\n/g,
    '$1\n\n'
  );

  // Intelligently determine if we should escape currency
  const hasCurrency = containsCurrency(processedText);
  const hasLatex = containsLatexMath(processedText);

  // More sophisticated logic for mixed content
  if (hasCurrency && hasLatex) {
    // Mixed content: selectively escape only clear currency patterns while preserving math
    processedText = processedText.replace(
      /\$(\d+(?:[.,]\d+)*(?:\s*(?:miliar|juta|ribu|million|billion|thousand|k|m|b|per|\/|day|TH|hari|kWh))+)/gi,
      (match) => {
        return '\\' + match;
      }
    );
  } else if (hasCurrency && !hasLatex) {
    // Only currency: escape all currency patterns
    processedText = processedText.replace(
      /\$(\d+(?:[.,]\d+)*(?:\s*(?:miliar|juta|ribu|million|billion|thousand|k|m|b|per|\/|day|TH|hari|kWh))?)/gi,
      (match) => {
        return '\\' + match;
      }
    );
  }
  // If only LaTeX (hasLatex && !hasCurrency), do nothing - let KaTeX handle it

  // Note: $$like this$$ is already handled by remarkMath as-is
  return processedText;
};

interface MemoizedMarkdownBlockProps {
  content: string;
  isDark?: boolean;
  isReasoning?: boolean;
}

const MemoizedMarkdownBlock = memo<MemoizedMarkdownBlockProps>(
  ({ content, isDark = false, isReasoning = false }) => {
    const markdownContent = (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { 
          singleDollarTextMath: true  // Re-enable single dollar math for proper LaTeX rendering
        }]]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [rehypeKatex, { output: "html" }]
        ]}
        components={{
          // Custom styling for various elements
          p: ({ children, ...props }: any) => (
            <p className={`${isReasoning ? 'mb-1 last:mb-0' : 'mb-2 last:mb-0'} leading-relaxed items-center`} {...props}>
              {children}
            </p>
          ),

          ul: ({ children, ...props }: any) => (
            <ul className={`${isReasoning ? 'mb-1 last:mb-0 pl-3 space-y-0.5' : 'mb-2 last:mb-0 pl-4 space-y-1'}`} {...props}>
              {children}
            </ul>
          ),

          ol: ({ children, ...props }: any) => (
            <ol className={`${isReasoning ? 'list-none mb-1 last:mb-0 pl-3 space-y-0.5 list-disc' : 'mb-2 last:mb-0 pl-4 space-y-1 list-disc'}`} {...props}>
              {children}
            </ol>
          ),

          li: ({ children, ...props }: any) => (
            <li className={`${isReasoning ? 'list-none mb-0.5' : 'mb-1'}`} {...props}>
              {children}
            </li>
          ),

          h1: ({ children, ...props }: any) => (
            <h1 className={`${isReasoning ? 'text-base font-semibold mb-1 mt-2 first:mt-0' : 'text-lg font-semibold mb-3 mt-4 first:mt-0'}`} {...props}>
              {children}
            </h1>
          ),

          h2: ({ children, ...props }: any) => (
            <h2 className={`${isReasoning ? 'text-sm font-semibold mb-1 mt-2 first:mt-0' : 'text-base font-semibold mb-2 mt-3 first:mt-0'}`} {...props}>
              {children}
            </h2>
          ),

          h3: ({ children, ...props }: any) => (
            <h3 className={`${isReasoning ? 'text-xs font-semibold mb-1 mt-1 first:mt-0' : 'text-sm font-semibold mb-2 mt-3 first:mt-0'}`} {...props}>
              {children}
            </h3>
          ),

          blockquote: ({ children, ...props }: any) => (
            <blockquote
              className={`border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic ${isReasoning ? 'my-1' : 'my-3'} text-zinc-700 dark:text-zinc-300`}
              {...props}
            >
              {children}
            </blockquote>
          ),

          code: ({ node, className, children, ...props }: any) => {
            const text = String(children);

            // If there's a className (language specified), always render as code block
            if (className) {
              // For reasoning display, use simple read-only code block
              if (isReasoning) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "plaintext";
                
                return (
                  <div className="my-2 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700/50">
                      {language}
                    </div>
                    <pre className="bg-zinc-50 dark:bg-zinc-900 p-2 overflow-x-auto text-xs font-mono leading-relaxed thin-scrollbar">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              }
              
              return (
                <Codeblock className={className} isDark={isDark} {...props}>
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
            if (isReasoning) {
              return (
                <div className="my-2 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                  <pre className="bg-zinc-50 dark:bg-zinc-900 p-2 overflow-x-auto text-xs font-mono leading-relaxed">
                    <code {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            
            return (
              <Codeblock isDark={isDark} {...props}>
                {children}
              </Codeblock>
            );
          },

          // Table components for GFM - Restored original responsive design
          table: ({ children, ...props }: any) => (
            <div className={`overflow-x-auto ${isReasoning ? 'my-2' : 'my-4'} border-none thin-scrollbar`}>
              <table className="min-w-full text-xs sm:text-sm" {...props}>
                {children}
              </table>
            </div>
          ),

          thead: ({ children, ...props }: any) => (
            <thead {...props}>
              {children}
            </thead>
          ),

          tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,

          tr: ({ children, ...props }: any) => (
            <tr className="border-t first:border-t-0 border-zinc-200 dark:border-zinc-700/80" {...props}>
              {children}
            </tr>
          ),

          th: ({ children, ...props }: any) => (
            <th
              className={`pr-2 pl-2 first:pl-0 ${isReasoning ? 'py-1' : 'py-2'} text-left font-semibold text-xs sm:text-sm border-none`}
              {...props}
            >
              {children}
            </th>
          ),

          td: ({ children, ...props }: any) => {
            return (
              <td
                className={`pr-2 pl-2 first:pl-0 ${isReasoning ? 'py-1' : 'py-2'} text-left text-xs sm:text-sm border-none`}
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
                  disabled={disabled || isReasoning} // Always disabled for reasoning
                  readOnly={isReasoning} // Read-only for reasoning
                  className="mr-2 rounded"
                  {...props}
                />
              );
            }
            return <input type={type} disabled={isReasoning} readOnly={isReasoning} {...props} />;
          },

          // Custom horizontal rule
          hr: (props: any) => (
            <HorizontalRule 
              {...props} 
              className={isReasoning ? 'my-2' : undefined}
            />
          ),

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
        }}
      >
        {content}
      </ReactMarkdown>
    );

    // Wrap with theme color for reasoning
    if (isReasoning) {
      return (
        <div className={themes.sidebar.fg}>
          {markdownContent}
        </div>
      );
    }

    return markdownContent;
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    if (prevProps.isDark !== nextProps.isDark) return false;
    if (prevProps.isReasoning !== nextProps.isReasoning) return false;
    return true;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

interface MemoizedMarkdownProps {
  content: string;
  id: string;
  isDark?: boolean;
  isReasoning?: boolean;
}

export const MemoizedMarkdown = memo<MemoizedMarkdownProps>(
  ({ content, id, isDark = false, isReasoning = false }) => {
    const processedContent = useMemo(() => preProcessLatex(content), [content]);
    const blocks = useMemo(() => parseMarkdownIntoBlocks(processedContent), [processedContent]);

    return (
      <>
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock 
            content={block} 
            key={`${id}-block_${index}`} 
            isDark={isDark}
            isReasoning={isReasoning}
          />
        ))}
      </>
    );
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";