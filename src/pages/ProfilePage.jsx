import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataApi } from "../lib/dataApi";
import LoginModal from "../components/LoginModal";
import ImageCropperModal from "../components/ImageCropperModal";

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  useEffect(() => {
    Promise.all([dataApi.getProfile(), dataApi.listSavedVerses()]).then(
      ([{ data: profileData }, { data: verses }]) => {
        if (profileData) {
          setProfile(profileData);
          setDisplayName(profileData.display_name || "");
        }
        setSavedCount((verses || []).length);
        setLoading(false);
      }
    );
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
    
    const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    const { data, error } = await dataApi.uploadAvatar(file);
    if (error) {
      setError(error.message);
      setUploading(false);
      return;
    }
    const { data: updated, error: updateError } = await dataApi.updateProfile({
      avatar_url: data.publicUrl
    });
    if (updateError) setError(updateError.message);
    else setProfile(updated);
    setUploading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const { data, error } = await dataApi.updateProfile({
      display_name: displayName
    });
    if (error) setError(error.message);
    else {
      setProfile(data);
      setMessage("Saved.");
    }
    setSaving(false);
  }

  if (loading) return <p className="reader-loading">Loading profile…</p>;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 40px" }}>
      <div className="page-header page-header-sticky" style={{ alignItems: "center", justifyContent: "center", position: "relative" }}>
        <h1 style={{ margin: 0 }}>Profile</h1>
        <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/settings" className="icon-btn" title="Settings" style={{ border: "1px solid var(--night-line)" }}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="avatar-upload-row">
        {profile?.avatar_url ? (
          <img className="avatar-lg" src={profile.avatar_url} alt="Your avatar" />
        ) : (
          <div className="avatar-lg" />
        )}
        <div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <p className="hint-text" style={{ marginTop: 8 }}>
            {user?.email || "Anonymous user"}
          </p>
        </div>
      </div>

      {user?.is_anonymous && (
        <div className="card" style={{ marginBottom: 24, padding: "16px", borderColor: "var(--gold)" }}>
          <h2 style={{ fontSize: 15, color: "var(--gold-bright)", margin: "0 0 8px 0" }}>Secure Your Account</h2>
          <p className="hint-text" style={{ marginBottom: 12 }}>
            Sign in with an email to sync your data across devices and receive daily reminders.
          </p>
          <button className="btn" type="button" onClick={() => setShowLoginModal(true)}>
            Sign In / Register
          </button>
        </div>
      )}

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



      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={() => setShowLoginModal(false)} />
      )}

      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
