import type { ReactNode } from "react";
import clsx from "clsx";

interface ViewerTopBarProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ViewerTopBar({
  children,
  className,
  contentClassName,
}: ViewerTopBarProps) {
  return (
    <div className={clsx("safe-area-top bg-black", className)}>
      <div
        className={clsx(
          "flex h-16 items-center justify-between px-3 sm:px-6",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
