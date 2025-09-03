import { useEffect, useState } from "react";
import { type Highlighter, createHighlighter } from "shiki";

// Create a singleton highlighter instance
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

const getHighlighter = async (): Promise<Highlighter> => {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "python",
      "java",
      "c",
      "cpp",
      "csharp",
      "php",
      "ruby",
      "go",
      "rust",
      "swift",
      "kotlin",
      "scala",
      "html",
      "css",
      "scss",
      "sass",
      "json",
      "xml",
      "yaml",
      "markdown",
      "bash",
      "shell",
      "sql",
      "dockerfile",
      "nginx",
      "apache",
      "plaintext"
    ]
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
};

interface UseCodeHighlighterOptions {
  codeString: string;
  language: string;
  isDark: boolean;
  inline?: boolean;
  shouldHighlight?: boolean;
}

export const useCodeHighlighter = ({
  codeString,
  language,
  isDark,
  inline = false,
  shouldHighlight = true
}: UseCodeHighlighterOptions) => {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isHighlighting, setIsHighlighting] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      if (!shouldHighlight || inline || !codeString) {
        setIsHighlighting(false);
        return;
      }

      try {
        setIsHighlighting(true);
        const highlighter = await getHighlighter();

        // Check if the language is supported, fallback to plaintext if not
        const supportedLangs = highlighter.getLoadedLanguages();
        const langToUse = supportedLangs.includes(language) ? language : "plaintext";

        const highlighted = highlighter.codeToHtml(codeString, {
          lang: langToUse,
          theme: isDark ? "github-dark" : "github-light",
          transformers: [
            {
              pre(node) {
                // Remove default styling to use our custom styles
                node.properties.style = undefined;
                node.properties.class = "relative my-0 max-w-full resize-none overflow-x-auto text-wrap rounded-t-none rounded-b-lg py-3 px-3 text-sm leading-4";
              },
              code(node) {
                node.properties.class = "whitespace-pre break-keep";
              }
            }
          ]
        });

        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain text if highlighting fails
        setHighlightedCode(`<pre><code>${codeString}</code></pre>`);
      } finally {
        setIsHighlighting(false);
      }
    };

    highlightCode();
  }, [codeString, language, isDark, inline, shouldHighlight]);

  return {
    highlightedCode,
    isHighlighting
  };
};