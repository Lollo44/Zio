package com.nonnoworkout.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF1E88E5),
    secondary = Color(0xFF43A047),
    tertiary = Color(0xFFFFA000)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF90CAF9),
    secondary = Color(0xFFA5D6A7),
    tertiary = Color(0xFFFFD54F)
)

@Composable
fun NonnoWorkoutTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}

private val Typography = androidx.compose.material3.Typography()
