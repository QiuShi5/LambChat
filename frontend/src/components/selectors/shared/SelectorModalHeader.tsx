import type { ReactNode } from "react";
import { X } from "lucide-react";

export const SELECTOR_MODAL_HEADER_CLASS =
  "flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b";
export const SELECTOR_MODAL_DRAG_HANDLE_CLASS =
  "absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600 sm:hidden";
export const SELECTOR_MODAL_CLOSE_BUTTON_CLASS =
  "p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 transition-colors";
export const SELECTOR_MODAL_ICON_TILE_CLASS =
  "size-9 sm:size-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center";

interface SelectorModalHeaderProps {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  className?: string;
  subtitleClassName?: string;
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function SelectorModalHeader({
  icon,
  title,
  subtitle,
  onClose,
  className,
  subtitleClassName = "text-xs sm:text-xs text-stone-500 dark:text-stone-400",
}: SelectorModalHeaderProps) {
  return (
    <div
      className={cx(SELECTOR_MODAL_HEADER_CLASS, className)}
      style={{ borderColor: "var(--theme-border)" }}
    >
      <div className={SELECTOR_MODAL_DRAG_HANDLE_CLASS} />
      <div className="flex items-center gap-3 mt-2 sm:mt-0">
        <div className={SELECTOR_MODAL_ICON_TILE_CLASS}>{icon}</div>
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 font-serif">
            {title}
          </h2>
          {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className={SELECTOR_MODAL_CLOSE_BUTTON_CLASS}>
        <X size={18} className="text-stone-400 dark:text-stone-500" />
      </button>
    </div>
  );
}
