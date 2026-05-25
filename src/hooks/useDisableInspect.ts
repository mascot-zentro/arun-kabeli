import { useEffect } from "react";

/**
 * Best-effort deterrent against casual inspection.
 * Note: this cannot truly prevent a determined user from viewing source,
 * but it blocks right-click, common devtools shortcuts, and text selection
 * of body content.
 */
export function useDisableInspect() {
  useEffect(() => {
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl/Cmd + Shift + I / J / C  (devtools, console, inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd + U (view source)
      if ((e.ctrlKey || e.metaKey) && k === "u") { e.preventDefault(); return; }
      // Ctrl/Cmd + S (save page)
      if ((e.ctrlKey || e.metaKey) && k === "s") { e.preventDefault(); return; }
    };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
}
