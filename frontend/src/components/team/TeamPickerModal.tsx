import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Users, Plus, Check, X } from "lucide-react";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";
import { teamApi } from "../../services/api/team";
import type { Team } from "../../types/team";

interface TeamPickerModalProps {
  isOpen: boolean;
  selectedTeamId: string | null;
  onSelect: (teamId: string | null) => void;
  onClose: () => void;
  onCreateNew: () => void;
}

export function TeamPickerModal({
  isOpen,
  selectedTeamId,
  onSelect,
  onClose,
  onCreateNew,
}: TeamPickerModalProps) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const sheetRef = useSwipeToClose({ onClose });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      teamApi
        .list(0, 50)
        .then((res) => setTeams(res.teams))
        .catch((err) => console.error("Failed to load teams:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (teamId: string) => {
      onSelect(teamId);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleCreateNew = useCallback(() => {
    onCreateNew();
    onClose();
  }, [onCreateNew, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        data-yields-sidebar
        className="fixed inset-0 z-[300] bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed z-[301] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 inset-x-0 bottom-0 animate-slide-up sm:animate-scale-in"
        onClick={onClose}
      >
        <div
          ref={sheetRef as React.Ref<HTMLDivElement>}
          className="sm:rounded-xl rounded-t-xl shadow-2xl w-full sm:w-[420px] max-h-[70vh] sm:max-h-[65vh] flex flex-col overflow-hidden"
          style={{ background: "var(--theme-bg-card)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="w-6 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-3 border-b"
            style={{ borderColor: "var(--theme-border)" }}
          >
            <div>
              <h2 className="text-sm font-semibold text-[var(--theme-text)]">
                {t("team.selectTeam", "选择团队")}
              </h2>
              <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                {t("team.selectTeamDesc", "选择一个团队进行协作")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[var(--theme-primary)] text-white dark:text-stone-100 hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3 w-3" />
                {t("common.new", "新建")}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-[var(--theme-bg)] transition-colors"
              >
                <X size={16} className="text-[var(--theme-text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Team list */}
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
            {loading && (
              <p className="text-xs text-[var(--theme-text-secondary)] text-center py-8">
                {t("common.loading", "加载中...")}
              </p>
            )}
            {!loading && teams.length === 0 && (
              <p className="text-xs text-[var(--theme-text-secondary)] text-center py-8">
                {t("team.noTeams", "暂无团队。创建一个团队以开始协作。")}
              </p>
            )}
            {!loading &&
              teams.map((team) => {
                const isActive = team.id === selectedTeamId;
                return (
                  <button
                    key={team.id}
                    type="button"
                    className={`relative flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 overflow-hidden ${
                      isActive
                        ? "bg-[var(--theme-primary-light)]"
                        : "hover:bg-[var(--theme-bg)]"
                    }`}
                    onClick={() => handleSelect(team.id)}
                  >
                    {/* Color bar for selected */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
                        style={{ background: "var(--theme-primary)" }}
                      />
                    )}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
                      <Users
                        size={15}
                        className={`${
                          isActive
                            ? "text-[var(--theme-primary)]"
                            : "text-[var(--theme-text-secondary)]"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[13px] font-medium truncate block ${
                          isActive
                            ? "text-[var(--theme-text)]"
                            : "text-[var(--theme-text-secondary)]"
                        }`}
                      >
                        {team.name}
                      </span>
                      <p className="text-[11px] text-[var(--theme-text-secondary)] truncate mt-0.5">
                        {team.members.filter((m) => m.enabled).length}{" "}
                        {t("team.members", "成员")}
                      </p>
                    </div>
                    {isActive && (
                      <Check
                        size={16}
                        className="text-[var(--theme-primary)] shrink-0"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
          </div>

          {/* Footer */}
          <div
            className="px-4 sm:px-5 py-2.5 border-t bg-[var(--theme-bg)] pb-[max(0.625rem,env(safe-area-inset-bottom))]"
            style={{ borderColor: "var(--theme-border)" }}
          >
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors"
            >
              {t("common.done", "完成")}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
