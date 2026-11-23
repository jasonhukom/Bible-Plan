package com.bibleplan.android.data.models

data class UserAccount(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String = "",
    val activePlanId: String = "chronological"
)

data class ReadingPlan(
    val id: String,
    val name: String,
    val description: String,
    val totalDays: Int,
    val currentDay: Int = 1,
    val isCustom: Boolean = false,
    val category: String = "Canonical"
)

data class BookProgress(
    val id: String,
    val name: String,
    val category: String, // "Old Testament", "New Testament", "Secret"
    val totalChapters: Int,
    val completedChapters: MutableList<Boolean>
) {
    val completedCount: Int get() = completedChapters.count { it }
    val progressPercent: Float get() = if (totalChapters == 0) 0f else completedCount.toFloat() / totalChapters
}

data class ConnectionArc(
    val id: String,
    val sourceBook: String,
    val sourceChapter: Int,
    val targetBook: String,
    val targetChapter: Int,
    val label: String,
    val category: String, // "Prophecy", "Messianic", "Parallel", "Type/Antitype"
    val isProphecyFulfillment: Boolean = true
)

data class VerseRef(
    val book: String,
    val chapter: Int,
    val verse: Int,
    val text: String
)

data class GeminiSearchResult(
    val query: String,
    val explanation: String,
    val relevantVerses: List<VerseRef>,
    val timestamp: Long = System.currentTimeMillis()
)

data class SecretBook(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: String, // "Apocrypha", "Deuterocanonical", "Pseudepigrapha"
    val description: String,
    val totalChapters: Int,
    val completedChapters: MutableList<Boolean> = MutableList(totalChapters) { false }
)

data class DailyReading(
    val dayNumber: Int,
    val dateLabel: String,
    val passages: List<String>,
    val isCompleted: Boolean = false
)
