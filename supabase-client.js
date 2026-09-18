// @ts-check
/* ==========================================================================
   supabase-client.js
   --------------------------------------------------------------------------
   Resolves the *public* Supabase configuration and creates the single browser
   client the rest of the app shares.

   Config is looked up in this order, first hit wins:

     1. window.BIBLE_PLAN_PUBLIC_CONFIG
        Set it yourself from any script tag if you have your own mechanism.

     2. GET /api/config
        The Vercel serverless function in api/config.js, which reads
        SUPABASE_URL and SUPABASE_ANON_KEY from the deployment's environment
        variables. This is the production path.

     3. GET supabase.config.json
        A local, git-ignored file for opening the app with a plain static
        server (python -m http.server, Live Server, ...) where /api is not
        running. Copy supabase.config.example.json to get started.

   Only the project URL and the anon (publishable) key ever reach the browser.
   Both are safe to expose: the anon key carries no privileges of its own, and
   every table is behind Row Level Security. The service-role key must never
   appear in any file under this directory.

   Exposes: window.BiblePlanSupabase
   ========================================================================== */

(function () {
  "use strict";

  var SDK_GLOBAL = "supabase";
  var LOCAL_CONFIG_URL = "supabase.config.json";
  var API_CONFIG_URL = "/api/config";

  /** @type {any} */
  var client = null;
  /** @type {{url: string, anonKey: string, source: string} | null} */
  var resolvedConfig = null;
  /** @type {string} */
  var status = "pending";
  /** @type {string} */
  var statusDetail = "";
  /** @type {Promise<any> | null} */
  var readyPromise = null;

  /**
   * @param {any} value
   * @returns {value is {supabaseUrl: string, supabaseAnonKey: string}}
   */
  function looksUsable(value) {
    return !!(
      value &&
      typeof value.supabaseUrl === "string" &&
      typeof value.supabaseAnonKey === "string" &&
      value.supabaseUrl.trim() &&
      value.supabaseAnonKey.trim()
    );
  }

  /**
   * @param {string} url
   * @returns {Promise<any>}
   */
  function fetchJson(url) {
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) return null;
        var contentType = response.headers.get("content-type") || "";
        if (contentType.indexOf("json") === -1) return null;
        return response.json();
      })
      .catch(function () {
        return null;
      });
  }

  /**
   * @returns {Promise<{url: string, anonKey: string, source: string} | null>}
   */
  function resolveConfig() {
    var inline = /** @type {any} */ (window).BIBLE_PLAN_PUBLIC_CONFIG;
    if (looksUsable(inline)) {
      return Promise.resolve({
        url: inline.supabaseUrl.trim(),
        anonKey: inline.supabaseAnonKey.trim(),
        source: "window.BIBLE_PLAN_PUBLIC_CONFIG"
      });
    }

    return fetchJson(API_CONFIG_URL).then(function (fromApi) {
      if (looksUsable(fromApi)) {
        return {
          url: fromApi.supabaseUrl.trim(),
          anonKey: fromApi.supabaseAnonKey.trim(),
          source: API_CONFIG_URL
        };
      }
      return fetchJson(LOCAL_CONFIG_URL).then(function (fromFile) {
        if (looksUsable(fromFile)) {
          return {
            url: fromFile.supabaseUrl.trim(),
            anonKey: fromFile.supabaseAnonKey.trim(),
            source: LOCAL_CONFIG_URL
          };
        }
        return null;
      });
    });
  }

  /**
   * Creates the client once. Resolves to the client, or to null when the app
   * has not been given a Supabase project yet — in which case the rest of the
   * app keeps working against localStorage alone.
   *
   * @returns {Promise<any>}
   */
  function init() {
    if (readyPromise) return readyPromise;

    readyPromise = resolveConfig().then(function (config) {
      if (!config) {
        status = "unconfigured";
        statusDetail =
          "No Supabase credentials found. Set SUPABASE_URL and SUPABASE_ANON_KEY " +
          "on the deployment, or create supabase.config.json locally.";
        return null;
      }

      var sdk = /** @type {any} */ (window)[SDK_GLOBAL];
      if (!sdk || typeof sdk.createClient !== "function") {
        status = "sdk-missing";
        statusDetail =
          "The Supabase JS SDK did not load (offline, or the CDN script tag was blocked).";
        return null;
      }

      try {
        client = sdk.createClient(config.url, config.anonKey, {
          auth: {
            // Keep the session in localStorage and refresh it in the
            // background, so a signed-in user stays signed in across
            // reloads and devices.
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "biblePlan.auth.v1",
            flowType: "pkce"
          }
        });
        resolvedConfig = config;
        status = "ready";
        statusDetail = "";
        return client;
      } catch (error) {
        status = "error";
        statusDetail = error instanceof Error ? error.message : String(error);
        console.error("supabase-client: could not create the client", error);
        return null;
      }
    });

    return readyPromise;
  }

  /** @type {import("./types/bible-plan").BiblePlanSupabase} */
  var api = {
    /** Resolves to the Supabase client, or null if unconfigured. */
    ready: init,

    /** The client, or null if init() has not finished / failed. */
    getClient: function () {
      return client;
    },

    /** True once a client exists. */
    isConfigured: function () {
      return client !== null;
    },

    /** "pending" | "ready" | "unconfigured" | "sdk-missing" | "error" */
    getStatus: function () {
      return status;
    },

    /** Human-readable reason when getStatus() is not "ready". */
    getStatusDetail: function () {
      return statusDetail;
    },

    /** Project URL and config source. Never includes any key. */
    getProjectInfo: function () {
      if (!resolvedConfig) return null;
      return { url: resolvedConfig.url, source: resolvedConfig.source };
    }
  };

  /** @type {any} */ (window).BiblePlanSupabase = api;

  init();
})();
