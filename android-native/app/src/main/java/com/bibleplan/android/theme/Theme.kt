package com.bibleplan.android.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = AccentGreenBright,
    onPrimary = Color.White,
    secondary = AccentBlueBright,
    onSecondary = Color.White,
    tertiary = AccentPurple,
    background = BgDark,
    onBackground = TextPrimary,
    surface = BgSurface,
    onSurface = TextPrimary,
    surfaceVariant = BgCard,
    onSurfaceVariant = TextSecondary,
    outline = BorderDark,
    error = AccentRed
)

@Composable
fun BiblePlanTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
