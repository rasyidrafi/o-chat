import type { Schema } from "hast-util-sanitize";
import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Codeblock } from "./Codeblock";
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
          code: ({ node, inline, className, children, ...props }) => (
            <Codeblock 
              inline={inline} 
              className={className} 
              isDark={isDark}
              {...props}
            >
              {children}
            </Codeblock>
          )
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
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

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