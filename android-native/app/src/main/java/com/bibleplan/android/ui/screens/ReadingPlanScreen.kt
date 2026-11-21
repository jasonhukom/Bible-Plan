package com.bibleplan.android.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bibleplan.android.data.models.BookProgress
import com.bibleplan.android.theme.AccentBlue
import com.bibleplan.android.theme.AccentGreen
import com.bibleplan.android.theme.AccentGreenBright
import com.bibleplan.android.theme.AccentPurple
import com.bibleplan.android.theme.BgCard
import com.bibleplan.android.theme.BgDark
import com.bibleplan.android.theme.BgSurface
import com.bibleplan.android.theme.BorderDark
import com.bibleplan.android.theme.TextMuted
import com.bibleplan.android.theme.TextPrimary
import com.bibleplan.android.theme.TextSecondary

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ReadingPlanScreen(
    books: List<BookProgress>,
    onToggleChapter: (bookId: String, chapterIndex: Int) -> Unit
) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val categories = listOf("All Books", "Old Testament", "New Testament", "Secret Books")

    val expandedState = remember { mutableStateMapOf<String, Boolean>() }

    val filteredBooks = remember(selectedTabIndex, books) {
        when (selectedTabIndex) {
            1 -> books.filter { it.category == "Old Testament" }
            2 -> books.filter { it.category == "New Testament" }
            3 -> books.filter { it.category == "Secret" }
            else -> books
        }
    }

    val totalChaptersOverall = books.sumOf { it.totalChapters }
    val completedChaptersOverall = books.sumOf { it.completedCount }
    val overallPercent = if (totalChaptersOverall > 0) (completedChaptersOverall.toFloat() / totalChaptersOverall * 100).toInt() else 0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
    ) {
        // Progress Summary Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(BgSurface)
                .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                .padding(16.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Overall Reading Progress",
                            color = TextSecondary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "$completedChaptersOverall / $totalChaptersOverall Chapters",
                            color = TextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = "$overallPercent%",
                        color = AccentGreenBright,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                LinearProgressIndicator(
                    progress = { if (totalChaptersOverall > 0) completedChaptersOverall.toFloat() / totalChaptersOverall else 0f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = AccentGreenBright,
                    trackColor = BgCard
                )
            }
        }

        // Category Filter Tabs
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = BgDark,
            contentColor = TextPrimary,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = AccentGreenBright
                )
            }
        ) {
            categories.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Text(
                            text = title,
                            fontSize = 12.sp,
                            fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedTabIndex == index) TextPrimary else TextSecondary
                        )
                    }
                )
            }
        }

        // Books Checklist List
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filteredBooks, key = { it.id }) { book ->
                val isExpanded = expandedState[book.id] ?: false
                val percentInt = (book.progressPercent * 100).toInt()

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = BgSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderDark),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { expandedState[book.id] = !isExpanded },
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = book.name,
                                        color = TextPrimary,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(
                                                when (book.category) {
                                                    "Old Testament" -> AccentGreen.copy(alpha = 0.2f)
                                                    "New Testament" -> AccentBlue.copy(alpha = 0.2f)
                                                    else -> AccentPurple.copy(alpha = 0.2f)
                                                }
                                            )
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = book.category,
                                            fontSize = 10.sp,
                                            color = when (book.category) {
                                                "Old Testament" -> AccentGreenBright
                                                "New Testament" -> AccentBlue
                                                else -> AccentPurple
                                            },
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                                Text(
                                    text = "${book.completedCount} of ${book.totalChapters} chapters ($percentInt%)",
                                    color = TextSecondary,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                            }

                            Icon(
                                imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                contentDescription = "Expand",
                                tint = TextSecondary
                            )
                        }

                        // Chapter Grid when expanded
                        AnimatedVisibility(visible = isExpanded) {
                            Column(modifier = Modifier.padding(top = 12.dp)) {
                                Text(
                                    text = "Tap chapter to mark completed:",
                                    fontSize = 11.sp,
                                    color = TextMuted,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )

                                FlowRow(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    book.completedChapters.forEachIndexed { index, isChecked ->
                                        val chapterNum = index + 1
                                        Box(
                                            modifier = Modifier
                                                .size(34.dp)
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(if (isChecked) AccentGreen else BgCard)
                                                .border(
                                                    1.dp,
                                                    if (isChecked) AccentGreenBright else BorderDark,
                                                    RoundedCornerShape(6.dp)
                                                )
                                                .clickable {
                                                    onToggleChapter(book.id, index)
                                                },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "$chapterNum",
                                                color = if (isChecked) Color.White else TextSecondary,
                                                fontSize = 12.sp,
                                                fontWeight = if (isChecked) FontWeight.Bold else FontWeight.Normal
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
