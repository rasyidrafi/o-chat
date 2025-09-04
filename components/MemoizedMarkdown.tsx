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
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

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

  // Note: $$like this$$ is already handled by remarkMath as-is
  return processedText;
};

interface MemoizedMarkdownBlockProps {
  content: string;
  isDark?: boolean;
}

const MemoizedMarkdownBlock = memo<MemoizedMarkdownBlockProps>(
  ({ content, isDark = false }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [rehypeKatex, { output: "html" }]
        ]}
        components={{
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

          code: ({ node, className, children, ...props }: any) => {
            const text = String(children);

            // If there's a className (language specified), always render as code block
            if (className) {
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
            return (
              <Codeblock isDark={isDark} {...props}>
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
          hr: (props: any) => <HorizontalRule {...props} />,

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
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    if (prevProps.isDark !== nextProps.isDark) return false;
    return true;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

interface MemoizedMarkdownProps {
  content: string;
  id: string;
  isDark?: boolean;
}

export const MemoizedMarkdown = memo<MemoizedMarkdownProps>(
  ({ content, id, isDark = false }) => {
    const processedContent = useMemo(() => preProcessLatex(content), [content]);
    const blocks = useMemo(() => parseMarkdownIntoBlocks(processedContent), [processedContent]);

    return (
      <>
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock 
            content={block} 
            key={`${id}-block_${index}`} 
            isDark={isDark}
          />
        ))}
      </>
    );
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";