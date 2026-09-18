// @ts-check
/* ==========================================================================
   account-ui.js
   --------------------------------------------------------------------------
   Everything the user actually touches: the account dialog, the account page,
   and keeping both in step with the auth state.

   Signed out, the dialog offers Sign In / Create Account, a forgotten-password
   flow, and whichever OAuth providers are enabled on the Supabase project.
   Signed in, it turns into a small menu: display name, Account, Settings,
   Sign Out. The sidebar button itself is left alone apart from its label and
   avatar, which script.js already knows how to render.

   This file owns the account dialog's behaviour; script.js only opens it.
   ========================================================================== */

(function () {
  "use strict";

  var OAUTH_LABELS = { google: "Google", apple: "Apple", github: "GitHub" };

  /** @type {string} */
  var view = "signin";
  /** @type {any} */
  var authState = null;
  var busy = false;

  /**
   * @param {string} id
   * @returns {any}
   */
  function el(id) {
    return document.getElementById(id);
  }

  /** @returns {any} */
  function auth() {
    return /** @type {any} */ (window).BiblePlanAuth;
  }

  /** @returns {any} */
  function data() {
    return /** @type {any} */ (window).BiblePlanData;
  }

  /* ----------------------------------------------------------------------
     Messages
     ---------------------------------------------------------------------- */

  /**
   * @param {string} text
   * @param {string} [tone] "error" | "success" | "info"
   */
  function showMessage(text, tone) {
    var node = el("accountMessage");
    if (!node) return;
    node.textContent = text || "";
    node.hidden = !text;
    node.className = "account-message" + (tone ? " is-" + tone : "");
  }

  function clearMessage() {
    showMessage("", undefined);
  }

  /**
   * Supabase error messages are already user-facing, with one exception worth
   * translating: asking for a provider that has not been switched on.
   * @param {any} error
   * @returns {string}
   */
  function describeError(error) {
    var message = (error && error.message) || "Something went wrong. Please try again.";
    if (/provider is not enabled|Unsupported provider/i.test(message)) {
      return (
        "That sign-in provider is not enabled on this project yet. " +
        "Turn it on in Supabase under Authentication → Providers."
      );
    }
    return message;
  }

  /**
   * @param {boolean} value
   */
  function setBusy(value) {
    busy = value;
    var panel = document.querySelector(".account-modal-panel");
    if (panel) panel.classList.toggle("is-busy", value);
    [
      "accountSubmitBtn",
      "resetRequestBtn",
      "newPasswordBtn",
      "profileSaveBtn",
      "preferencesSaveBtn",
      "passwordChangeBtn"
    ].forEach(function (id) {
      var button = el(id);
      if (button) button.disabled = value;
    });
  }

  /* ----------------------------------------------------------------------
     Dialog rendering
     ---------------------------------------------------------------------- */

  /**
   * @param {string} next "signin" | "signup" | "reset" | "new-password" | "menu"
   */
  function setView(next) {
    view = next;
    clearMessage();
    render();
  }

  function render() {
    var signedIn = !!(authState && authState.isSignedIn);
    var configured = !!(authState && authState.isConfigured);
    var recovering = !!(authState && authState.recoveryMode);

    if (recovering) view = "new-password";
    else if (signedIn && view !== "new-password") view = "menu";
    else if (!signedIn && (view === "menu" || view === "new-password")) view = "signin";

    /** @type {Record<string, any>} */
    var views = {
      signin: el("accountViewCredentials"),
      signup: el("accountViewCredentials"),
      reset: el("accountViewReset"),
      "new-password": el("accountViewNewPassword"),
      menu: el("accountViewMenu")
    };

    Object.keys(views).forEach(function (key) {
      var node = views[key];
      if (node) node.hidden = true;
    });
    var active = views[view];
    if (active) active.hidden = false;

    // Sign in / Create account tabs
    var isSignUp = view === "signup";
    document.querySelectorAll("[data-auth-tab]").forEach(function (tab) {
      var button = /** @type {any} */ (tab);
      var selected = button.dataset.authTab === (isSignUp ? "signup" : "signin");
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    var nameField = el("accountNameField");
    if (nameField) nameField.hidden = !isSignUp;

    var submit = el("accountSubmitBtn");
    if (submit) submit.textContent = isSignUp ? "Create account" : "Sign in";

    var passwordInput = document.querySelector('#accountForm input[name="password"]');
    if (passwordInput) {
      /** @type {any} */ (passwordInput).autocomplete = isSignUp
        ? "new-password"
        : "current-password";
    }

    // Signed-in menu
    if (signedIn) {
      var nameNode = el("accountMenuName");
      if (nameNode) nameNode.textContent = auth().getDisplayName() || "Reader";
      var emailNode = el("accountMenuEmail");
      if (emailNode) emailNode.textContent = (authState.user && authState.user.email) || "";
      var avatar = el("accountMenuAvatar");
      if (avatar) {
        var url = authState.profile && authState.profile.avatar_url;
        avatar.innerHTML = url
          ? '<img src="' + String(url).replace(/"/g, "&quot;") + '" alt="">'
          : '<span aria-hidden="true">' +
            String(auth().getDisplayName() || "R")
              .trim()
              .charAt(0)
              .toUpperCase() +
            "</span>";
      }
    }

    // Unconfigured deployment: say so plainly instead of failing on submit.
    var note = el("accountConfigNote");
    if (note) {
      note.hidden = configured;
      if (!configured) {
        var supa = /** @type {any} */ (window).BiblePlanSupabase;
        note.textContent =
          "Accounts are not switched on for this deployment yet. " +
          (supa && supa.getStatusDetail ? supa.getStatusDetail() : "") +
          " Your plan is still saved in this browser.";
      }
    }

    var credentialsForm = el("accountForm");
    if (credentialsForm) {
      credentialsForm.querySelectorAll("input, button").forEach(function (/** @type {any} */ node) {
        /** @type {any} */ (node).disabled = !configured || busy;
      });
    }
    document.querySelectorAll(".oauth-button").forEach(function (node) {
      /** @type {any} */ (node).disabled = !configured || busy;
    });
  }

  function openDialog() {
    var modal = el("accountPopover");
    if (!modal) return;
    modal.hidden = false;
    render();
  }

  function closeDialog() {
    var modal = el("accountPopover");
    if (modal) modal.hidden = true;
  }

  /* ----------------------------------------------------------------------
     Account page
     ---------------------------------------------------------------------- */

  function renderAccountPage() {
    var page = el("accountPage");
    if (!page) return;

    var signedIn = !!(authState && authState.isSignedIn);
    var signedInSection = el("accountPageSignedIn");
    var signedOutSection = el("accountPageSignedOut");
    if (signedInSection) signedInSection.hidden = !signedIn;
    if (signedOutSection) signedOutSection.hidden = signedIn;
    if (!signedIn) return;

    var displayName = el("profileDisplayName");
    if (displayName && document.activeElement !== displayName) {
      displayName.value = auth().getDisplayName() || "";
    }
    var avatarUrl = el("profileAvatarUrl");
    if (avatarUrl && document.activeElement !== avatarUrl) {
      avatarUrl.value = (authState.profile && authState.profile.avatar_url) || "";
    }
    var email = el("profileEmail");
    if (email) email.value = (authState.user && authState.user.email) || "";

    loadPreferences();
  }

  var preferencesLoadedFor = "";

  function loadPreferences() {
    var db = data();
    var userId = auth().getUserId();
    if (!db || !userId || preferencesLoadedFor === userId) return;
    preferencesLoadedFor = userId;

    db.getSettings().then(function (/** @type {any} */ result) {
      if (result.error || !result.data) return;
      var translation = el("settingsTranslation");
      if (translation) translation.value = result.data.translation || "KJV";
      var canon = el("settingsCanon");
      if (canon) canon.value = result.data.canon || "protestant";
      var theme = el("settingsTheme");
      if (theme) theme.value = result.data.theme || "default";
    });
  }

  function renderSyncStatus(/** @type {any} */ status) {
    var node = el("syncStatusText");
    if (!node) return;
    if (!authState || !authState.isSignedIn) {
      node.textContent = "Signed out — this plan is saved in this browser only.";
      return;
    }
    /** @type {Record<string, string>} */
    var labels = {
      idle: "Waiting…",
      syncing: status.message || "Syncing…",
      synced: status.message || "Up to date",
      error: "Could not sync: " + (status.message || "unknown error")
    };
    node.textContent = labels[status.state] || status.state;
    node.className = "sync-status is-" + status.state;
  }

  /* ----------------------------------------------------------------------
     Actions
     ---------------------------------------------------------------------- */

  /**
   * @param {Event} event
   */
  function submitCredentials(event) {
    event.preventDefault();
    if (busy) return;

    var form = /** @type {any} */ (el("accountForm"));
    var email = String(form.email.value || "").trim();
    var password = String(form.password.value || "");
    var displayName = form.displayName ? String(form.displayName.value || "").trim() : "";

    if (!email || !password) {
      showMessage("Email and password are both required.", "error");
      return;
    }

    setBusy(true);
    clearMessage();

    var isSignUp = view === "signup";
    var request = isSignUp
      ? auth().signUp({ email: email, password: password, displayName: displayName })
      : auth().signIn({ email: email, password: password });

    request
      .then(function (/** @type {any} */ result) {
        setBusy(false);
        if (result.error) {
          showMessage(describeError(result.error), "error");
          return;
        }
        form.reset();
        if (isSignUp && result.data && !result.data.session) {
          // Email confirmation is on for this project.
          showMessage(
            "Check " + email + " for a confirmation link, then sign in.",
            "success"
          );
          setView("signin");
          return;
        }
        closeDialog();
      })
      .catch(function (/** @type {any} */ error) {
        setBusy(false);
        showMessage(describeError(error), "error");
      });
  }

  /**
   * @param {Event} event
   */
  function submitResetRequest(event) {
    event.preventDefault();
    if (busy) return;

    var form = /** @type {any} */ (el("resetRequestForm"));
    var email = String(form.email.value || "").trim();
    if (!email) {
      showMessage("Enter the email address on the account.", "error");
      return;
    }

    setBusy(true);
    auth()
      .sendPasswordReset(email)
      .then(function (/** @type {any} */ result) {
        setBusy(false);
        if (result.error) {
          showMessage(describeError(result.error), "error");
          return;
        }
        showMessage(
          "If an account exists for " + email + ", a reset link is on its way.",
          "success"
        );
      });
  }

  /**
   * @param {Event} event
   */
  function submitNewPassword(event) {
    event.preventDefault();
    if (busy) return;

    var form = /** @type {any} */ (el("newPasswordForm"));
    var password = String(form.password.value || "");
    if (password.length < 6) {
      showMessage("Use at least 6 characters.", "error");
      return;
    }

    setBusy(true);
    auth()
      .updatePassword(password)
      .then(function (/** @type {any} */ result) {
        setBusy(false);
        if (result.error) {
          showMessage(describeError(result.error), "error");
          return;
        }
        form.reset();
        showMessage("Password updated.", "success");
        setView("menu");
      });
  }

  /**
   * @param {string} provider
   */
  function startOAuth(provider) {
    if (busy) return;
    setBusy(true);
    clearMessage();
    auth()
      .signInWithProvider(provider)
      .then(function (/** @type {any} */ result) {
        setBusy(false);
        if (result && result.error) {
          showMessage(describeError(result.error), "error");
        }
        // On success the browser is already navigating to the provider.
      });
  }

  function signOut() {
    auth()
      .signOut()
      .then(function (/** @type {any} */ result) {
        if (result && result.error) {
          showMessage(describeError(result.error), "error");
          return;
        }
        preferencesLoadedFor = "";
        closeDialog();
      });
  }

  function saveProfile() {
    var displayName = String(/** @type {any} */ (el("profileDisplayName")).value || "").trim();
    var avatarUrl = String(/** @type {any} */ (el("profileAvatarUrl")).value || "").trim();

    setBusy(true);
    auth()
      .updateProfile({ displayName: displayName, avatarUrl: avatarUrl || null })
      .then(function (/** @type {any} */ result) {
        setBusy(false);
        setPageNotice(
          result.error ? describeError(result.error) : "Profile saved.",
          result.error ? "error" : "success"
        );
      });
  }

  function savePreferences() {
    var db = data();
    if (!db) return;

    setBusy(true);
    db.saveSettings({
      theme: String(/** @type {any} */ (el("settingsTheme")).value || "default"),
      translation: String(/** @type {any} */ (el("settingsTranslation")).value || "KJV"),
      canon: String(/** @type {any} */ (el("settingsCanon")).value || "protestant")
    }).then(function (/** @type {any} */ result) {
      setBusy(false);
      setPageNotice(
        result.error ? describeError(result.error) : "Preferences saved.",
        result.error ? "error" : "success"
      );
    });
  }

  function changePassword() {
    var input = /** @type {any} */ (el("accountPagePassword"));
    var password = String(input.value || "");
    if (password.length < 6) {
      setPageNotice("Use at least 6 characters.", "error");
      return;
    }

    setBusy(true);
    auth()
      .updatePassword(password)
      .then(function (/** @type {any} */ result) {
        setBusy(false);
        input.value = "";
        setPageNotice(
          result.error ? describeError(result.error) : "Password updated.",
          result.error ? "error" : "success"
        );
      });
  }

  /**
   * @param {string} text
   * @param {string} tone
   */
  function setPageNotice(text, tone) {
    var node = el("accountPageNotice");
    if (!node) return;
    node.textContent = text;
    node.hidden = !text;
    node.className = "account-page-notice is-" + tone;
  }

  /* ----------------------------------------------------------------------
     Wiring
     ---------------------------------------------------------------------- */

  /**
   * @param {string} id
   * @param {string} event
   * @param {(event: any) => void} handler
   */
  function on(id, event, handler) {
    var node = el(id);
    if (node) node.addEventListener(event, handler);
  }

  function attach() {
    on("accountBtn", "click", function () {
      var modal = el("accountPopover");
      if (!modal) return;
      if (modal.hidden) openDialog();
      else closeDialog();
    });

    document.querySelectorAll("[data-auth-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setView(/** @type {any} */ (tab).dataset.authTab);
      });
    });

    on("accountForm", "submit", submitCredentials);
    on("resetRequestForm", "submit", submitResetRequest);
    on("newPasswordForm", "submit", submitNewPassword);

    on("forgotPasswordBtn", "click", function () {
      var form = /** @type {any} */ (el("accountForm"));
      var resetForm = /** @type {any} */ (el("resetRequestForm"));
      if (form && resetForm && form.email.value) resetForm.email.value = form.email.value;
      setView("reset");
    });
    on("resetBackBtn", "click", function () {
      setView("signin");
    });

    document.querySelectorAll(".oauth-button").forEach(function (node) {
      node.addEventListener("click", function () {
        var provider = /** @type {any} */ (node).dataset.provider;
        if (provider) startOAuth(provider);
      });
    });

    on("menuAccountBtn", "click", function () {
      closeDialog();
      var app = /** @type {any} */ (window).BiblePlanApp;
      if (app && app.showPage) app.showPage("account");
    });

    on("menuSettingsBtn", "click", function () {
      closeDialog();
      var app = /** @type {any} */ (window).BiblePlanApp;
<<<<<<< HEAD
      if (app && app.showPage) app.showPage("settings");
=======
      if (app && app.showPage) app.showPage("account");
      var preferences = el("accountPreferences");
      if (preferences) preferences.scrollIntoView({ behavior: "smooth", block: "center" });
>>>>>>> 32043f199c46c0697032b1151c3623d64f8b078b
    });

    on("menuSignOutBtn", "click", signOut);
    on("accountPageSignOutBtn", "click", signOut);
    on("accountPageSignInBtn", "click", openDialog);

    on("profileSaveBtn", "click", saveProfile);
    on("preferencesSaveBtn", "click", savePreferences);
    on("passwordChangeBtn", "click", changePassword);
    on("syncPushBtn", "click", function () {
      var sync = /** @type {any} */ (window).BiblePlanSync;
      if (sync) sync.pushNow();
    });
    on("syncPullBtn", "click", function () {
      var sync = /** @type {any} */ (window).BiblePlanSync;
      if (sync) sync.pullNow();
    });

    var settingsButton = document.querySelector(".sidebar-icon-btn[title='Settings']");
    if (settingsButton) {
      settingsButton.addEventListener("click", function () {
        var app = /** @type {any} */ (window).BiblePlanApp;
        if (app && app.showPage) app.showPage("account");
      });
    }
  }

  function start() {
    attach();

    var service = auth();
    if (!service) return;

    service.onChange(function (/** @type {any} */ state) {
      authState = state;

      if (!state.isSignedIn) preferencesLoadedFor = "";

      // The sidebar button renderer already lives in script.js.
      var updateSidebar = /** @type {any} */ (window).updateAccountUI;
      if (typeof updateSidebar === "function") {
        updateSidebar({
          isLoggedIn: state.isSignedIn,
          name: service.getDisplayName(),
          avatarUrl: state.profile ? state.profile.avatar_url : null
        });
      }

      render();
      renderAccountPage();

      // A recovery link lands the user back here with a live session; open
      // the dialog straight on "set a new password".
      if (state.recoveryMode) openDialog();
    });

    var sync = /** @type {any} */ (window).BiblePlanSync;
    if (sync) sync.onStatus(renderSyncStatus);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
