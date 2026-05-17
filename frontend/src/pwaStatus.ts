export const PWA_UPDATE_TOAST_ID = "lambchat-pwa-update";
export const PWA_OFFLINE_TOAST_ID = "lambchat-pwa-offline";
export const PWA_ONLINE_RESTORED_TOAST_ID = "lambchat-pwa-online-restored";

interface BrowserOnlineState {
  onLine?: boolean;
}

export function getInitialOnlineStatus(
  browserNavigator: BrowserOnlineState | undefined,
): boolean {
  return typeof browserNavigator?.onLine === "boolean"
    ? browserNavigator.onLine
    : true;
}

export function shouldShowRestoredConnectionToast({
  wasOnline,
  isOnline,
}: {
  wasOnline: boolean;
  isOnline: boolean;
}): boolean {
  return !wasOnline && isOnline;
}
