import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deviceStorage } from "../lib/deviceStorage";
import ImageCropperModal from "../components/ImageCropperModal";

export default function ProfilePage() {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(() => deviceStorage.getProfile());
  const [displayName, setDisplayName] = useState(() => deviceStorage.getProfile()?.display_name || "");
  const [savedCount, setSavedCount] = useState(() => deviceStorage.listSavedVerses().length);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cropImageSrc, setCropImageSrc] = useState(null);

  useEffect(() => {
    function onSavedVersesChanged(e) {
      setSavedCount((e.detail || deviceStorage.listSavedVerses()).length);
    }
    window.addEventListener("bible-saved-verses-changed", onSavedVersesChanged);
    return () => window.removeEventListener("bible-saved-verses-changed", onSavedVersesChanged);
  }, []);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => setCropImageSrc(reader.result));
    reader.readAsDataURL(file);
    e.target.value = null;
  }

  async function handleCropComplete(croppedBlob) {
    setCropImageSrc(null);
    if (!croppedBlob) return;

    setUploading(true);
    setError("");
    setMessage("");
    try {
      const dataUrl = await deviceStorage.saveAvatarBlob(croppedBlob);
      const updated = deviceStorage.updateProfile({ avatar_url: dataUrl });
      setProfile(updated);
      setMessage("Photo saved.");
    } catch (err) {
      setError(err?.message || "Could not save photo.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveAvatar() {
    setError("");
    setMessage("");
    try {
      const updated = deviceStorage.updateProfile({ avatar_url: null });
      setProfile(updated);
      setMessage("Photo removed.");
    } catch (err) {
      setError(err?.message || "Could not remove photo.");
    }
  }

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = deviceStorage.updateProfile({
        display_name: displayName.trim()
      });
      setProfile(updated);
      setMessage("Saved.");
    } catch (err) {
      setError(err?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header page-header-sticky">
        <div className="page-header-title-row">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Saved on this device</p>
        </div>
        <div className="page-header-actions">
          <Link to="/settings" className="icon-btn" title="Settings" style={{ border: "1px solid var(--night-line)" }}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="page-container-narrow" style={{ paddingBottom: 40 }}>
        <div className="avatar-upload-row">
          {profile?.avatar_url ? (
            <img className="avatar-lg" src={profile.avatar_url} alt="Your avatar" />
          ) : (
            <div className="avatar-lg" />
          )}
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Saving…" : "Change photo"}
              </button>
              {profile?.avatar_url && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <p className="hint-text" style={{ marginTop: 8 }}>
              Name, photo, and reading plan are stored locally on this device.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="displayName">Name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {error && <p className="error-text">{error}</p>}
          {message && <p className="hint-text">{message}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        <div className="card" style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Saved verses</h2>
          <p className="hint-text" style={{ marginBottom: 12 }}>
            {savedCount} verse{savedCount === 1 ? "" : "s"} saved
          </p>
          <Link className="btn btn-ghost" to="/saves">
            View saved verses
          </Link>
        </div>

        {cropImageSrc && (
          <ImageCropperModal
            imageSrc={cropImageSrc}
            onCropComplete={handleCropComplete}
            onClose={() => setCropImageSrc(null)}
          />
        )}
      </div>
    </div>
  );
}
