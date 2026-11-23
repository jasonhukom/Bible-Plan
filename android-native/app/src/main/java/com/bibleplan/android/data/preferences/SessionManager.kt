package com.bibleplan.android.data.preferences

import android.content.Context
import android.content.SharedPreferences
import com.bibleplan.android.data.models.ReadingPlan
import com.bibleplan.android.data.models.UserAccount
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("bible_plan_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        const val GOOGLE_OAUTH_KEY = "AIzaSyD4waEnzXflmA5Zj8O-KEJ0ao9X7CQmg1E"
        private const val KEY_SHOW_PLAN_SELECTOR = "show_plan_selector_on_startup"
        private const val KEY_ACTIVE_ACCOUNT_ID = "active_account_id"
        private const val KEY_ACCOUNTS_JSON = "accounts_json"
        private const val KEY_ACTIVE_PLAN_ID = "active_plan_id"
        private const val KEY_SESSION_TOKEN = "session_token"
        private const val KEY_PROGRESS_JSON = "progress_json"
    }

    var showPlanSelectorOnStartup: Boolean
        get() = prefs.getBoolean(KEY_SHOW_PLAN_SELECTOR, true)
        set(value) = prefs.edit().putBoolean(KEY_SHOW_PLAN_SELECTOR, value).apply()

    var activeAccountId: String
        get() = prefs.getString(KEY_ACTIVE_ACCOUNT_ID, "default_account") ?: "default_account"
        set(value) = prefs.edit().putString(KEY_ACTIVE_ACCOUNT_ID, value).apply()

    var activePlanId: String
        get() = prefs.getString(KEY_ACTIVE_PLAN_ID, "chronological") ?: "chronological"
        set(value) = prefs.edit().putString(KEY_ACTIVE_PLAN_ID, value).apply()

    var sessionToken: String
        get() = prefs.getString(KEY_SESSION_TOKEN, "") ?: ""
        set(value) = prefs.edit().putString(KEY_SESSION_TOKEN, value).apply()

    fun getAccounts(): List<UserAccount> {
        val json = prefs.getString(KEY_ACCOUNTS_JSON, null) ?: return defaultAccounts()
        return try {
            val type = object : TypeToken<List<UserAccount>>() {}.type
            gson.fromJson(json, type) ?: defaultAccounts()
        } catch (e: Exception) {
            defaultAccounts()
        }
    }

    fun saveAccounts(accounts: List<UserAccount>) {
        val json = gson.toJson(accounts)
        prefs.edit().putString(KEY_ACCOUNTS_JSON, json).apply()
    }

    fun getActiveAccount(): UserAccount {
        val accounts = getAccounts()
        return accounts.find { it.id == activeAccountId } ?: accounts.first()
    }

    fun addAccount(account: UserAccount) {
        val list = getAccounts().toMutableList()
        list.add(account)
        saveAccounts(list)
        activeAccountId = account.id
    }

    private fun defaultAccounts(): List<UserAccount> {
        return listOf(
            UserAccount(
                id = "default_account",
                name = "Discipleship Profile",
                email = "user@bibleplan.app",
                activePlanId = "chronological"
            ),
            UserAccount(
                id = "academic_account",
                name = "Theological / Academic Profile",
                email = "scholar@bibleplan.app",
                activePlanId = "chronological"
            )
        )
    }

    fun getSavedProgress(): Map<String, List<Boolean>> {
        val json = prefs.getString(KEY_PROGRESS_JSON, null) ?: return emptyMap()
        return try {
            val type = object : TypeToken<Map<String, List<Boolean>>>() {}.type
            gson.fromJson(json, type) ?: emptyMap()
        } catch (e: Exception) {
            emptyMap()
        }
    }

    fun saveProgress(progress: Map<String, List<Boolean>>) {
        val json = gson.toJson(progress)
        prefs.edit().putString(KEY_PROGRESS_JSON, json).apply()
    }
}
