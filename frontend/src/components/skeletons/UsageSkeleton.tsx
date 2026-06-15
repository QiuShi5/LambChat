import { SkeletonLine } from "./primitives";
import { PanelHeaderSkeleton } from "./PanelHeaderSkeleton";
import { PanelPaginationSkeleton } from "./PanelSkeletonHelpers";

/** Usage panel: header + stats bar + logs section header + table skeleton matching real UsagePanel layout */
export function UsagePanelSkeleton() {
  return (
    <div className="glass-shell usage-panel flex h-full min-h-0 flex-col overflow-y-auto sm:overflow-hidden animate-fade-in">
      <PanelHeaderSkeleton hasSearch hasSubtitle />

      {/* Stat Metrics — matches real usage-surface grid container with StatMetric items */}
      <div className="px-4 py-2 sm:px-6 sm:py-3">
        <div className="usage-surface grid grid-cols-2 gap-1 rounded-lg p-1.5 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex min-w-0 flex-col gap-1 rounded-lg px-3 py-2.5"
            >
              {/* Icon + label row */}
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor:
                      "var(--usage-icon-bg, var(--glass-bg-subtle))",
                  }}
                >
                  <div className="skeleton-line size-[13px] rounded" />
                </div>
                <SkeletonLine width="w-10 sm:w-12" className="!h-[13px]" />
              </div>
              {/* Value row */}
              <SkeletonLine
                width={i % 2 === 0 ? "w-8 sm:w-12" : "w-6 sm:w-10"}
                className="!h-[18px] mt-0.5 pl-8"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content area — matches real relative min-h-0 flex-1 overflow layout */}
      <div className="relative min-h-0 flex-1 overflow-visible px-4 py-2 sm:overflow-y-auto sm:px-6 sm:py-4">
        {/* Logs section header — matches LogsSectionHeader */}
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
          <SkeletonLine width="w-16" className="!h-3.5" />
          <SkeletonLine width="w-20" className="!h-[11px]" />
        </div>

        {/* ── Desktop table skeleton (lg+) ── */}
        <div className="hidden lg:block">
          <div className="usage-surface overflow-x-auto rounded-lg">
            {/* Table header */}
            <div
              className="flex items-center gap-4 px-4 py-2"
              style={{
                borderBottom:
                  "1px solid color-mix(in srgb, var(--theme-border) 80%, transparent)",
              }}
            >
              <SkeletonLine
                width="w-20 xl:w-24"
                className="!h-[13px] !rounded"
              />
              <SkeletonLine
                width="w-14 xl:w-16"
                className="!h-[11px] !rounded text-right"
              />
              <SkeletonLine
                width="w-14 xl:w-16"
                className="!h-[13px] !rounded"
              />
              <SkeletonLine
                width="w-12 xl:w-14"
                className="!h-[13px] !rounded"
              />
              <div className="flex-1" />
              <SkeletonLine
                width="w-12"
                className="!h-[11px] !rounded text-right"
              />
              <SkeletonLine
                width="w-12"
                className="!h-[11px] !rounded text-right"
              />
              <SkeletonLine
                width="w-14"
                className="!h-[11px] !rounded text-right"
              />
              <SkeletonLine
                width="w-12"
                className="!h-[11px] !rounded text-right"
              />
              <SkeletonLine
                width="w-10"
                className="!h-[11px] !rounded text-center"
              />
            </div>
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-2.5"
                style={{
                  borderBottom:
                    "1px solid var(--glass-border, var(--theme-border))",
                }}
              >
                <SkeletonLine width="w-20" className="!h-3 shrink-0" />
                <SkeletonLine
                  width="w-14"
                  className="!h-3 shrink-0 text-right"
                />
                <SkeletonLine width="w-14" className="!h-3 shrink-0" />
                <SkeletonLine width="w-12" className="!h-3 shrink-0" />
                <div className="flex-1" />
                <SkeletonLine
                  width="w-10"
                  className="!h-3 shrink-0 text-right"
                />
                <SkeletonLine
                  width="w-10"
                  className="!h-3 shrink-0 text-right"
                />
                <SkeletonLine
                  width="w-12"
                  className="!h-3 shrink-0 text-right font-semibold"
                />
                <SkeletonLine
                  width="w-8"
                  className="!h-3 shrink-0 text-right"
                />
                <SkeletonLine
                  width="w-10"
                  className="!h-[10px] !rounded-full shrink-0 text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Tablet compact skeleton (sm → lg) ── */}
        <div className="hidden sm:block lg:hidden">
          <div className="space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="usage-surface group flex items-center gap-3 rounded-lg px-3.5 py-2.5"
              >
                {/* Time + duration block */}
                <div className="w-24 shrink-0 space-y-1">
                  <SkeletonLine
                    width={i % 2 === 0 ? "w-20" : "w-16"}
                    className="!h-[12px]"
                  />
                  <SkeletonLine
                    width="w-10"
                    className="!h-[10px] !opacity-50"
                  />
                </div>
                {/* Model + status + agent block */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <SkeletonLine
                      width={i % 3 === 0 ? "w-24" : "w-20"}
                      className="!h-[12px]"
                    />
                    <SkeletonLine
                      width="w-8"
                      className="!h-[10px] !rounded-full shrink-0"
                    />
                  </div>
                  <SkeletonLine
                    width="w-14"
                    className="!h-[10px] !opacity-40"
                  />
                </div>
                {/* Token numbers */}
                <div className="flex items-center gap-2 shrink-0">
                  <SkeletonLine width="w-8" className="!h-[12px]" />
                  <SkeletonLine width="w-8" className="!h-[12px]" />
                  <SkeletonLine
                    width="w-10"
                    className="!h-[12px] font-semibold"
                  />
                </div>
                {/* Admin avatar */}
                <div className="skeleton-line size-6 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile card skeleton — matches MobileCard structure ── */}
        <div className="space-y-2 sm:hidden pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="usage-surface group overflow-hidden rounded-lg"
            >
              <div className="px-3 py-2.5">
                {/* Header: icon + model + status pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor:
                          "var(--usage-icon-bg, var(--glass-bg-subtle))",
                      }}
                    >
                      <div className="skeleton-line size-[12px] rounded" />
                    </div>
                    <div className="min-w-0">
                      <SkeletonLine
                        width={i % 2 === 0 ? "w-28" : "w-20"}
                        className="!h-[12px]"
                      />
                      <SkeletonLine
                        width="w-12"
                        className="!h-[10px] !mt-0.5 !opacity-50"
                      />
                    </div>
                  </div>
                  <SkeletonLine
                    width="w-10"
                    className="!h-[10px] !rounded-full shrink-0"
                  />
                </div>

                {/* Token grid — matches 3-col grid in MobileCard */}
                <div
                  className="mt-2 grid grid-cols-3 gap-1.5 rounded-md px-2 py-1.5"
                  style={{
                    backgroundColor:
                      "var(--usage-inset-bg, var(--glass-bg-subtle))",
                  }}
                >
                  {[0, 1, 2].map((j) => (
                    <div key={j}>
                      <SkeletonLine width="w-8" className="!h-[9px]" />
                      <SkeletonLine width="w-10" className="!h-[12px] mt-0.5" />
                    </div>
                  ))}
                </div>

                {/* Footer — time + username + duration */}
                <div className="mt-2 flex items-center justify-between">
                  <SkeletonLine
                    width="w-20"
                    className="!h-[11px] !opacity-40"
                  />
                  <div className="flex items-center gap-2">
                    <div className="skeleton-line size-5 rounded-full shrink-0" />
                    <SkeletonLine
                      width="w-8"
                      className="!h-[11px] !opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination placeholder */}
        <PanelPaginationSkeleton variant="wide" />
      </div>
    </div>
  );
}
