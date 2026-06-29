import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wrench,
  ChevronRight,
  Globe,
  Bot,
  MessageCircle,
  Terminal,
  Container,
  Info,
  Plus,
  Workflow,
} from "lucide-react";
import { Checkbox } from "../common/Checkbox";
import type { ToolState, ToolCategory, ToolParamInfo } from "../../types";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useClientPagination } from "../../hooks/useClientPagination";
import { Pagination } from "../common/Pagination";
import {
  createPagedGroups,
  SelectorActionBar,
  SelectorActionButton,
  SelectorModalHeader,
  SelectorModalPortal,
  SelectorModalShell,
} from "./shared";

interface ToolSelectorProps {
  tools: ToolState[];
  onToggleTool: (toolName: string) => void;
  onToggleCategory: (category: ToolCategory, enabled: boolean) => void;
  onToggleAll: (enabled: boolean) => void;
  isLoading?: boolean;
  enabledCount: number;
  totalCount: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categoryIcons: Record<ToolCategory, typeof Bot> = {
  builtin: Terminal,
  skill: Bot,
  human: MessageCircle,
  mcp: Globe,
  sandbox: Container,
  internal: Workflow,
};

export function ToolSelector({
  tools,
  onToggleTool,
  onToggleCategory,
  onToggleAll,
  enabledCount,
  totalCount,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}: ToolSelectorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalIsOpen ?? internalOpen;
  const setIsOpen = externalOnOpenChange ?? setInternalOpen;
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ToolCategory>
  >(new Set(["mcp"]));
  const swipeRef = useSwipeToClose({
    onClose: () => setIsOpen(false),
    enabled: isOpen,
  });

  const { page, pageSize, setPage, totalPages } = useClientPagination({
    total: tools.length,
  });

  useBodyScrollLock(isOpen);

  const { fullGroups: sortedGroupedTools, pagedGroups: pagedGroupedTools } =
    useMemo(
      () =>
        createPagedGroups(tools, {
          page,
          pageSize,
          getGroupKey: (tool) => tool.category,
          sortItems: (a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        }),
      [tools, page, pageSize],
    );

  const toggleToolExpand = (toolName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolName)) {
        newSet.delete(toolName);
      } else {
        newSet.add(toolName);
      }
      return newSet;
    });
  };

  const toggleCategoryExpand = (category: ToolCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const ModalContent = () => (
    <SelectorModalShell ref={swipeRef as React.RefObject<HTMLDivElement>}>
      <SelectorModalHeader
        icon={
          <Wrench
            size={16}
            className="text-stone-500 dark:text-amber-400 sm:w-[18px] sm:h-[18px]"
          />
        }
        title={t("tools.title")}
        subtitle={t("tools.selected", {
          enabled: enabledCount,
          total: totalCount,
        })}
        onClose={() => setIsOpen(false)}
      />

      {/* Actions */}
      <SelectorActionBar>
        <SelectorActionButton onClick={() => onToggleAll(true)}>
          {t("tools.selectAll")}
        </SelectorActionButton>
        <div className="w-px h-4 bg-stone-200 dark:bg-stone-700" />
        <SelectorActionButton onClick={() => onToggleAll(false)}>
          {t("tools.deselectAll")}
        </SelectorActionButton>
        <div className="flex-1" />
        <SelectorActionButton
          accent
          onClick={() => {
            setIsOpen(false);
            navigate("/mcp");
          }}
        >
          <Plus size={14} />
          <span>{t("tools.add")}</span>
        </SelectorActionButton>
      </SelectorActionBar>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5">
        {Object.entries(pagedGroupedTools).map(
          ([category, pagedCategoryTools]: [string, ToolState[]]) => {
            const cat = category as ToolCategory;
            const Icon = categoryIcons[cat];
            const allCategoryTools = sortedGroupedTools[cat] || [];
            const enabledInCategory = allCategoryTools.filter(
              (t: ToolState) => t.enabled,
            ).length;
            const allEnabled = enabledInCategory === allCategoryTools.length;
            const isExpanded = expandedCategories.has(cat);
            const isToggleableCategory = cat === "mcp";

            return (
              <div
                key={category}
                className="rounded-xl border border-stone-200/80 dark:border-stone-700/60 overflow-hidden bg-stone-50/50 dark:bg-stone-800/40"
              >
                {/* Category Header */}
                <div
                  className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-2.5 cursor-pointer hover:bg-stone-100/60 dark:hover:bg-stone-700/40 active:bg-stone-100 dark:active:bg-stone-700/50 transition-all duration-200"
                  onClick={() => toggleCategoryExpand(cat)}
                >
                  <ChevronRight
                    size={16}
                    className={`text-stone-400 dark:text-stone-500 transition-transform duration-200 ease-out ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center shadow-sm border border-stone-100 dark:border-stone-600">
                    <Icon
                      size={13}
                      className="text-stone-500 dark:text-stone-400 sm:w-[14px] sm:h-[14px]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] sm:text-sm font-medium text-stone-700 dark:text-stone-200">
                      {t(`tools.categories.${cat}`)}
                    </span>
                    <span className="ml-1.5 sm:ml-2 text-xs sm:text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                      {enabledInCategory}/{allCategoryTools.length}
                    </span>
                  </div>
                  <Checkbox
                    checked={allEnabled}
                    onChange={() => onToggleCategory(cat, !allEnabled)}
                    disabled={!isToggleableCategory}
                  />
                </div>

                {/* Tools List */}
                {isExpanded && (
                  <div className="animate-[fade-in_150ms_ease-out]">
                    <div className="px-1 sm:px-2 pb-2 pt-1 space-y-0.5">
                      {pagedCategoryTools.map((tool: ToolState) => {
                        const isToolExpanded = expandedTools.has(tool.name);
                        const hasParams =
                          tool.parameters && tool.parameters.length > 0;
                        const isToggleableTool =
                          tool.category === "mcp" && !tool.system_disabled;

                        return (
                          <div key={tool.name} className="group">
                            {/* Tool Row */}
                            <div
                              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-2 sm:py-2 rounded-lg transition-all duration-150 ${
                                isToggleableTool
                                  ? "cursor-pointer"
                                  : "cursor-default"
                              } ${
                                tool.enabled
                                  ? isToggleableTool
                                    ? "hover:bg-stone-50 dark:hover:bg-stone-700/30 active:bg-stone-100/80 dark:active:bg-stone-600/40"
                                    : ""
                                  : "bg-[var(--theme-primary)]/[0.06] dark:bg-[var(--theme-primary)]/[0.08] hover:bg-[var(--theme-primary)]/[0.12] dark:hover:bg-[var(--theme-primary)]/[0.14] active:bg-[var(--theme-primary)]/[0.18] dark:active:bg-[var(--theme-primary)]/[0.20]"
                              }`}
                              onClick={() => {
                                if (isToggleableTool) onToggleTool(tool.name);
                              }}
                            >
                              {/* Expand button for tools with params */}
                              <button
                                onClick={(e) => toggleToolExpand(tool.name, e)}
                                className={`p-1 -ml-1 rounded transition-all duration-200 touch-manip ${
                                  hasParams
                                    ? "hover:bg-stone-100 dark:hover:bg-stone-600 active:bg-stone-200 dark:active:bg-stone-500"
                                    : ""
                                }`}
                              >
                                {hasParams ? (
                                  <ChevronRight
                                    size={14}
                                    className={`text-stone-400 dark:text-stone-500 transition-transform duration-200 ease-out ${
                                      isToolExpanded ? "rotate-90" : ""
                                    }`}
                                  />
                                ) : (
                                  <div className="w-[14px] h-[14px]" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span
                                    className={`text-[12px] sm:text-[13px] font-medium truncate ${
                                      tool.enabled
                                        ? "text-stone-700 dark:text-stone-200"
                                        : "text-[var(--theme-primary)] dark:text-[var(--theme-primary)]"
                                    }`}
                                  >
                                    {tool.name}
                                  </span>
                                  {tool.server && (
                                    <span className="text-[9px] sm:text-xs px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-amber-500/20 text-stone-500 dark:text-amber-400 font-medium">
                                      {tool.server}
                                    </span>
                                  )}
                                  {tool.system_disabled && (
                                    <span className="text-[9px] sm:text-xs px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-medium">
                                      {t("tools.systemDisabled")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5 leading-relaxed text-left">
                                  {tool.description || t("tools.noDescription")}
                                </p>
                              </div>
                              <Checkbox
                                checked={tool.enabled}
                                onChange={() => onToggleTool(tool.name)}
                                disabled={!isToggleableTool}
                              />
                            </div>

                            {/* Parameters - Conditional Render */}
                            {isToolExpanded && hasParams && (
                              <div className="animate-[fade-in_150ms_ease-out]">
                                <div className="mx-2 sm:mx-4 mb-1.5 sm:mb-2 rounded-lg border border-stone-200/80 dark:border-stone-600/50 overflow-hidden">
                                  {/* Table Header */}
                                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-100 dark:bg-stone-700/60 border-b border-stone-200/80 dark:border-stone-600/50">
                                    <Info
                                      size={10}
                                      className="text-stone-400 dark:text-stone-500 sm:w-[11px] sm:h-[11px]"
                                    />
                                    <span className="text-xs sm:text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                                      {t("tools.parameters")}
                                    </span>
                                  </div>
                                  {/* Table Body */}
                                  <div className="bg-white dark:bg-stone-800">
                                    <table className="w-full text-xs sm:text-xs">
                                      <thead>
                                        <tr className="border-b border-stone-100 dark:border-stone-700">
                                          <th className="px-2.5 sm:px-3 py-1.5 text-left font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide w-auto">
                                            {t("tools.table.name")}
                                          </th>
                                          <th className="px-2.5 sm:px-3 py-1.5 text-left font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide w-16 sm:w-20">
                                            {t("tools.table.type")}
                                          </th>
                                          <th className="px-2.5 sm:px-3 py-1.5 text-left font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                                            {t("tools.table.description")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tool.parameters!.map(
                                          (param: ToolParamInfo) => (
                                            <tr
                                              key={param.name}
                                              className={`border-b border-stone-50 dark:border-stone-700/50 last:border-b-0 hover:bg-stone-50/50 dark:hover:bg-stone-700/30 transition-colors`}
                                            >
                                              <td className="px-2.5 sm:px-3 py-1.5">
                                                <div className="flex items-center gap-1">
                                                  <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-amber-500/20 text-stone-600 dark:text-amber-400 font-mono font-medium">
                                                    {param.name}
                                                  </code>
                                                  {param.required && (
                                                    <span className="text-[8px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-medium">
                                                      *
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-2.5 sm:px-3 py-1.5">
                                                <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-mono text-xs">
                                                  {param.type}
                                                </span>
                                              </td>
                                              <td className="px-2.5 sm:px-3 py-1.5 text-stone-500 dark:text-stone-400 leading-relaxed">
                                                {param.description || "-"}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-4 sm:px-5 py-2 border-t border-stone-200/80 dark:border-stone-700/80 bg-stone-50/80 dark:bg-stone-800/50">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={tools.length}
            onChange={setPage}
          />
        </div>
      )}

      {/* Footer */}
      <div className="safe-area-bottom [--safe-area-bottom-extra:0.75rem] px-4 sm:px-5 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/50">
        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-2.5 px-4 bg-stone-900 dark:bg-stone-600 text-white dark:text-stone-100 rounded-xl font-medium text-sm hover:bg-stone-800 dark:hover:bg-stone-500 active:bg-stone-700 dark:active:bg-stone-600 transition-colors"
        >
          {t("tools.done")}
        </button>
      </div>
    </SelectorModalShell>
  );

  // When controlled externally, only render the modal — no trigger button
  if (externalOnOpenChange) {
    return (
      <SelectorModalPortal open={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent />
      </SelectorModalPortal>
    );
  }

  // 空状态：没有工具时显示禁用状态的图标（仅非外部控制模式）
  if (totalCount === 0) {
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center justify-center rounded-full p-2 border border-stone-200/50 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-800/50 text-stone-300 dark:text-stone-600 cursor-not-allowed"
          title={t("tools.noTools")}
        >
          <Wrench size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Trigger - ChatGPT style circular button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
        className="chat-tool-btn"
        title={`${enabledCount}/${totalCount} ${t("tools.toolsEnabled")}`}
      >
        <Wrench size={18} />
      </button>

      {/* Modal */}
      {isOpen && (
        <SelectorModalPortal open={isOpen} onClose={() => setIsOpen(false)}>
          <ModalContent />
        </SelectorModalPortal>
      )}
    </div>
  );
}
