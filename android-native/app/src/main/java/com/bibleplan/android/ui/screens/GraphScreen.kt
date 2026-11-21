package com.bibleplan.android.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bibleplan.android.data.models.ConnectionArc
import com.bibleplan.android.theme.AccentBlue
import com.bibleplan.android.theme.AccentGreen
import com.bibleplan.android.theme.AccentGreenBright
import com.bibleplan.android.theme.AccentPurple
import com.bibleplan.android.theme.AccentRed
import com.bibleplan.android.theme.BgCard
import com.bibleplan.android.theme.BgDark
import com.bibleplan.android.theme.BgSurface
import com.bibleplan.android.theme.BorderDark
import com.bibleplan.android.theme.TextMuted
import com.bibleplan.android.theme.TextPrimary
import com.bibleplan.android.theme.TextSecondary
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun GraphScreen(
    connections: List<ConnectionArc>
) {
    var viewModeIndex by remember { mutableIntStateOf(0) } // 0 = Chronological, 1 = Canonical
    var selectedConnection by remember { mutableStateOf<ConnectionArc?>(connections.firstOrNull()) }

    val viewModes = listOf("Chronological View", "Canonical View")

    val booksList = remember {
        listOf(
            "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
            "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
            "Psalms", "Isaiah", "Jeremiah", "Micah", "Zechariah", "Malachi",
            "Matthew", "Mark", "Luke", "John", "Acts",
            "Romans", "1 Corinthians", "Ephesians", "Hebrews", "Revelation"
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
    ) {
        // Header & Mode Selector Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(BgSurface)
                .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                .padding(14.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Timeline,
                            contentDescription = "Graph",
                            tint = AccentPurple,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Biblical Cross-Reference Graph",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Mode toggle buttons
                Row(modifier = Modifier.fillMaxWidth()) {
                    viewModes.forEachIndexed { idx, mode ->
                        val isSel = idx == viewModeIndex
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSel) AccentPurple.copy(alpha = 0.2f) else BgDark)
                                .border(1.dp, if (isSel) AccentPurple else BorderDark, RoundedCornerShape(8.dp))
                                .clickable { viewModeIndex = idx }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = mode,
                                color = if (isSel) AccentPurple else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                        if (idx == 0) Spacer(modifier = Modifier.width(8.dp))
                    }
                }
            }
        }

        // Canvas for Connection Arcs
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(BgSurface)
                .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTapGestures { offset ->
                            // Cycle selected connection on canvas tap
                            val currentIndex = connections.indexOf(selectedConnection)
                            val nextIndex = (currentIndex + 1) % connections.size
                            selectedConnection = connections.getOrNull(nextIndex)
                        }
                    }
            ) {
                val canvasWidth = size.width
                val canvasHeight = size.height
                val centerX = canvasWidth / 2f
                val centerY = canvasHeight / 2f
                val radius = minOf(canvasWidth, canvasHeight) * 0.38f

                // Draw central orbital circle
                drawCircle(
                    color = BorderDark,
                    radius = radius,
                    center = Offset(centerX, centerY),
                    style = Stroke(width = 2f)
                )

                // Position book nodes around circle
                val totalBooks = booksList.size
                val nodePositions = mutableMapOf<String, Offset>()

                booksList.forEachIndexed { idx, bookName ->
                    val angle = (2 * PI * idx / totalBooks) - (PI / 2)
                    val x = centerX + (radius * cos(angle)).toFloat()
                    val y = centerY + (radius * sin(angle)).toFloat()
                    nodePositions[bookName] = Offset(x, y)

                    val isSelected = selectedConnection?.sourceBook == bookName || selectedConnection?.targetBook == bookName
                    val isOT = idx < 16
                    val nodeColor = if (isSelected) AccentGreenBright else if (isOT) AccentBlue else AccentPurple

                    // Node dot
                    drawCircle(
                        color = nodeColor,
                        radius = if (isSelected) 8.dp.toPx() else 4.dp.toPx(),
                        center = Offset(x, y)
                    )
                }

                // Draw Cross-Reference Arcs
                connections.forEach { conn ->
                    val srcPos = nodePositions[conn.sourceBook]
                    val tgtPos = nodePositions[conn.targetBook]

                    if (srcPos != null && tgtPos != null) {
                        val isConnSelected = conn.id == selectedConnection?.id
                        val arcColor = if (isConnSelected) AccentGreenBright else when (conn.category) {
                            "Prophecy" -> AccentPurple.copy(alpha = 0.5f)
                            "Messianic" -> AccentGreen.copy(alpha = 0.6f)
                            else -> AccentBlue.copy(alpha = 0.4f)
                        }
                        val strokeWidth = if (isConnSelected) 4.dp.toPx() else 2.dp.toPx()

                        val path = Path().apply {
                            moveTo(srcPos.x, srcPos.y)
                            // Control point curve towards center
                            val controlX = (srcPos.x + tgtPos.x) / 2f + (centerX - (srcPos.x + tgtPos.x) / 2f) * 0.5f
                            val controlY = (srcPos.y + tgtPos.y) / 2f + (centerY - (srcPos.y + tgtPos.y) / 2f) * 0.5f
                            quadraticTo(controlX, controlY, tgtPos.x, tgtPos.y)
                        }

                        drawPath(
                            path = path,
                            color = arcColor,
                            style = Stroke(width = strokeWidth)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Selected Connection Details Card
        selectedConnection?.let { conn ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(BgSurface)
                    .border(1.dp, AccentPurple.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(AccentPurple.copy(alpha = 0.2f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = conn.category,
                                color = AccentPurple,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "Prophecy -> Fulfillment",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "${conn.sourceBook} ${conn.sourceChapter} ➔ ${conn.targetBook} ${conn.targetChapter}",
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Text(
                        text = conn.label,
                        color = TextSecondary,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }
        }
    }
}
