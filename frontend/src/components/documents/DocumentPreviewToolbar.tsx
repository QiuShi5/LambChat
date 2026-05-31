import { BackIcon } from "../common/BackIcon";
import { FileIcon } from "../common/FileIcon";
import {
  X,
  Copy,
  Check,
  Download,
  Expand,
  Shrink,
  Eye,
  Code2,
  PanelRight,
  Columns2,
} from "lucide-react";
import { formatFileSize as formatFileSizeUtil } from "./utils";
import type { DocumentPreviewState } from "./useDocumentPreviewState";

type ToolbarProps = Pick<
  DocumentPreviewState,
  | "t"
  | "data"
  | "copied"
  | "viewSource"
  | "isSidebar"
  | "isFullscreen"
  | "markdownFile"
  | "codeFile"
  | "hasTextContent"
  | "displaySize"
  | "fileSize"
  | "fileName"
  | "language"
  | "fileInfo"
  | "Icon"
  | "s3Key"
  | "signedUrl"
  | "externalImageUrl"
  | "resolvedUrl"
  | "unsupportedPreviewFile"
  | "onUserInteraction"
  | "onClose"
  | "effectiveOnBack"
  | "handleCopy"
  | "handleDownload"
  | "toolbarRef"
  | "setViewSource"
  | "setViewMode"
  | "handleFullscreenToggle"
  | "exitFullscreen"
>;

const toolbarBtnClass =
  "flex items-center justify-center size-8 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700/60 active:bg-stone-200 dark:active:bg-stone-600/60 transition-all duration-200 active:scale-95 cursor-pointer";

export default function DocumentPreviewToolbar({
  t,
  data,
  copied,
  viewSource,
  isSidebar,
  isFullscreen,
  markdownFile,
  codeFile,
  hasTextContent,
  displaySize,
  fileSize,
  fileName,
  language,
  fileInfo,
  Icon,
  s3Key,
  signedUrl,
  externalImageUrl,
  resolvedUrl,
  unsupportedPreviewFile,
  onUserInteraction,
  onClose,
  effectiveOnBack,
  handleCopy,
  handleDownload,
  toolbarRef,
  setViewSource,
  setViewMode,
  handleFullscreenToggle,
  exitFullscreen,
}: ToolbarProps) {
  // Fullscreen: floating exit button — matches SkillFormFullscreen style
  if (isFullscreen) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 z-[410] flex items-center justify-center w-11 h-11 rounded-xl bg-black/80 hover:bg-black text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        title={t("common.close")}
      >
        <X size={18} />
      </button>
    );
  }

  return (
    <div
      ref={toolbarRef}
      className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 py-2 sm:py-3 border-b border-[var(--theme-border)] overflow-hidden"
    >
      {effectiveOnBack && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            effectiveOnBack();
          }}
          className={toolbarBtnClass + " shrink-0"}
          title={t("common.back", "Back")}
        >
          <BackIcon size={16} />
        </button>
      )}
      <FileIcon icon={Icon} bg={fileInfo.bg} color={fileInfo.color} />
      <div className="flex-1 min-w-0 overflow-hidden">
        <h3
          className="text-[13px] sm:text-sm font-medium text-[var(--theme-text)] truncate"
          title={fileName}
        >
          {fileName}
        </h3>
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-[var(--theme-text-secondary)] mt-0.5">
          {codeFile && (
            <span className="px-1 py-0 sm:px-1.5 sm:py-0.5 rounded bg-[var(--theme-primary-light)] font-mono text-[10px] sm:text-xs shrink-0">
              {language}
            </span>
          )}
          <span className="text-[10px] sm:text-xs truncate">
            {hasTextContent
              ? t("documents.chars", { count: displaySize })
              : fileSize
                ? formatFileSizeUtil(fileSize)
                : fileInfo.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-px sm:gap-1 relative z-10 shrink-0">
        {markdownFile && data?.content && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewSource(!viewSource);
            }}
            className={toolbarBtnClass}
            title={viewSource ? t("documents.preview") : t("documents.source")}
          >
            {viewSource ? <Eye size={16} /> : <Code2 size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUserInteraction?.();
            if (isSidebar) {
              setViewMode("center");
            } else {
              setViewMode("sidebar");
              if (isFullscreen) exitFullscreen();
            }
          }}
          className={toolbarBtnClass}
          title={
            isSidebar
              ? t("documents.centerView", "Center view")
              : t("documents.sidebarView", "Sidebar view")
          }
        >
          {isSidebar ? <Columns2 size={16} /> : <PanelRight size={16} />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUserInteraction?.();
            if (!isFullscreen && isSidebar) {
              setViewMode("center");
            }
            handleFullscreenToggle();
          }}
          className={toolbarBtnClass}
          title={
            isFullscreen
              ? t("documents.exitFullscreen")
              : t("documents.fullscreen")
          }
        >
          {isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}
        </button>
        {(data?.content ||
          s3Key ||
          signedUrl ||
          externalImageUrl ||
          resolvedUrl) && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className={toolbarBtnClass}
              title={t("documents.download")}
            >
              <Download size={16} />
            </button>
            {data?.content && !unsupportedPreviewFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className={toolbarBtnClass}
                title={t("documents.copy")}
              >
                {copied ? (
                  <Check
                    size={16}
                    className="text-green-500 dark:text-green-400"
                  />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={toolbarBtnClass}
          title={t("common.close")}
          aria-label={t("common.close")}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
