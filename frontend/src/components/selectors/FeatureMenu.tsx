import {
  useState,
  useRef,
  useEffect,
  memo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Wrench,
  Sparkles,
  Bot,
  Brain,
  Plus,
  UserRound,
  UsersRound,
  ChevronDown,
  Upload,
  Layers,
  Settings2,
  ToggleLeft,
} from "lucide-react";
import { THINKING_LEVEL_COLOR } from "../chat/chatInputConstants";

import type { AgentOption, FileCategory } from "../../types";

export type FeaturePanel =
  | "persona"
  | "team"
  | "tools"
  | "skills"
  | "agent"
  | "thinking"
  | null;

interface FeatureMenuProps {
  activePanel: FeaturePanel;
  onOpen: (panel: FeaturePanel) => void;
  enabledToolsCount: number;
  totalToolsCount: number;
  enabledSkillsCount: number;
  totalSkillsCount: number;
  hasPersonaSelector?: boolean;
  personaName?: string | null;
  hasTeamSelector?: boolean;
  totalTeamCount?: number;
  hasAgentSelector: boolean;
  agentName?: string | null;
  hasThinkingOption: boolean;
  thinkingLabel?: string;
  thinkingLevel?: string;
  booleanAgentOptions?: Record<string, AgentOption>;
  agentOptionValues?: Record<string, boolean | string | number>;
  onToggleAgentOption?: (key: string, value: boolean | string | number) => void;
  // File upload
  uploadCategories: FileCategory[];
  onUploadFiles: () => void;
}

