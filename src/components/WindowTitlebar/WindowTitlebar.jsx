import { useState } from "react";
import "./WindowTitlebar.css";
import closeIcon from "./close.svg";
import maximizeIcon from "./maximize.svg";
import minimizeIcon from "./minimize.svg";

function getDesktopWindow() {
  return window.__TAURI__?.window?.getCurrentWindow?.();
}

export default function WindowTitlebar() {
  const [error, setError] = useState("");

  if (typeof window === "undefined" || !getDesktopWindow()) return null;

  async function runWindowAction(action) {
    setError("");
    try {
      const desktopWindow = getDesktopWindow();
      if (!desktopWindow) throw new Error("Desktop window controls are unavailable.");
      await action(desktopWindow);
    } catch (actionError) {
      setError(actionError.message || "Could not control the desktop window.");
    }
  }

  return (
    <div className="window-titlebar" data-tauri-drag-region aria-label="Window controls">
      {error && <span className="window-titlebar-error" role="status">{error}</span>}
      <button
        className="window-titlebar-button"
        type="button"
        aria-label="Minimize window"
        onClick={() => runWindowAction((desktopWindow) => desktopWindow.minimize())}
      >
        <img src={minimizeIcon} alt="" />
      </button>
      <button
        className="window-titlebar-button"
        type="button"
        aria-label="Maximize or restore window"
        onClick={() => runWindowAction(async (desktopWindow) => {
          if (await desktopWindow.isMaximized()) {
            await desktopWindow.unmaximize();
          } else {
            await desktopWindow.maximize();
          }
        })}
      >
        <img src={maximizeIcon} alt="" />
      </button>
      <button
        className="window-titlebar-button window-titlebar-close"
        type="button"
        aria-label="Close window"
        onClick={() => runWindowAction((desktopWindow) => desktopWindow.close())}
      >
        <img src={closeIcon} alt="" />
      </button>
    </div>
  );
}
