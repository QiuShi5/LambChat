import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

export interface SkillFilterOption<T extends string> {
  value: T;
  label: string;
}

interface SkillFilterDropdownProps<T extends string> {
  isOpen: boolean;
  label: string;
  icon?: ReactNode;
  activeCount: number;
  options?: Array<SkillFilterOption<T>>;
  value?: T;
  tags: string[];
  selectedTags: string[];
  tagsLabel: string;
  clearLabel: string;
  onOpenChange: (open: boolean) => void;
  onValueChange?: (value: T) => void;
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
}

const DROPDOWN_GUTTER = 12;
const FILTER_DROPDOWN_WIDTH = 288;

function getViewportBounds() {
  const visualViewport = window.visualViewport;
  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
    offsetTop: visualViewport?.offsetTop ?? 0,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
  };
}

function getDropdownPosition(
  trigger: HTMLButtonElement,
  width: number,
): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const viewport = getViewportBounds();
  const availableWidth = viewport.width - DROPDOWN_GUTTER * 2;
  const renderedWidth = Math.min(width, availableWidth);
  const minLeft = viewport.offsetLeft + DROPDOWN_GUTTER;
  const maxLeft =
    viewport.offsetLeft + viewport.width - renderedWidth - DROPDOWN_GUTTER;
  const left = Math.min(Math.max(minLeft, rect.right - renderedWidth), maxLeft);
  const top = viewport.offsetTop + rect.bottom + 8;
  const maxHeight = Math.max(
    160,
    viewport.offsetTop + viewport.height - top - DROPDOWN_GUTTER,
  );

  return {
    top,
    left,
    width: renderedWidth,
    maxHeight,
  };
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SkillFilterDropdown<T extends string>({
  isOpen,
  label,
  icon,
  activeCount,
  options,
  value,
  tags,
  selectedTags,
  tagsLabel,
  clearLabel,
  onOpenChange,
  onValueChange,
  onToggleTag,
  onClearFilters,
}: SkillFilterDropdownProps<T>) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(
    null,
  );
  const hasActiveFilters = activeCount > 0;

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      setDropdownStyle(
        getDropdownPosition(triggerRef.current, FILTER_DROPDOWN_WIDTH),
      );
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    updatePosition();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, onOpenChange]);

  const panel =
    isOpen && dropdownStyle
      ? createPortal(
          <div
            className="fixed inset-0 z-[999]"
            data-panel-header-dropdown
            onPointerDown={() => onOpenChange(false)}
          >
            <div
              className="skill-filter-dropdown panel-header-dropdown fixed overflow-hidden rounded-2xl border bg-[var(--skill-surface)] p-3 shadow-lg"
              role="menu"
              style={dropdownStyle}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {options && options.length > 0 && value && onValueChange && (
                <div className="skill-filter-segment mb-3">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={value === option.value}
                      onClick={() => onValueChange(option.value)}
                      className={cx(
                        "skill-filter-segment__item",
                        value === option.value &&
                          "skill-filter-segment__item--active",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-text-secondary)]">
                      {tagsLabel}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="text-xs text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-primary)]"
                      >
                        {clearLabel}
                      </button>
                    )}
                  </div>
                  <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={selectedTags.includes(tag)}
                        onClick={() => onToggleTag(tag)}
                        className={cx(
                          "skill-tag-chip",
                          selectedTags.includes(tag) &&
                            "skill-tag-chip--active",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => onOpenChange(!isOpen)}
        className={cx(
          "ui-button ui-button--secondary ui-button--md panel-filter-trigger h-10 px-3",
          hasActiveFilters &&
            "border-[var(--theme-primary)] text-[var(--theme-text)]",
        )}
      >
        {icon}
        <span className="panel-filter-trigger__label">{label}</span>
        {hasActiveFilters && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--theme-primary-light)] px-1 text-[11px]">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={16}
          className={cx("transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {panel}
    </>
  );
}
