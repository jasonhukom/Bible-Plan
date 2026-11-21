import "./OSDownloadButton.css";

const DOWNLOADS = {
  android: {
    label: "Download Android App (.apk)",
    href: "/builds/bible-plan-alpha0.0.1.apk"
  },
  windows: {
    label: "Download for Windows (.exe)",
    href: "/builds/bible-plan-alpha0.0.1.exe"
  },
  linux: {
    label: "Download for Linux",
    href: "/builds/bible-plan-alpha0.0.1.AppImage"
  }
};

export function getDownloadForUserAgent(userAgent) {
  const agent = userAgent.toLowerCase();
  if (agent.includes("android") || agent.includes("mobile")) return DOWNLOADS.android;
  if (agent.includes("windows")) return DOWNLOADS.windows;
  if (agent.includes("linux")) return DOWNLOADS.linux;
  return null;
}

export default function OSDownloadButton() {
  if (
    typeof navigator === "undefined" ||
    (typeof window !== "undefined" && window.__TAURI__)
  ) {
    return null;
  }

  const download = getDownloadForUserAgent(navigator.userAgent);
  if (!download) return null;

  return (
    <a className="os-download-button" href={download.href} download>
      {download.label}
    </a>
  );
}
