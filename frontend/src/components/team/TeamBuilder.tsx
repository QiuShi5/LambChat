import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  ChevronDown,
  Cpu,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import type { PersonaPreset } from "../../types";
import type {
  Team,
  TeamCreateRequest,
  TeamMember,
  TeamRouterToolMode,
} from "../../types/team";
import { TeamMemberCard } from "./TeamMemberCard";
import { teamApi } from "../../services/api/team";
import { modelApi } from "../../services/api/model";
import type { ModelOption } from "../../services/api/model";
import { personaPresetApi } from "../../services/api/personaPreset";
import { ImageWithSkeleton } from "../chat/ChatMessage/ImageWithSkeleton";
import { uploadApi } from "../../services/api";
import { compressImageFile } from "../../utils/imageCompression";
import toast from "react-hot-toast";
import { ConfirmDialog } from "../common/ConfirmDialog";
import {
  PersonaAvatarIcon,
  PersonaAvatarImage,
} from "../persona/PersonaAvatarIcon";
import {
  getEmojiAvatarUrl,
  isEmojiAvatar,
  isPersonaImageAvatar,
} from "../persona/personaAvatar";
import {
  draftRowsToStarterPrompts,
  starterPromptsToDraftRows,
  type StarterPromptDraftRow,
} from "../persona/personaPresetEditor";
import { useOptionalSettingsContext } from "../../contexts/SettingsContext";

export interface TeamBuilderHandle {
  handleSave: () => void;
  handleClone: () => void;
  handleDelete: () => void;
}

export interface TeamBuilderFooterState {
  saving: boolean;
  existingTeamId: string | null;
  hasTeamName: boolean;
}

interface TeamBuilderProps {
  teamId?: string | null;
  onSave?: (team: Team) => void;
  onClose?: () => void;
  surface?: "page" | "sidebar";
  onFormStateChange?: (state: TeamBuilderFooterState) => void;
}

