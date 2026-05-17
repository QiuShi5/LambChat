import { useEffect, useRef } from "react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  type LambChatPwaUpdateEventDetail,
  activateWaitingLambChatPwaUpdate,
} from "../../pwa";
import { PWA_UPDATE_AVAILABLE_EVENT } from "../../pwaGuards";
import {
  PWA_OFFLINE_TOAST_ID,
  PWA_ONLINE_RESTORED_TOAST_ID,
  PWA_UPDATE_TOAST_ID,
  getInitialOnlineStatus,
  shouldShowRestoredConnectionToast,
} from "../../pwaStatus";

function PwaStatusToast({
  title,
  body,
  tone,
  action,
  onDismiss,
}: {
  title: string;
  body: string;
  tone: "update" | "offline";
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}) {
  return (
    <div className={`pwa-status-toast pwa-status-toast--${tone}`} role="status">
      <div className="pwa-status-toast__icon" aria-hidden="true">
        {tone === "offline" ? <WifiOff size={18} /> : <RefreshCw size={18} />}
      </div>
      <div className="pwa-status-toast__content">
        <div className="pwa-status-toast__title">{title}</div>
        <div className="pwa-status-toast__body">{body}</div>
      </div>
      {action && (
        <button
          className="pwa-status-toast__action"
          type="button"
          onClick={action.onClick}
        >
          <RefreshCw size={15} aria-hidden="true" />
          <span>{action.label}</span>
        </button>
      )}
      {onDismiss && (
        <button
          className="pwa-status-toast__dismiss"
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function showOfflineToast() {
  toast.custom(
    <PwaStatusToast
      title="You are offline"
      body="Chat, files, and sync will resume when the connection returns."
      tone="offline"
    />,
    {
      id: PWA_OFFLINE_TOAST_ID,
      duration: Infinity,
      position: "top-center",
    },
  );
}

export function PwaStatusToasts() {
  const isOnlineRef = useRef(
    getInitialOnlineStatus(
      typeof navigator === "undefined" ? undefined : navigator,
    ),
  );

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const registration = (event as CustomEvent<LambChatPwaUpdateEventDetail>)
        .detail?.registration;

      if (!registration) return;

      toast.custom(
        <PwaStatusToast
          title="Update ready"
          body="A fresh LambChat version is ready to apply."
          tone="update"
          action={{
            label: "Refresh",
            onClick: () => {
              if (activateWaitingLambChatPwaUpdate(registration)) {
                toast.dismiss(PWA_UPDATE_TOAST_ID);
              }
            },
          }}
          onDismiss={() => toast.dismiss(PWA_UPDATE_TOAST_ID)}
        />,
        {
          id: PWA_UPDATE_TOAST_ID,
          duration: Infinity,
          position: "top-center",
        },
      );
    };

    window.addEventListener(PWA_UPDATE_AVAILABLE_EVENT, handleUpdateAvailable);

    return () => {
      window.removeEventListener(
        PWA_UPDATE_AVAILABLE_EVENT,
        handleUpdateAvailable,
      );
    };
  }, []);

  useEffect(() => {
    if (!isOnlineRef.current) {
      showOfflineToast();
    }

    const handleOffline = () => {
      isOnlineRef.current = false;
      toast.dismiss(PWA_ONLINE_RESTORED_TOAST_ID);
      showOfflineToast();
    };

    const handleOnline = () => {
      const wasOnline = isOnlineRef.current;
      isOnlineRef.current = true;
      toast.dismiss(PWA_OFFLINE_TOAST_ID);

      if (
        shouldShowRestoredConnectionToast({
          wasOnline,
          isOnline: true,
        })
      ) {
        toast.success("Back online", {
          id: PWA_ONLINE_RESTORED_TOAST_ID,
          duration: 2500,
        });
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      toast.dismiss(PWA_OFFLINE_TOAST_ID);
    };
  }, []);

  return null;
}
