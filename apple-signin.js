/*
  Apple Sign-In, adapted from https://github.com/dennisivy/apple-signin
  (Appwrite's `createOAuth2Session` flow), wired up for this app's Apple
  button in the account modal.

  Setup:
    1. Create an Appwrite project and enable the Apple OAuth2 provider
       (Appwrite console -> Auth -> OAuth2 Providers -> Apple). This needs a
       Services ID, Team ID, Key ID and private key from your Apple
       Developer account.
    2. Fill in `apple-signin.config.json` with your Appwrite endpoint and
       project ID.
    3. That's it -- this file does the rest.

  This file is self-contained on purpose (does not touch script.js) other
  than calling the small `window.updateAccountUI` hook script.js exposes.
*/

(function () {
  const CONFIG_URL = "apple-signin.config.json";
  const PLACEHOLDER_PROJECT_ID = "REPLACE_WITH_YOUR_APPWRITE_PROJECT_ID";

  let account = null;
  let config = null;

  async function loadConfig() {
    try {
      const res = await fetch(CONFIG_URL);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn("apple-signin: could not load apple-signin.config.json", e);
      return null;
    }
  }

  function isConfigured(cfg) {
    return !!(cfg && cfg.projectId && cfg.projectId !== PLACEHOLDER_PROJECT_ID);
  }

  async function init() {
    config = await loadConfig();

    if (!window.Appwrite) {
      console.warn("apple-signin: Appwrite SDK did not load (offline, or the CDN script tag was blocked).");
      return;
    }

    if (!isConfigured(config)) {
      // Nothing to wire up yet -- the button click handler below will just
      // explain what to do instead of trying to talk to a placeholder project.
      return;
    }

    const client = new window.Appwrite.Client()
      .setEndpoint(config.endpoint || "https://cloud.appwrite.io/v1")
      .setProject(config.projectId);

    account = new window.Appwrite.Account(client);

    // If a session already exists (e.g. we just got redirected back from
    // Apple), reflect it in the sidebar's account button.
    try {
      const user = await account.get();
      if (window.updateAccountUI) {
        window.updateAccountUI({ isLoggedIn: true, name: user.name || user.email, avatarUrl: null });
      }
    } catch (e) {
      // Not signed in yet -- fine, leave the default logged-out UI as is.
    }
  }

  function handleAppleClick() {
    if (!isConfigured(config)) {
      alert("Apple sign-in isn't configured yet. Fill in apple-signin.config.json with your Appwrite endpoint and project ID (see the comment at the top of apple-signin.js).");
      return;
    }
    if (!account) {
      alert("Apple sign-in couldn't start (the Appwrite SDK failed to load). Check your internet connection and try again.");
      return;
    }

    const successUrl = config.successUrl || window.location.href;
    const failureUrl = config.failureUrl || window.location.href;

    account.createOAuth2Session(window.Appwrite.OAuthProvider.Apple, successUrl, failureUrl);
  }

  function attach() {
    const appleBtn = document.getElementById("appleSignInBtn");
    if (appleBtn) appleBtn.addEventListener("click", handleAppleClick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }

  init();
})();