function generateMemberId(): string {
  return `m-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const TEAM_AVATAR_EMOJIS = [
  "✨",
  "🤖",
  "🎓",
  "💻",
  "✍️",
  "🛡️",
  "📊",
  "⚡",
  "📦",
  "🎨",
  "🧠",
  "💬",
];

function tagsToInput(tags: string[] | undefined): string {
  return (tags ?? []).join(", ");
}

function inputToTags(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of value.split(/[,，\n]/)) {
    const tag = raw.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

const ROUTER_DELIVERY_TOOL_NAMES = [
  "reveal_file",
  "reveal_project",
  "transfer_file",
  "transfer_path",
] as const;

const ROUTER_CUSTOM_TOOL_OPTIONS = [
  {
    name: "read_file",
    labelKey: "team.routerToolReadFile",
    label: "Read file",
  },
  { name: "grep", labelKey: "team.routerToolGrep", label: "Grep" },
  { name: "glob", labelKey: "team.routerToolGlob", label: "Glob" },
  { name: "ls", labelKey: "team.routerToolList", label: "List files" },
  {
    name: "write_file",
    labelKey: "team.routerToolWriteFile",
    label: "Write file",
  },
  { name: "edit_file", labelKey: "team.routerToolEditFile", label: "Edit file" },
  { name: "execute", labelKey: "team.routerToolExecute", label: "Execute" },
  {
    name: "image_generate",
    labelKey: "team.routerToolImageGenerate",
    label: "Generate image",
  },
  {
    name: "upload_url_to_sandbox",
    labelKey: "team.routerToolUploadUrl",
    label: "Upload URL",
  },
  {
    name: "copy_upload_file_to_workspace",
    labelKey: "team.routerToolCopyUploadFile",
    label: "Copy upload file",
  },
  {
    name: "create_zip_from_path",
    labelKey: "team.routerToolCreateZip",
    label: "Create zip",
  },
] as const;

export const TeamBuilder = forwardRef<TeamBuilderHandle, TeamBuilderProps>(
  function TeamBuilder(
    { teamId, onSave, onClose, surface = "page", onFormStateChange },
    ref,
  ) {
    const { t } = useTranslation();
    const settingsContext = useOptionalSettingsContext();
    const [presets, setPresets] = useState<PersonaPreset[]>([]);
    const [presetsLoading, setPresetsLoading] = useState(true);
    const [fallbackModels, setFallbackModels] = useState<ModelOption[] | null>(
      null,
    );
    const [searchQuery, setSearchQuery] = useState("");

    const [teamName, setTeamName] = useState("");
    const [teamDescription, setTeamDescription] = useState("");
    const [teamAvatar, setTeamAvatar] = useState<string | null>(null);
    const [teamTagsInput, setTeamTagsInput] = useState("");
    const [teamInstructions, setTeamInstructions] = useState("");
    const [routerToolMode, setRouterToolMode] =
      useState<TeamRouterToolMode>("delivery_only");
    const [routerAllowedTools, setRouterAllowedTools] = useState<string[]>([]);
    const [starterPromptRows, setStarterPromptRows] = useState<
      StarterPromptDraftRow[]
    >([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [defaultMemberId, setDefaultMemberId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [existingTeamId, setExistingTeamId] = useState<string | null>(null);
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const rolePickerRef = useRef<HTMLDivElement>(null);
    const availableModels = settingsContext?.availableModels ?? fallbackModels;

    useImperativeHandle(ref, () => ({
      handleSave,
      handleClone,
      handleDelete: () => {
        if (existingTeamId) setShowDeleteConfirm(true);
      },
    }));

    const hasTeamName = teamName.trim().length > 0;

    useEffect(() => {
      onFormStateChange?.({
        saving,
        existingTeamId,
        hasTeamName,
      });
    }, [saving, existingTeamId, hasTeamName, onFormStateChange]);

    useEffect(() => {
      personaPresetApi
        .list({ limit: 100 })
        .then((res) => {
          setPresets(res.presets);
          setPresetsLoading(false);
        })
        .catch(() => {
          setPresetsLoading(false);
        });
    }, []);

    useEffect(() => {
      if (settingsContext?.availableModels) {
        setFallbackModels(null);
        return;
      }
      let cancelled = false;
      modelApi
        .listAvailable()
        .then((res) => {
          if (!cancelled) setFallbackModels(res.models ?? []);
        })
        .catch(() => {
          if (!cancelled) setFallbackModels([]);
        });
      return () => {
        cancelled = true;
      };
    }, [settingsContext?.availableModels]);

    useEffect(() => {
      if (!rolePickerOpen) return;
      const handleClick = (e: MouseEvent) => {
        if (
          rolePickerRef.current &&
          !rolePickerRef.current.contains(e.target as Node)
        ) {
          setRolePickerOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [rolePickerOpen]);

    useEffect(() => {
      if (teamId) {
        teamApi.get(teamId).then((team) => {
          setExistingTeamId(team.id);
          setTeamName(team.name);
          setTeamDescription(team.description);
          setTeamAvatar(team.avatar ?? null);
          setTeamTagsInput(tagsToInput(team.tags));
          setTeamInstructions(team.team_instructions);
          setRouterToolMode(team.router_tool_mode ?? "delivery_only");
          setRouterAllowedTools(team.router_allowed_tools ?? []);
          setStarterPromptRows(starterPromptsToDraftRows(team.starter_prompts));
          setMembers(team.members);
          setDefaultMemberId(team.default_member_id ?? null);
        });
      } else {
        setExistingTeamId(null);
        setTeamName("");
        setTeamDescription("");
        setTeamAvatar(null);
        setTeamTagsInput("");
        setTeamInstructions("");
        setRouterToolMode("delivery_only");
        setRouterAllowedTools([]);
        setStarterPromptRows([]);
        setMembers([]);
        setDefaultMemberId(null);
      }
    }, [teamId]);

    const handleAddRole = useCallback(
      (preset: PersonaPreset) => {
        const newMember: TeamMember = {
          member_id: generateMemberId(),
          persona_preset_id: preset.id,
          agent_id: null,
          model_id: null,
          sandbox_enabled: false,
          role_name: preset.name,
          role_avatar: preset.avatar,
          role_tags: preset.tags,
          role_instructions: "",
          position: members.length,
          enabled: true,
        };
        setMembers((prev) => [...prev, newMember]);
        if (!defaultMemberId) setDefaultMemberId(newMember.member_id);
      },
      [members.length, defaultMemberId],
    );

    const handleRemoveMember = useCallback(
      (memberId: string) => {
        const nextMembers = members.filter((m) => m.member_id !== memberId);
        setMembers(nextMembers);
        setDefaultMemberId((current) =>
          current === memberId ? nextMembers[0]?.member_id ?? null : current,
        );
      },
      [members],
    );

    const handleInstructionsChange = useCallback(
      (memberId: string, text: string) => {
        setMembers((prev) =>
          prev.map((m) =>
            m.member_id === memberId ? { ...m, role_instructions: text } : m,
          ),
        );
      },
      [],
    );

    const handleToggleEnabled = useCallback((memberId: string) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.member_id === memberId ? { ...m, enabled: !m.enabled } : m,
        ),
      );
    }, []);

    const handleModelChange = useCallback(
      (memberId: string, modelId: string | null) => {
        setMembers((prev) =>
          prev.map((m) =>
            m.member_id === memberId ? { ...m, model_id: modelId || null } : m,
          ),
        );
      },
      [],
    );

    const handleSandboxChange = useCallback(
      (memberId: string, sandboxEnabled: boolean) => {
        setMembers((prev) =>
          prev.map((m) =>
            m.member_id === memberId
              ? { ...m, sandbox_enabled: sandboxEnabled }
              : m,
          ),
        );
      },
      [],
    );

    const handleRouterAllowedToolToggle = useCallback((toolName: string) => {
      setRouterAllowedTools((prev) =>
        prev.includes(toolName)
          ? prev.filter((name) => name !== toolName)
          : [...prev, toolName],
      );
    }, []);

    const handleSave = async () => {
      if (!teamName.trim()) return;
      setSaving(true);
      try {
        const payload: TeamCreateRequest = {
          name: teamName,
          description: teamDescription,
          avatar: teamAvatar,
          tags: inputToTags(teamTagsInput),
          team_instructions: teamInstructions,
          router_tool_mode: routerToolMode,
          router_allowed_tools:
            routerToolMode === "custom" ? routerAllowedTools : [],
          starter_prompts: draftRowsToStarterPrompts(starterPromptRows),
          default_member_id: defaultMemberId,
          members: members.map((m, idx) => ({
            member_id: m.member_id,
            persona_preset_id: m.persona_preset_id,
            agent_id: null,
            model_id: m.model_id ?? null,
            sandbox_enabled: Boolean(m.sandbox_enabled),
            role_name: m.role_name,
            role_avatar: m.role_avatar ?? null,
            role_tags: m.role_tags,
            role_instructions: m.role_instructions,
            position: idx,
            enabled: m.enabled,
          })),
        };
        const team = existingTeamId
          ? await teamApi.update(existingTeamId, payload)
          : await teamApi.create(payload);
        setExistingTeamId(team.id);
        toast.success(
          existingTeamId
            ? t("team.updateSuccess", "团队已更新")
            : t("team.createSuccess", "团队已创建"),
        );
        onSave?.(team);
      } catch (e) {
        console.error("Failed to save team:", e);
        toast.error(t("team.saveFailed", "保存失败"));
      } finally {
        setSaving(false);
      }
    };

    const handleClone = async () => {
      if (!existingTeamId) return;
      try {
        const cloned = await teamApi.clone(existingTeamId);
        setExistingTeamId(cloned.id);
        setTeamName(cloned.name);
        setTeamDescription(cloned.description);
        setTeamAvatar(cloned.avatar ?? null);
        setTeamTagsInput(tagsToInput(cloned.tags));
        setTeamInstructions(cloned.team_instructions);
        setRouterToolMode(cloned.router_tool_mode ?? "delivery_only");
        setRouterAllowedTools(cloned.router_allowed_tools ?? []);
        setStarterPromptRows(starterPromptsToDraftRows(cloned.starter_prompts));
        setMembers(cloned.members);
        setDefaultMemberId(cloned.default_member_id ?? null);
        toast.success(t("team.cloneSuccess", "团队已克隆"));
      } catch (e) {
        console.error("Failed to clone team:", e);
        toast.error(t("team.cloneFailed", "克隆失败"));
      }
    };

    const handleAvatarUpload = async (file: File) => {
      setUploadingAvatar(true);
      try {
        const compressed = await compressImageFile(file);
        const upload = uploadApi.uploadFile(compressed, {
          folder: "persona-avatars",
        });
        const result = await upload.promise;
        setTeamAvatar(result.url);
      } catch (e) {
        console.error("Team avatar upload failed:", e);
      } finally {
        setUploadingAvatar(false);
      }
    };

    const handleDelete = async () => {
      if (!existingTeamId) return;
      setIsDeleting(true);
      try {
        await teamApi.delete(existingTeamId);
        toast.success(t("team.deleteSuccess", "团队已删除"));
        setShowDeleteConfirm(false);
        onClose?.();
      } catch (e) {
        console.error("Failed to delete team:", e);
        toast.error(t("team.deleteFailed", "删除失败"));
      } finally {
        setIsDeleting(false);
      }
    };

    const activeMemberCount = members.filter((member) => member.enabled).length;
    const configuredMemberCount = members.filter((member) =>
      member.role_instructions.trim(),
    ).length;
    const filteredPresets = useMemo(() => {
      if (!searchQuery.trim()) return presets;
      const q = searchQuery.toLowerCase();
      return presets.filter(
        (preset) =>
          preset.name.toLowerCase().includes(q) ||
          preset.description.toLowerCase().includes(q) ||
          preset.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }, [presets, searchQuery]);
    const defaultMember = members.find(
      (member) => member.member_id === defaultMemberId,
    );
    return (
      <div
        className={`team-editor-shell ${
          surface === "sidebar" ? "team-editor-shell--sidebar" : ""
        }`}
      >
        <form
          className="es-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          {/* Profile: Avatar + Name + Description */}
          <div className="ppe-profile-section">
            <div className="ppe-avatar-upload">
              <div
                className="ppe-avatar-preview"
                onClick={() =>
                  !teamAvatar &&
                  !uploadingAvatar &&
                  avatarInputRef.current?.click()
                }
              >
                {isEmojiAvatar(teamAvatar) ? (
                  <>
                    <PersonaAvatarImage
                      avatar={getEmojiAvatarUrl(teamAvatar)}
                      alt=""
                      className="ppe-avatar-img"
                    />
                    <button
                      type="button"
                      className="ppe-avatar-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamAvatar(null);
                      }}
                      title={t("team.remove")}
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : isPersonaImageAvatar(teamAvatar) ? (
                  <>
                    <PersonaAvatarImage
                      avatar={teamAvatar}
                      alt=""
                      className="ppe-avatar-img"
                      onError={() => setTeamAvatar(null)}
                    />
                    <button
                      type="button"
                      className="ppe-avatar-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamAvatar(null);
                      }}
                      title={t("team.remove")}
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : teamAvatar ? (
                  <>
                    <div className="ppe-avatar-placeholder">
                      <PersonaAvatarIcon avatar={teamAvatar} size={20} />
                    </div>
                    <button
                      type="button"
                      className="ppe-avatar-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamAvatar(null);
                      }}
                      title={t("team.remove")}
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <div className="ppe-avatar-placeholder">
                    <Camera size={18} />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="ppe-avatar-uploading">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarUpload(file);
                  e.target.value = "";
                }}
              />
              <div className="relative">
                <button
                  type="button"
                  className="ppe-avatar-hint-btn"
                  disabled={uploadingAvatar}
                  onClick={() => setAvatarPickerOpen((v) => !v)}
                >
                  <Smile size={12} />
                  {t("team.chooseIcon")}
                </button>
                {avatarPickerOpen && (
                  <div className="ppe-icon-picker">
                    {TEAM_AVATAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="ppe-icon-picker-item"
                        onClick={() => {
                          setTeamAvatar(emoji);
                          setAvatarPickerOpen(false);
                        }}
                        title={emoji}
                      >
                        <span className="relative inline-flex size-5">
                          <ImageWithSkeleton
                            src={getEmojiAvatarUrl(emoji)}
                            alt=""
                            skipUrlResolve
                            inline
                            className="rounded-md"
                            style={{ width: 20, height: 20 }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="ppe-profile-fields">
              <div className="ppe-field">
                <label className="ppe-label">
                  {t("team.teamName")} <span className="ppe-required">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={t("team.teamNamePlaceholder")}
                  className="ppe-input"
                />
              </div>
              <div className="ppe-field">
                <label className="ppe-label">{t("team.description")}</label>
                <input
                  type="text"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder={t("team.descriptionPlaceholder")}
                  className="ppe-input"
                />
              </div>
              <div className="ppe-field">
                <label className="ppe-label">
                  <Tag size={13} className="ppe-label-icon" />
                  {t("team.tags", "标签")}
                </label>
                <input
                  type="text"
                  value={teamTagsInput}
                  onChange={(e) => setTeamTagsInput(e.target.value)}
                  placeholder={t("team.tagsPlaceholder", "例如：研究, 写作")}
                  className="ppe-input"
                />
              </div>
            </div>
          </div>

          {/* Team instructions */}
          <div className="ppe-field">
            <label className="ppe-label">
              <MessageSquareText size={13} className="ppe-label-icon" />
              {t("team.instructions")}
            </label>
            <div className="ppe-textarea-wrap">
              <textarea
                value={teamInstructions}
                onChange={(e) => setTeamInstructions(e.target.value)}
                placeholder={t("team.instructionsPlaceholder")}
                className="ppe-textarea"
                rows={4}
              />
            </div>
            <span
              style={{
                fontSize: "0.6875rem",
                color: "var(--theme-text-secondary)",
                opacity: 0.75,
                lineHeight: "1.4",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              {t("team.instructionsHint")}
            </span>
          </div>

          {/* Router tool policy */}
          <div className="ppe-field">
            <label className="ppe-label">
              <ShieldCheck size={13} className="ppe-label-icon" />
              {t("team.routerToolPolicy", "Router tools")}
            </label>
            <div className="team-router-tool-policy">
              <div className="team-router-mode-group" role="group">
                <button
                  type="button"
                  className={`team-router-mode-button ${
                    routerToolMode === "delivery_only"
                      ? "team-router-mode-button--active"
                      : ""
                  }`}
                  onClick={() => setRouterToolMode("delivery_only")}
                >
                  <ShieldCheck size={14} />
                  <span>{t("team.routerToolModeDelivery", "Delivery")}</span>
                </button>
                <button
                  type="button"
                  className={`team-router-mode-button ${
                    routerToolMode === "custom"
                      ? "team-router-mode-button--active"
                      : ""
                  }`}
                  onClick={() => setRouterToolMode("custom")}
                >
                  <Cpu size={14} />
                  <span>{t("team.routerToolModeCustom", "Custom")}</span>
                </button>
                <button
                  type="button"
                  className={`team-router-mode-button ${
                    routerToolMode === "all"
                      ? "team-router-mode-button--active"
                      : ""
                  }`}
                  onClick={() => setRouterToolMode("all")}
                >
                  <Sparkles size={14} />
                  <span>{t("team.routerToolModeAll", "All")}</span>
                </button>
              </div>

              <div className="team-router-tool-chips">
                {ROUTER_DELIVERY_TOOL_NAMES.map((toolName) => (
                  <span key={toolName} className="team-router-tool-chip">
                    {toolName}
                  </span>
                ))}
              </div>

              {routerToolMode === "custom" && (
                <div className="team-router-tool-grid">
                  {ROUTER_CUSTOM_TOOL_OPTIONS.map((tool) => {
                    const checked = routerAllowedTools.includes(tool.name);
                    return (
                      <label
                        key={tool.name}
                        className={`team-router-tool-option ${
                          checked ? "team-router-tool-option--checked" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            handleRouterAllowedToolToggle(tool.name)
                          }
                        />
                        <span>{t(tool.labelKey, tool.label)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Starter prompts */}
          <div className="ppe-field">
            <label className="ppe-label">
              <Sparkles size={13} className="ppe-label-icon" />
              {t("personaPresets.starterPrompts", "Starter Prompts")}
            </label>
            <div className="ppe-starter-list">
              {starterPromptRows.map((prompt, index) => (
                <div key={index} className="ppe-starter-row">
                  <input
                    value={prompt.icon}
                    onChange={(e) =>
                      setStarterPromptRows((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, icon: e.target.value }
                            : item,
                        ),
                      )
                    }
                    className="ppe-input ppe-starter-icon"
                    placeholder={t("personaPresets.starterIcon", "Icon")}
                  />
                  <input
                    value={prompt.text}
                    onChange={(e) =>
                      setStarterPromptRows((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, text: e.target.value }
                            : item,
                        ),
                      )
                    }
                    className="ppe-input ppe-starter-text"
                    placeholder={t(
                      "personaPresets.starterPromptPlaceholder",
                      'Enter a prompt, or use {"zh":"...","en":"..."}',
                    )}
                  />
                  <button
                    type="button"
                    className="ppe-starter-remove"
                    onClick={() =>
                      setStarterPromptRows((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    title={t("common.delete", "Delete")}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ppe-starter-add"
              onClick={() =>
                setStarterPromptRows((prev) => [
                  ...prev,
                  { icon: "", text: "" },
                ])
              }
            >
              <Plus size={13} />
              {t("personaPresets.addStarterPrompt", "Add starter prompt")}
            </button>
          </div>

          {/* Team members */}
          <div className="ppe-field" style={{ gap: "0.75rem" }}>
            <div className="tmb-header">
              <div className="tmb-header__row">
                <label className="ppe-label">
                  <Users size={13} className="ppe-label-icon" />
                  {t("team.teamMembers")}
                </label>
                <span className="tmb-default">
                  <Users size={11} />
                  <span>{defaultMember?.role_name || t("team.notSet")}</span>
                </span>
              </div>
              <div className="tmb-stats">
                <span className="tmb-stat">
                  <span className="tmb-stat__dot" />
                  {t("team.selected", { count: members.length })}
                </span>
                <span className="tmb-stat tmb-stat--active">
                  <span className="tmb-stat__dot" />
                  {t("team.active", { count: activeMemberCount })}
                </span>
                <span className="tmb-stat tmb-stat--configured">
                  <span className="tmb-stat__dot" />
                  {t("team.configured", { count: configuredMemberCount })}
                </span>
                <span className="tmb-stat">
                  <Cpu size={11} />
                  {t("team.memberModels", "成员模型")}
                </span>
              </div>
            </div>

            <div ref={rolePickerRef}>
              <button
                type="button"
                onClick={() => {
                  setRolePickerOpen((v) => !v);
                  setSearchQuery("");
                }}
                className={`team-role-picker-trigger ${
                  rolePickerOpen ? "team-role-picker-trigger--open" : ""
                }`}
              >
                <Plus size={14} />
                <span>
                  {members.length === 0
                    ? t("team.addRoles")
                    : t("team.addAnotherRole")}
                </span>
                <ChevronDown
                  size={14}
                  className={`team-role-picker-trigger__chevron ${
                    rolePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {rolePickerOpen && (
                <div className="team-role-picker-dropdown">
                  <div className="team-role-picker-dropdown__search">
                    <Search
                      size={14}
                      className="team-role-picker-dropdown__search-icon"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("team.searchRoles")}
                      className="ppe-input"
                      style={{ paddingLeft: "2.25rem" }}
                      autoFocus
                    />
                  </div>
                  <div className="team-role-picker-dropdown__list">
                    {presetsLoading && (
                      <div className="team-form-empty">
                        {t("team.loadingRoles")}
                      </div>
                    )}
                    {!presetsLoading && filteredPresets.length === 0 && (
                      <div className="team-form-empty">
                        {t("team.noRolesFound")}
                      </div>
                    )}
                    {filteredPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="team-form-role-option"
                        onClick={() => handleAddRole(preset)}
                      >
                        <span className="team-form-role-option__name">
                          {preset.name}
                        </span>
                        {preset.description && (
                          <span className="team-form-role-option__desc">
                            {preset.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {members.length > 0 && (
              <div className="team-form-selected__list">
                {members.map((member) => (
                  <TeamMemberCard
                    key={member.member_id}
                    member={member}
                    isDefault={member.member_id === defaultMemberId}
                    onRemove={() => handleRemoveMember(member.member_id)}
                    onSetDefault={() => setDefaultMemberId(member.member_id)}
                    onToggleEnabled={() =>
                      handleToggleEnabled(member.member_id)
                    }
                    onInstructionsChange={(text) =>
                      handleInstructionsChange(member.member_id, text)
                    }
                    availableModels={availableModels ?? []}
                    onModelChange={(modelId) =>
                      handleModelChange(member.member_id, modelId)
                    }
                    onSandboxChange={(sandboxEnabled) =>
                      handleSandboxChange(member.member_id, sandboxEnabled)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </form>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title={t("team.confirmDelete", "确认删除")}
          message={t(
            "team.confirmDeleteMessage",
            "确定要删除该团队吗？此操作不可撤销。",
          )}
          confirmText={t("common.delete", "删除")}
          cancelText={t("common.cancel", "取消")}
          variant="danger"
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    );
  },
);
