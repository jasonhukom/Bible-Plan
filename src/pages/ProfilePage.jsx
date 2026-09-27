import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataApi } from "../lib/dataApi";

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [churchName, setChurchName] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([dataApi.getProfile(), dataApi.listSavedVerses()]).then(
      ([{ data: profileData }, { data: verses }]) => {
        if (profileData) {
          setProfile(profileData);
          setDisplayName(profileData.display_name || "");
          setBio(profileData.bio || "");
          setChurchName(profileData.church_name || "");
        }
        setSavedCount((verses || []).length);
        setLoading(false);
      }
    );
  }, []);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
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
      display_name: displayName,
      bio,
      church_name: churchName
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
    <div style={{ maxWidth: 520 }}>
      <div className="page-header">
        <h1>Profile</h1>
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
            {user?.email}
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

        <div className="field">
          <label htmlFor="bio">Description</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A little about you"
          />
        </div>

        <div className="field">
          <label htmlFor="church">Church</label>
          <input
            id="church"
            value={churchName}
            onChange={(e) => setChurchName(e.target.value)}
            placeholder="Where you attend"
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
    </div>
  );
}
