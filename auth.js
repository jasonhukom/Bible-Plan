// @ts-check
/* ==========================================================================
   auth.js
   --------------------------------------------------------------------------
   The one authentication service for Bible Plan. Every other file — UI, sync,
   and whatever the other engineers build — should go through this rather than
   talking to the Supabase auth SDK directly.

   Quick reference (see docs/AUTHENTICATION.md for the full guide):

     await BiblePlanAuth.ready();          // initial session restored
     BiblePlanAuth.getUser();              // user object or null
     BiblePlanAuth.getUserId();            // uuid string or null
     BiblePlanAuth.getSession();           // session object or null
     BiblePlanAuth.getClient();            // Supabase client or null
     BiblePlanAuth.onChange(handler);      // returns an unsubscribe function

   Every method that talks to the network resolves to { data, error } and
   never throws, so callers can branch on `error` instead of wrapping each
   call in try/catch.

   Exposes: window.BiblePlanAuth
   ========================================================================== */

(function () {
  "use strict";

  /** @type {any} */
  var client = null;
  /** @type {any} */
  var currentSession = null;
  /** @type {any} */
  var currentUser = null;
  /** @type {any} */
  var currentProfile = null;
  var recoveryMode = false;
  /** @type {Promise<any> | null} */
  var profileRequest = null;
  /** @type {string | null} */
  var profileRequestFor = null;

  /** @type {Array<(state: any) => void>} */
  var listeners = [];
  /** @type {Promise<void> | null} */
  var readyPromise = null;

  /* ----------------------------------------------------------------------
     Errors
     ---------------------------------------------------------------------- */

  function notConfiguredError() {
    var supa = /** @type {any} */ (window).BiblePlanSupabase;
    var detail = supa && supa.getStatusDetail ? supa.getStatusDetail() : "";
    return {
      name: "NotConfiguredError",
      message:
        "Accounts are not available yet: this deployment has no Supabase project configured." +
        (detail ? " (" + detail + ")" : "")
    };
  }

  /**
   * @param {any} error
   * @returns {{data: null, error: any}}
   */
  function fail(error) {
    return { data: null, error: error };
  }

  /* ----------------------------------------------------------------------
     State broadcast
     ---------------------------------------------------------------------- */

  /** @returns {any} */
  function snapshot() {
    return {
      isConfigured: client !== null,
      isSignedIn: !!currentUser,
      user: currentUser,
      userId: currentUser ? currentUser.id : null,
      session: currentSession,
      profile: currentProfile,
      recoveryMode: recoveryMode
    };
  }

  function broadcast() {
    var state = snapshot();
    listeners.slice().forEach(function (listener) {
      try {
        listener(state);
      } catch (error) {
        console.error("auth: a change listener threw", error);
      }
    });
  }

  /**
   * @param {any} session
   */
  function applySession(session) {
    currentSession = session || null;
    currentUser = session && session.user ? session.user : null;
    if (!currentUser) {
      currentProfile = null;
      profileRequest = null;
      profileRequestFor = null;
    }
  }

  /* ----------------------------------------------------------------------
     Profile
     ---------------------------------------------------------------------- */

  /**
   * Reads the user's profile row. The database trigger creates it at sign-up,
   * but an account created before the trigger existed would not have one, so
   * a missing row is backfilled rather than treated as an error.
   *
   * @returns {Promise<any>}
   */
  function loadProfile() {
    if (!client || !currentUser) {
      currentProfile = null;
      return Promise.resolve(null);
    }

    var userId = currentUser.id;

    // Sign-in reports through two channels at once — the signIn() call
    // resolving and onAuthStateChange firing — so without this both would
    // race to read, miss, and backfill the same profile row.
    if (profileRequest && profileRequestFor === userId) return profileRequest;

    profileRequestFor = userId;
    var request = client
      .from("profiles")
      .select("id, display_name, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle()
      .then(function (/** @type {any} */ result) {
        if (result.error) {
          console.warn("auth: could not read profile", result.error.message);
          return null;
        }
        if (result.data) return result.data;

        var metadata = currentUser.user_metadata || {};
        var fallbackName =
          metadata.display_name ||
          metadata.full_name ||
          metadata.name ||
          (currentUser.email ? String(currentUser.email).split("@")[0] : "Reader");

        return client
          .from("profiles")
          .upsert(
            {
              id: userId,
              display_name: fallbackName,
              avatar_url: metadata.avatar_url || null
            },
            { onConflict: "id" }
          )
          .select("id, display_name, avatar_url, created_at, updated_at")
          .maybeSingle()
          .then(function (/** @type {any} */ inserted) {
            if (inserted.error) {
              console.warn("auth: could not create profile", inserted.error.message);
              return null;
            }
            return inserted.data;
          });
      })
      .then(function (/** @type {any} */ profile) {
        currentProfile = profile;
        profileRequest = null;
        return profile;
      });

    profileRequest = request;
    return request;
  }

  /* ----------------------------------------------------------------------
     Bootstrap
     ---------------------------------------------------------------------- */

  /** @returns {Promise<any>} */
  function init() {
    if (readyPromise) return readyPromise;

    var supa = /** @type {any} */ (window).BiblePlanSupabase;
    if (!supa) {
      var empty = Promise.resolve();
      readyPromise = empty;
      broadcast();
      return empty;
    }

    var bootstrap = supa
      .ready()
      .then(function (/** @type {any} */ resolvedClient) {
        client = resolvedClient;
        if (!client) {
          broadcast();
          return null;
        }

        // Sessions are persisted by the SDK, so this restores a signed-in
        // user on a fresh page load, on any device they signed in on.
        return client.auth.getSession().then(function (/** @type {any} */ result) {
          if (result.error) {
            console.warn("auth: could not restore session", result.error.message);
          }
          applySession(result.data ? result.data.session : null);

          client.auth.onAuthStateChange(function (/** @type {string} */ event, /** @type {any} */ session) {
            if (event === "PASSWORD_RECOVERY") recoveryMode = true;
            if (event === "SIGNED_OUT") recoveryMode = false;

            var previousUserId = currentUser ? currentUser.id : null;
            applySession(session);
            var nextUserId = currentUser ? currentUser.id : null;

            if (nextUserId && nextUserId !== previousUserId) {
              loadProfile().then(broadcast);
            } else {
              broadcast();
            }
          });

          if (currentUser) {
            return loadProfile();
          }
          return null;
        });
      })
      .then(function () {
        broadcast();
      })
      .catch(function (/** @type {any} */ error) {
        console.error("auth: initialisation failed", error);
        broadcast();
      });

    readyPromise = bootstrap;
    return bootstrap;
  }

  /* ----------------------------------------------------------------------
     Public API
     ---------------------------------------------------------------------- */

  /** @type {any} */
  var api = {
    /** Resolves once the stored session (if any) has been restored. */
    ready: function () {
      return init().then(snapshot);
    },

    /** True when a Supabase project is wired up. */
    isConfigured: function () {
      return client !== null;
    },

    /** The shared Supabase client, or null. Prefer BiblePlanData for queries. */
    getClient: function () {
      return client;
    },

    /** The signed-in user object, or null. */
    getUser: function () {
      return currentUser;
    },

    /** The signed-in user's uuid, or null. Use this as `user_id` on writes. */
    getUserId: function () {
      return currentUser ? currentUser.id : null;
    },

    /** The current session (contains access_token, expires_at), or null. */
    getSession: function () {
      return currentSession;
    },

    /** The JWT for the current session, or null. */
    getAccessToken: function () {
      return currentSession ? currentSession.access_token : null;
    },

    /** The user's profile row ({ display_name, avatar_url, ... }), or null. */
    getProfile: function () {
      return currentProfile;
    },

    /** Display name, falling back to the email local part. */
    getDisplayName: function () {
      if (currentProfile && currentProfile.display_name) return currentProfile.display_name;
      if (!currentUser) return null;
      var metadata = currentUser.user_metadata || {};
      if (metadata.display_name) return metadata.display_name;
      if (metadata.full_name) return metadata.full_name;
      return currentUser.email ? String(currentUser.email).split("@")[0] : "Reader";
    },

    /** True while the user is following a password-recovery link. */
    isRecovering: function () {
      return recoveryMode;
    },

    /** A plain object describing the whole auth state. */
    getState: snapshot,

    /**
     * Subscribe to auth changes. The handler fires immediately with the
     * current state and on every later change.
     * @param {(state: any) => void} handler
     * @returns {() => void} unsubscribe
     */
    onChange: function (handler) {
      if (typeof handler !== "function") return function () {};
      listeners.push(handler);
      init().then(function () {
        try {
          handler(snapshot());
        } catch (error) {
          console.error("auth: a change listener threw", error);
        }
      });
      return function () {
        listeners = listeners.filter(function (entry) {
          return entry !== handler;
        });
      };
    },

    /* -------------------------------------------------------------- */

    /**
     * @param {{email: string, password: string, displayName?: string}} credentials
     */
    signUp: function (credentials) {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        return client.auth
          .signUp({
            email: credentials.email,
            password: credentials.password,
            options: {
              emailRedirectTo: window.location.origin + window.location.pathname,
              data: {
                display_name:
                  credentials.displayName ||
                  String(credentials.email || "").split("@")[0]
              }
            }
          })
          .then(function (/** @type {any} */ result) {
            if (!result.error && result.data && result.data.session) {
              applySession(result.data.session);
              return loadProfile().then(function () {
                broadcast();
                return result;
              });
            }
            return result;
          });
      });
    },

    /**
     * @param {{email: string, password: string}} credentials
     */
    signIn: function (credentials) {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        return client.auth
          .signInWithPassword({
            email: credentials.email,
            password: credentials.password
          })
          .then(function (/** @type {any} */ result) {
            if (!result.error && result.data && result.data.session) {
              applySession(result.data.session);
              return loadProfile().then(function () {
                broadcast();
                return result;
              });
            }
            return result;
          });
      });
    },

    /**
     * Redirects to the provider. Whichever providers you enable in
     * Supabase (Authentication -> Providers) work here unchanged.
     * @param {string} provider e.g. "google", "apple", "github"
     */
    signInWithProvider: function (provider) {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        return client.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: window.location.origin + window.location.pathname
          }
        });
      });
    },

    signOut: function () {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        return client.auth.signOut().then(function (/** @type {any} */ result) {
          applySession(null);
          recoveryMode = false;
          broadcast();
          return result;
        });
      });
    },

    /**
     * Sends the "reset your password" email. The link returns to this app,
     * where onAuthStateChange reports PASSWORD_RECOVERY and the account
     * dialog switches to the "set a new password" view.
     * @param {string} email
     */
    sendPasswordReset: function (email) {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        return client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname
        });
      });
    },

    /**
     * Sets a new password for the signed-in (or recovering) user.
     * @param {string} newPassword
     */
    updatePassword: function (newPassword) {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        return client.auth
          .updateUser({ password: newPassword })
          .then(function (/** @type {any} */ result) {
            if (!result.error) {
              recoveryMode = false;
              broadcast();
            }
            return result;
          });
      });
    },

    /**
     * Updates the user's own profile row.
     * @param {{displayName?: string, avatarUrl?: string | null}} changes
     */
    updateProfile: function (changes) {
      return init().then(function () {
        if (!client) return fail(notConfiguredError());
        if (!currentUser) return fail({ message: "Not signed in." });

        /** @type {any} */
        var patch = { id: currentUser.id };
        if (typeof changes.displayName === "string") patch.display_name = changes.displayName;
        if (changes.avatarUrl !== undefined) patch.avatar_url = changes.avatarUrl;

        return client
          .from("profiles")
          .upsert(patch, { onConflict: "id" })
          .select("id, display_name, avatar_url, created_at, updated_at")
          .maybeSingle()
          .then(function (/** @type {any} */ result) {
            if (!result.error) {
              currentProfile = result.data;
              broadcast();
            }
            return result;
          });
      });
    },

    /** Re-reads the profile row from the database. */
    refreshProfile: function () {
      return init().then(function () {
        return loadProfile().then(function (profile) {
          broadcast();
          return profile;
        });
      });
    }
  };

  /** @type {any} */ (window).BiblePlanAuth = api;

  init();
})();
