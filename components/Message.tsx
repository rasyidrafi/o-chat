// Clean Message component with unified markdown processing
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types/chat';
import { motion } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import ReasoningDisplay from './ReasoningDisplay';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import mermaid from 'mermaid';
import * as prod from 'react/jsx-runtime';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  animationsDisabled: boolean;
}

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
});

// Custom CodeBlock component with copy functionality and syntax highlighting
const CodeBlock: React.FC<{ children: string; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [codeFont, setCodeFont] = useState('Berkeley Mono (default)');
  
  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Load code font from localStorage and listen for changes
  useEffect(() => {
    const loadCodeFont = () => {
      const storedCodeFont = localStorage.getItem('codeFont') || 'Berkeley Mono (default)';
      setCodeFont(storedCodeFont);
    };

    loadCodeFont();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'codeFont') {
        loadCodeFont();
      }
    };

    // Listen for custom storage events from same tab
    const handleCustomStorageChange = (event: CustomEvent) => {
      if (event.detail.key === 'codeFont') {
        loadCodeFont();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Extract language from className (e.g., "language-javascript" -> "javascript")
  const language = className?.replace('language-', '') || 'text';
  
  // Get the actual font family name (remove "(default)" suffix)
  const fontFamily = codeFont.split(' (')[0];

  return (
    <div className="relative group mb-4">
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            background: isDark ? '#1f2937' : '#f3f4f6',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: fontFamily,
          }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {children}
        </SyntaxHighlighter>
        
        <button
          onClick={copyToClipboard}
          className="absolute bottom-2 right-2 p-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-colors opacity-0 group-hover:opacity-100"
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
    const className = codeElement.props.className || '';
    
    if (className.includes('language-mermaid')) {
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
    return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
  },
  
  // Table components for GFM
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-600" {...props}>
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }: any) => (
    <thead className="bg-zinc-100 dark:bg-zinc-800" {...props}>
      {children}
    </thead>
  ),
  
  tbody: ({ children, ...props }: any) => (
    <tbody {...props}>
      {children}
    </tbody>
  ),
  
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-zinc-200 dark:border-zinc-700" {...props}>
      {children}
    </tr>
  ),
  
  th: ({ children, ...props }: any) => (
    <th className="px-3 py-2 text-left font-semibold text-sm border-r border-zinc-300 dark:border-zinc-600 last:border-r-0" {...props}>
      {children}
    </th>
  ),
  
  td: ({ children, ...props }: any) => (
    <td className="px-3 py-2 text-sm border-r border-zinc-300 dark:border-zinc-600 last:border-r-0" {...props}>
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
    if (type === 'checkbox') {
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
  hr: ({ ...props }: any) => (
    <div className="flex justify-center my-4" {...props}>
      <div className="w-4/5 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-600 to-transparent" />
    </div>
  ),
};

// Mermaid diagram component
const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError('');
      } catch (err) {
        setError('Failed to render Mermaid diagram');
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [code]);

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

  return (
    <div 
      ref={ref}
      className="my-4 flex justify-center bg-white dark:bg-zinc-900 rounded-lg p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const Message: React.FC<MessageProps> = ({ 
  message, 
  isStreaming = false, 
  onStopStreaming, 
  animationsDisabled 
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Create markdown processor with unified
  const processor = useMemo(() => {
    return unified()
      .use(remarkParse)
      .use(remarkGfm) // GitHub Flavored Markdown
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeReact, {
        // @ts-ignore
        ...prod,
        components: MarkdownComponents,
      });
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStyles = () => {
    if (isUser) {
      return 'bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl px-4 py-3';
    }
    if (message.isError) {
      return 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3';
    }
    return 'text-zinc-900 dark:text-zinc-100'; // Remove background and padding for AI responses
  };

  const processedContent = useMemo(() => {
    if (isUser || !message.content) return null;
    
    try {
      const result = processor.processSync(message.content);
      return result.result as React.ReactElement;
    } catch (error) {
      console.error('Markdown processing error:', error);
      return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      );
    }
  }, [message.content, processor, isUser]);

  const renderContent = () => {
    if (isUser) {
      return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      );
    }

    // For AI responses, render reasoning first then content
    return (
      <div className="space-y-3">
        <ReasoningDisplay 
          reasoning={message.reasoning || ''}
          isReasoningComplete={message.isReasoningComplete || false}
          isStreaming={isStreaming}
        />
        
        <div className="text-sm leading-relaxed">
          {processedContent}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={animationsDisabled ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationsDisabled ? 0 : 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`my-4 flex flex-col ${isUser ? 'max-w-[80%] items-end' : 'w-full items-start'}`}>
        <div className={getMessageStyles()}>
          {renderContent()}
          {isStreaming && !isUser && (
            <span className="inline-block w-0.5 h-4 bg-current opacity-75 animate-pulse ml-1" />
          )}
          
          {isStreaming && !isUser && (
            <div className="mt-3 flex items-center justify-between">
              <TypingIndicator />
              {/* {onStopStreaming && (
                <button
                  onClick={onStopStreaming}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                  aria-label="Stop generation"
                >
                  <X className="w-3 h-3" />
                  Stop
                </button>
              )} */}
            </div>
          )}
        </div>

        <div className={`text-xs text-zinc-500 dark:text-zinc-400 ${isUser ? 'text-right mt-2' : 'text-left mt-4'}`}>
          {formatTime(message.timestamp)}
          {message.model && isAssistant && (
            <span className="ml-2">• {message.model}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;