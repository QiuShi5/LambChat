import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";

export const SELECTOR_MODAL_SHELL_CLASS =
  "sm:rounded-2xl rounded-t-2xl shadow-2xl w-full sm:w-[40%] sm:min-w-[600px] min-h-[40vh] sm:max-h-[80vh] max-h-[85vh] max-h-[85dvh] flex flex-col overflow-hidden";

interface SelectorModalShellProps extends HTMLAttributes<HTMLDivElement> {
  style?: CSSProperties;
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const SelectorModalShell = forwardRef<
  HTMLDivElement,
  SelectorModalShellProps
>(function SelectorModalShell({ className, style, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cx(SELECTOR_MODAL_SHELL_CLASS, className)}
      style={{ background: "var(--theme-bg-card)", ...style }}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
});
