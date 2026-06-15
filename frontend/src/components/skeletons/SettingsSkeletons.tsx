import { SkeletonLine } from "./primitives";
import { PanelHeaderSkeleton } from "./PanelHeaderSkeleton";
import { PanelSegmentedTabsSkeleton } from "./PanelSkeletonHelpers";

/** Agent panel: single divided container with tab switcher */
export function AgentPanelSkeleton() {
  return (
    <div className="glass-shell flex h-full flex-col min-h-0 animate-fade-in">
      <PanelHeaderSkeleton hasSearch={false} />
      {/* Tab bar — segmented control */}
      <PanelSegmentedTabsSkeleton
        activeWidth="w-16 sm:w-20"
        inactiveWidth="w-12 sm:w-16"
      />
      {/* Description text */}
      <div className="px-4 sm:px-6">
        <SkeletonLine
          width="w-3/4"
          className="!h-3 !opacity-60 hidden sm:block"
        />
      </div>
      {/* Agent list — plain container with divide-y (matches real layout) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <div
          className="rounded-xl divide-y divide-[var(--theme-border)]"
          style={{
            backgroundColor:
              "var(--theme-bg-card, color-mix(in srgb, var(--theme-bg) 80%, white))",
            border: "1px solid var(--theme-border)",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-[var(--theme-border)]"
                  style={{
                    backgroundColor:
                      "var(--theme-bg-subtle, color-mix(in srgb, var(--theme-bg) 85%, white))",
                  }}
                >
                  <div className="skeleton-line size-5 rounded-md" />
                </div>
                <div className="min-w-0 flex-1">
                  <SkeletonLine
                    width={i % 2 === 0 ? "w-20 sm:w-28" : "w-28 sm:w-36"}
                    className="!h-[13px] sm:!h-[14px]"
                  />
                  <SkeletonLine
                    width="w-3/5"
                    className="!h-2.5 sm:!h-3 mt-1 hidden sm:block"
                  />
                </div>
              </div>
              <div className="skeleton-line w-8 sm:w-10 h-4 sm:h-5 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Model panel: model config rows with tab switcher */
export function ModelPanelSkeleton() {
  return (
    <div className="glass-shell flex h-full flex-col min-h-0 animate-fade-in">
      <PanelHeaderSkeleton hasSearch={false} />
      {/* Tab bar — segmented control */}
      <PanelSegmentedTabsSkeleton
        activeWidth="w-14 sm:w-16"
        inactiveWidth="w-20 sm:w-28"
      />
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 space-y-3">
        {/* Toolbar — description text + action buttons on right */}
        <div className="flex items-center justify-between gap-3">
          <SkeletonLine
            width="w-48"
            className="!h-3.5 !opacity-60 hidden sm:block"
          />
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <div className="skeleton-line h-8 w-16 sm:w-20 rounded-lg" />
            <div className="skeleton-line h-8 w-16 sm:w-20 rounded-lg hidden sm:block" />
            <div className="skeleton-line h-8 w-16 sm:w-20 rounded-lg hidden sm:block" />
            <div className="skeleton-line h-8 w-16 sm:w-20 rounded-lg" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl">
            {/* Desktop row */}
            <div className="hidden sm:flex items-center justify-between p-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Drag handle */}
                <div className="skeleton-line size-4 rounded shrink-0 !opacity-30" />
                <div className="skeleton-line size-5 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <SkeletonLine
                    width={i % 2 === 0 ? "w-24 sm:w-32" : "w-20 sm:w-28"}
                    className="!h-[13px] sm:!h-[14px]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Expand chevron */}
                <div className="skeleton-line size-5 rounded" />
                <div className="skeleton-line w-8 sm:w-10 h-4 sm:h-5 rounded-full" />
                <div className="skeleton-line size-7 sm:size-8 rounded-lg" />
                <div className="skeleton-line size-7 sm:size-8 rounded-lg" />
              </div>
            </div>
            {/* Mobile row */}
            <div className="block sm:hidden p-3.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="skeleton-line size-4 rounded shrink-0 !opacity-30" />
                <div className="skeleton-line size-5 rounded shrink-0" />
                <SkeletonLine
                  width={i % 2 === 0 ? "w-24" : "w-20"}
                  className="!h-[13px] flex-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
