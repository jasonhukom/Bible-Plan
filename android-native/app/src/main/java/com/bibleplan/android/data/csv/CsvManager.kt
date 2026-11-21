package com.bibleplan.android.data.csv

import com.bibleplan.android.data.models.BookProgress

object CsvManager {

    fun exportProgressToCsv(books: List<BookProgress>): String {
        val sb = StringBuilder()
        sb.append("Book,Category,Chapter,Completed\n")

        for (book in books) {
            book.completedChapters.forEachIndexed { index, completed ->
                val chapterNum = index + 1
                sb.append("\"${book.name}\",\"${book.category}\",$chapterNum,$completed\n")
            }
        }
        return sb.toString()
    }

    fun parseCsvToProgress(csvContent: String): Map<String, List<Boolean>> {
        val resultMap = mutableMapOf<String, MutableList<Boolean>>()
        val lines = csvContent.lines()
        if (lines.isEmpty()) return emptyMap()

        val header = lines.firstOrNull() ?: return emptyMap()
        if (!header.contains("Book", ignoreCase = true)) return emptyMap()

        for (i in 1 until lines.size) {
            val line = lines[i].trim()
            if (line.isEmpty()) continue
            val parts = line.split(",").map { it.replace("\"", "").trim() }
            if (parts.size >= 4) {
                val bookName = parts[0]
                val chapterIndex = (parts[2].toIntOrNull() ?: 1) - 1
                val isCompleted = parts[3].toBooleanStrictOrNull() ?: false

                val list = resultMap.getOrPut(bookName) { mutableListOf() }
                while (list.size <= chapterIndex) {
                    list.add(false)
                }
                list[chapterIndex] = isCompleted
            }
        }

        return resultMap
    }
}
