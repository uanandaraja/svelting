import everforestLight from "@shikijs/themes/everforest-light";
import everforestDark from "@shikijs/themes/everforest-dark";

/**
 * Shiki theme objects for code highlighting.
 * Maps theme names to their configurations.
 */
export const shikiThemes = {
  "everforest-light": everforestLight,
  "everforest-dark": everforestDark,
} as const;

export type ShikiThemeName = keyof typeof shikiThemes;

/**
 * Returns the appropriate shiki theme name based on dark mode.
 */
export function getShikiTheme(isDark: boolean): ShikiThemeName {
  return isDark ? "everforest-dark" : "everforest-light";
}

/**
 * Streamdown theme configuration matching the app's design system.
 */
export const streamdownTheme = {
  paragraph: { base: "mb-4 text-sm leading-[22px] [&:last-child]:mb-0" },
  h1: { base: "text-xl font-bold mt-5 mb-2" },
  h2: { base: "text-lg font-bold mt-4 mb-2" },
  h3: { base: "text-base font-semibold mt-3 mb-2" },
  h4: { base: "text-sm font-semibold mt-2 mb-1" },
  ul: { base: "list-disc list-inside my-3 space-y-1 text-sm leading-[22px]" },
  ol: {
    base: "list-decimal list-inside my-3 space-y-1 text-sm leading-[22px]",
  },
  li: { base: "leading-[22px]" },
  blockquote: {
    base: "border-l-4 border-muted-foreground/30 pl-4 my-4 italic text-muted-foreground",
  },
  link: {
    base: "text-primary underline underline-offset-2 hover:text-primary/80",
  },
  codespan: { base: "bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono" },
  code: {
    base: "my-4 rounded-lg border border-border overflow-hidden",
    container: "relative bg-muted/80 font-mono text-sm",
    header:
      "flex items-center justify-between px-3 py-2 bg-transparent border-b border-border text-xs",
    language: "font-mono text-muted-foreground",
    buttons:
      "flex items-center gap-2 text-muted-foreground [&>button]:p-1 [&>button]:rounded [&>button]:hover:bg-muted [&>button]:hover:text-foreground [&>button]:transition-colors [&_svg]:size-4",
    pre: "p-3 overflow-x-auto text-sm [&>code]:block",
    line: "block",
  },
  hr: { base: "my-6 border-border" },
} as const;
