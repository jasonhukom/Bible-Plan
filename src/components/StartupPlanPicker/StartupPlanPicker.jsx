import { useState } from "react";
import { deviceStorage } from "../../lib/deviceStorage";
import "./StartupPlanPicker.css";

function isDesktopOrAndroid() {
  if (typeof window !== "undefined" && window.__TAURI__) return true;
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

function getLocalAccount() {
  const profile = deviceStorage.getProfile();
  const plan = deviceStorage.getActivePlan();
  if (!plan) return [];

  return [{
    id: "local",
    name: profile?.display_name || "On this device",
    avatarUrl: profile?.avatar_url || "",
    plans: [plan]
  }];
}

function getSavedPreference() {
  return deviceStorage.getSettings().preferences?.showPlanPickerOnStartup;
}

export default function StartupPlanPicker({
  accounts,
  onSelect,
  forceOpen = false
}) {
  const [enabled, setEnabled] = useState(
    () => getSavedPreference() ?? isDesktopOrAndroid()
  );
  const [open, setOpen] = useState(() => forceOpen || (isDesktopOrAndroid() && getSavedPreference() !== false));
  const [selectionError, setSelectionError] = useState("");
  const accountList = Array.isArray(accounts) ? accounts : getLocalAccount();

  function setPickerEnabled(nextEnabled) {
    setEnabled(nextEnabled);
    deviceStorage.saveSettings({
      preferences: { showPlanPickerOnStartup: nextEnabled }
    });
    setOpen(nextEnabled);
  }

  async function selectPlan(account, plan) {
    setSelectionError("");
    if (typeof onSelect !== "function") {
      setSelectionError("Plan selection is unavailable.");
      return;
    }

    try {
      await onSelect(account, plan);
      setOpen(false);
    } catch (error) {
      setSelectionError(error.message || "Could not open this reading plan.");
    }
  }

  if (!open) return null;

  return (
    <div className="startup-picker" role="dialog" aria-modal="true" aria-labelledby="startup-picker-title">
      <header className="startup-picker-header">
        <div>
          <p className="startup-picker-eyebrow">Bible Plan</p>
          <h1 id="startup-picker-title">Who's reading today?</h1>
          <p className="startup-picker-subtitle">Choose an account and reading plan to continue.</p>
        </div>
        <label className="startup-picker-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setPickerEnabled(event.target.checked)}
          />
          <span>Show on startup</span>
        </label>
      </header>

      {selectionError && <p className="startup-picker-error" role="alert">{selectionError}</p>}
      <div className="startup-picker-grid">
        {accountList.map((account) => (
          <section className="startup-picker-account" key={account.id || account.name}>
            <div className="startup-picker-account-heading">
              {account.avatarUrl
                ? <img className="startup-picker-avatar" src={account.avatarUrl} alt="" />
                : <span className="startup-picker-avatar startup-picker-avatar-placeholder" aria-hidden="true">
                    {(account.name || "A").trim().charAt(0).toUpperCase()}
                  </span>}
              <h2>{account.name}</h2>
            </div>
            <div className="startup-picker-plans">
              {(account.plans || []).map((plan) => (
                <button
                  className="startup-picker-plan"
                  key={plan.id || plan.name}
                  type="button"
                  onClick={() => selectPlan(account, plan)}
                >
                  <span className="startup-picker-plan-name">{plan.name || "Reading plan"}</span>
                  <span className="startup-picker-plan-meta">
                    {plan.days ? `${plan.days}-day plan` : "Continue reading"}
                  </span>
                </button>
              ))}
              {(!account.plans || account.plans.length === 0) && (
                <p className="startup-picker-empty">No reading plans are available for this account.</p>
              )}
            </div>
          </section>
        ))}
        {accountList.length === 0 && (
          <p className="startup-picker-empty">No saved reading plan was found on this device.</p>
        )}
      </div>

      {forceOpen && (
        <button className="startup-picker-continue" type="button" onClick={() => setOpen(false)}>
          Continue to Bible Plan
        </button>
      )}
    </div>
  );
}
