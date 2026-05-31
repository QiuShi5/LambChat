/**
 * Detects mobile virtual keyboard open/close via visualViewport and returns
 * a boolean that auth pages can use to adjust their layout (e.g. switch from
 * vertically-centred to top-aligned so inputs stay visible above the keyboard).
 */

import { useState, useEffect } from "react";

/** Minimum height difference (px) to treat the viewport change as a keyboard. */
const KEYBOARD_THRESHOLD_PX = 100;

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function useMobileKeyboardAware(): boolean {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMobileDevice()) return;

    const vv = window.visualViewport;
    if (!vv) return;

    let lastHeight = vv.height;

    const onResize = () => {
      const delta = window.innerHeight - vv.height;
      if (delta > KEYBOARD_THRESHOLD_PX) {
        setIsKeyboardOpen(true);
      } else if (vv.height >= lastHeight - 10) {
        setIsKeyboardOpen(false);
      }
      lastHeight = vv.height;
    };

    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return isKeyboardOpen;
}
