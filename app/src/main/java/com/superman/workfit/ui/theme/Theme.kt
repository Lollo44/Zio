package com.superman.workfit.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0066CC),
    secondary = Color(0xFF00A884),
    tertiary = Color(0xFFFF9800)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF7AB3FF),
    secondary = Color(0xFF5AD3B2),
    tertiary = Color(0xFFFFB74D)
)

@Composable
fun SupermanWorkfitTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}

@Immutable
private val Typography = androidx.compose.material3.Typography()
