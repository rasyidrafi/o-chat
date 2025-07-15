// Clean Message component with unified markdown processing
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types/chat';
import { motion } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import ReasoningDisplay from './ReasoningDisplay';
import * as prod from 'react/jsx-runtime';

// Lazy load heavy dependencies
const SyntaxHighlighter = React.lazy(() => 
  import('react-syntax-highlighter').then(module => ({ 
    default: module.Prism 
  }))
);

const syntaxStyles = {
  dark: React.lazy(() => 
    import('react-syntax-highlighter/dist/esm/styles/prism').then(module => ({ 
      default: module.vscDarkPlus 
    }))
  ),
  light: React.lazy(() => 
    import('react-syntax-highlighter/dist/esm/styles/prism').then(module => ({ 
      default: module.vs 
    }))
  )
};

// Lazy load markdown processor
const createMarkdownProcessor = () => 
  Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-gfm'),
    import('remark-rehype'),
    import('rehype-react')
  ]).then(([unified, remarkParse, remarkGfm, remarkRehype, rehypeReact]) => ({
    processor: unified.unified()
      .use(remarkParse.default)
      .use(remarkGfm.default)
      .use(remarkRehype.default, { allowDangerousHtml: true })
      .use(rehypeReact.default, {
        ...prod,
        components: MarkdownComponents,
      })
  }))
  );

// Lazy load mermaid
const mermaid = React.lazy(() => import('mermaid'));

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  animationsDisabled: boolean;
}

// Custom CodeBlock component with copy functionality and syntax highlighting
const CodeBlock: React.FC<{ children: string; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [codeFont, setCodeFont] = useState('Berkeley Mono (default)');
  const [darkStyle, setDarkStyle] = useState<any>(null);
  const [lightStyle, setLightStyle] = useState<any>(null);
  
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
      const storedCodeFont = localStorage.getItem('codeFont') || 'JetBrains Mono (default)';
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
  
  // Load syntax highlighting styles
  useEffect(() => {
    syntaxStyles.dark().then(module => setDarkStyle(module.default));
    syntaxStyles.light().then(module => setLightStyle(module.default));
  }, []);

  // Don't render until styles are loaded
  if (!darkStyle || !lightStyle) {
    return (
      <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{children}</code>
      </pre>
    );
  }

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
    <div className="relative group mb-4 w-full overflow-hidden">
      <div className="relative">
        <React.Suspense fallback={<pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 overflow-x-auto text-sm"><code>{children}</code></pre>}>
          <SyntaxHighlighter
            language={language}
            style={isDark ? darkStyle : lightStyle}
            customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            background: isDark ? '#1f2937' : '#f3f4f6',
            fontSize: '0.75rem', // Smaller font on mobile
            lineHeight: '1.5',
            fontFamily: fontFamily,
            width: '100%',
            overflowX: 'auto', // Enable horizontal scroll
            overflowY: 'hidden',
            whiteSpace: 'pre', // Preserve formatting but allow scroll
            wordWrap: 'normal',
            wordBreak: 'normal',
            // Mobile styles handled via CSS classes instead of media queries
            padding: '0.75rem',
            }}
            wrapLines={true}
            wrapLongLines={true}
            showLineNumbers={false}
            PreTag="div"
          >
            {children}
          </SyntaxHighlighter>
        </React.Suspense>
        
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
  const [mermaidLib, setMermaidLib] = useState<any>(null);

  useEffect(() => {
    mermaid().then(module => {
      module.default.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      });
      setMermaidLib(module.default);
    });
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidLib) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaidLib.render(id, code);
        setSvg(renderedSvg);
        setError('');
      } catch (err) {
        setError('Failed to render Mermaid diagram');
        console.error('Mermaid render error:', err);
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
      <div className="my-4 flex justify-center bg-white dark:bg-zinc-900 rounded-lg p-4 text-zinc-500">Loading diagram...</div>
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
  const [processor, setProcessor] = useState<any>(null);

  // Load markdown processor lazily
  useEffect(() => {
    if (!isUser && !processor) {
      createMarkdownProcessor().then(({ processor: markdownProcessor }) => {
        setProcessor(markdownProcessor);
      });
    }
  }, [isUser, processor]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 24) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      // Yesterday
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      // Within a week - show day and time
      return `${diffInDays} days ago ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // More than a week - show date and time
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
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
    
    if (!processor) {
      return <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>;
    }

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
      <div className={`my-4 flex flex-col ${isUser ? 'max-w-[80%] items-end' : 'w-full items-start min-w-0'}`}>
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