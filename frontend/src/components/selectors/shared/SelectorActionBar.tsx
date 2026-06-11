import type { ButtonHTMLAttributes, ReactNode } from "react";

export const SELECTOR_ACTION_BAR_CLASS =
  "flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border-b border-stone-200/80 dark:border-stone-700/80 bg-stone-50/80 dark:bg-stone-800/50";
export const SELECTOR_ACTION_BUTTON_CLASS =
  "px-3 py-2 sm:py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 rounded-lg transition-colors";
export const SELECTOR_ACTION_ACCENT_BUTTON_CLASS =
  "flex items-center gap-1 px-3 py-2 sm:py-1.5 text-xs font-medium text-stone-500 dark:text-amber-400 hover:text-stone-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-amber-500/10 active:bg-stone-200 dark:active:bg-amber-500/20 rounded-lg transition-colors";

interface SelectorActionBarProps {
  children: ReactNode;
  className?: string;
}

interface SelectorActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function SelectorActionBar({
  children,
  className,
}: SelectorActionBarProps) {
  return (
    <div className={cx(SELECTOR_ACTION_BAR_CLASS, className)}>{children}</div>
  );
}

export function SelectorActionButton({
  accent = false,
  className,
  type = "button",
  children,
  ...props
}: SelectorActionButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        accent
          ? SELECTOR_ACTION_ACCENT_BUTTON_CLASS
          : SELECTOR_ACTION_BUTTON_CLASS,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
