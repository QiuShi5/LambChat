import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getFullUrl, uploadApi } from "../../services/api";
import { AttachmentCard } from "../common/AttachmentCard";
import { openAttachmentPreview } from "./attachmentPreviewStore";
import type { MessageAttachment } from "../../types";

interface ChatInputAttachmentsProps {
  attachments: MessageAttachment[];
  onAttachmentsChange: (
    attachments:
      | MessageAttachment[]
      | ((prev: MessageAttachment[]) => MessageAttachment[]),
  ) => void;
  onCancelUpload: (id: string) => void;
  onImageViewerOpen: (url: string) => void;
  /** Optional: max files allowed (for count display) */
  maxFiles?: number;
  /** Optional: callback to open file picker */
  onAddMore?: () => void;
}

export function ChatInputAttachments({
  attachments,
  onAttachmentsChange,
  onCancelUpload,
  onImageViewerOpen,
  maxFiles,
  onAddMore,
}: ChatInputAttachmentsProps) {
  const { t } = useTranslation();

  const handleRemove = useCallback(
    (attachment: MessageAttachment) => {
      onAttachmentsChange((prev) => prev.filter((a) => a.id !== attachment.id));
      if (attachment.key && !attachment.isUploading) {
        uploadApi.deleteFile(attachment.key).catch((error) => {
          console.error("Failed to delete file from server:", error);
        });
      }
    },
    [onAttachmentsChange],
  );

  if (attachments.length === 0) return null;

  const countText =
    maxFiles != null && maxFiles > 0
      ? `${attachments.length}/${maxFiles}`
      : `${attachments.length}`;
  const isAtLimit =
    maxFiles != null && maxFiles > 0 && attachments.length >= maxFiles;

  return (
    <div className="mx-3 mt-2.5 -mb-1 flex items-center gap-3 overflow-x-auto attachment-scroll pb-1">
      {attachments.map((attachment) => {
        const isImage =
          attachment.mimeType?.startsWith("image/") && attachment.url;

        return (
          <AttachmentCard
            key={attachment.id}
            attachment={attachment}
            variant="editable"
            size="compact"
            isUploading={attachment.isUploading}
            onClick={() => {
              if (isImage && attachment.url) {
                onImageViewerOpen(getFullUrl(attachment.url) ?? "");
              } else {
                openAttachmentPreview(attachment, "chat-input");
              }
            }}
            onRemove={() => handleRemove(attachment)}
            onCancel={
              attachment.isUploading
                ? () => onCancelUpload(attachment.id)
                : undefined
            }
          />
        );
      })}

      {/* File count + Add more button */}
      <div className="flex shrink-0 items-center gap-1.5">
        {!isAtLimit && onAddMore && (
          <button
            type="button"
            onClick={onAddMore}
            className="flex items-center justify-center size-7 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500 transition-colors hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50"
            title={t("chat.addMoreFiles", "Add more files")}
          >
            <Plus size={14} />
          </button>
        )}
        <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500 select-none whitespace-nowrap">
          {countText}
        </span>
      </div>
    </div>
  );
}