function MenuGroup({
  label,
  icon,
  defaultExpanded = false,
  children,
}: {
  label: string;
  icon: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="feature-menu-group" role="group">
      <button
        type="button"
        className="feature-menu-group-header"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="feature-menu-group-icon">{icon}</span>
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          size={16}
          className="feature-menu-chevron"
          data-open={expanded ? "true" : undefined}
        />
      </button>
      <div
        className="feature-menu-group-body"
        data-expanded={expanded ? "" : undefined}
      >
        <div className="feature-menu-group-inner">{children}</div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  badge,
  badgeColor,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  active?: boolean;
  onClick: () => void;
}) {
  const color = THINKING_LEVEL_COLOR[badgeColor ?? ""];
  return (
    <button
      type="button"
      onClick={onClick}
      className="feature-menu-item"
      data-active={active ? "" : undefined}
    >
      <span className="feature-menu-item-icon">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <span
          className="feature-menu-item-badge"
          style={
            color
              ? {
                  color: color.text,
                  background: color.bg,
                }
              : undefined
          }
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export const FeatureMenu = memo(function FeatureMenu({
  activePanel,
  onOpen,
  enabledToolsCount,
  totalToolsCount,
  enabledSkillsCount,
  totalSkillsCount,
  hasPersonaSelector = false,
  personaName,
  hasTeamSelector = false,
  totalTeamCount = 0,
  hasAgentSelector,
  agentName,
  hasThinkingOption,
  thinkingLabel,
  thinkingLevel,
  booleanAgentOptions,
  agentOptionValues = {},
  onToggleAgentOption,
  uploadCategories,
  onUploadFiles,
}: FeatureMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (activePanel) setIsOpen(false);
  }, [activePanel]);

  const getDropdownStyle = (): CSSProperties => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return { display: "none" };
    const vw = window.innerWidth;
    const dropdownW = Math.min(
      vw < 640 ? Math.min(240, vw - 40) : 320,
      vw - 16,
    );
    const left = Math.max(8, Math.min(rect.left, vw - dropdownW - 8));
    return {
      position: "fixed",
      bottom: window.innerHeight - rect.top + 8,
      left,
      width: dropdownW,
      zIndex: 9999,
    };
  };

  const booleanOptionEntries = Object.entries(booleanAgentOptions ?? {});
  const hasFeatureItems =
    totalToolsCount > 0 ||
    totalSkillsCount > 0 ||
    hasPersonaSelector ||
    hasTeamSelector ||
    hasAgentSelector ||
    hasThinkingOption ||
    booleanOptionEntries.length > 0;
  if (!hasFeatureItems && uploadCategories.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={isOpen ? { position: "relative", zIndex: 10000 } : undefined}
        className="chat-tool-btn"
        aria-label={t("chat.features", "功能")}
      >
        <Plus size={18} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="feature-menu-dropdown"
            style={{
              ...getDropdownStyle(),
              background: "var(--theme-bg-card)",
              borderColor: "var(--theme-border)",
            }}
          >
            {uploadCategories.length > 0 && (
              <MenuItem
                icon={<Upload size={18} />}
                label={t("featureMenu.upload", "上传")}
                onClick={() => {
                  onUploadFiles();
                  setIsOpen(false);
                }}
              />
            )}
            {(hasPersonaSelector ||
              hasTeamSelector ||
              totalToolsCount > 0 ||
              totalSkillsCount > 0) && (
              <MenuGroup
                label={t("featureMenu.enhance", "增强")}
                icon={<Layers size={18} />}
              >
                {hasPersonaSelector && (
                  <MenuItem
                    icon={<UserRound size={18} />}
                    label={t("featureMenu.persona", "角色")}
                    badge={personaName || undefined}
                    active={activePanel === "persona"}
                    onClick={() => onOpen("persona")}
                  />
                )}
                {hasTeamSelector && (
                  <MenuItem
                    icon={<UsersRound size={18} />}
                    label={t("featureMenu.team", "团队")}
                    badge={totalTeamCount > 0 ? `${totalTeamCount}` : undefined}
                    active={activePanel === "team"}
                    onClick={() => onOpen("team")}
                  />
                )}
                {totalToolsCount > 0 && (
                  <MenuItem
                    icon={<Wrench size={18} />}
                    label={t("tools.title")}
                    badge={`${enabledToolsCount}/${totalToolsCount}`}
                    active={activePanel === "tools"}
                    onClick={() => onOpen("tools")}
                  />
                )}
                {totalSkillsCount > 0 && (
                  <MenuItem
                    icon={<Sparkles size={18} />}
                    label={t("skillSelector.title", "技能")}
                    badge={`${enabledSkillsCount}/${totalSkillsCount}`}
                    active={activePanel === "skills"}
                    onClick={() => onOpen("skills")}
                  />
                )}
              </MenuGroup>
            )}
            {(hasAgentSelector ||
              hasThinkingOption ||
              booleanOptionEntries.length > 0) && (
              <MenuGroup
                label={t("featureMenu.settings", "设置")}
                icon={<Settings2 size={18} />}
              >
                {hasAgentSelector && (
                  <MenuItem
                    icon={<Bot size={18} />}
                    label={t("agent.selectMode", "选择模式")}
                    badge={agentName ? t(agentName) : undefined}
                    active={activePanel === "agent"}
                    onClick={() => onOpen("agent")}
                  />
                )}
                {hasThinkingOption && (
                  <MenuItem
                    icon={<Brain size={18} />}
                    label={t("chat.thinkingIntensity", "思考强度")}
                    badge={thinkingLabel}
                    badgeColor={thinkingLevel}
                    active={activePanel === "thinking"}
                    onClick={() => onOpen("thinking")}
                  />
                )}
                {booleanOptionEntries.map(([key, option]) => {
                  const value = agentOptionValues[key] ?? option.default;
                  const enabled = value === true;
                  const label = option.label_key
                    ? t(option.label_key)
                    : option.label;
                  return (
                    <MenuItem
                      key={key}
                      icon={<ToggleLeft size={18} />}
                      label={label}
                      badge={
                        enabled ? t("common.on", "On") : t("common.off", "Off")
                      }
                      active={enabled}
                      onClick={() => onToggleAgentOption?.(key, !enabled)}
                    />
                  );
                })}
              </MenuGroup>
            )}
          </div>,
          document.body,
        )}
    </>
  );
});
