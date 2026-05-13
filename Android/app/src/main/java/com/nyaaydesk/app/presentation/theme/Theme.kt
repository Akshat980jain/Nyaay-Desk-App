package com.nyaaydesk.app.presentation.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = DeepNavy,
    onPrimary = Color.White,
    primaryContainer = DeepNavy.copy(alpha = 0.1f),
    onPrimaryContainer = DeepNavy,
    secondary = GoldAmber,
    onSecondary = DeepNavy,
    background = LightGrayBackground,
    surface = PureWhite,
    onBackground = DeepNavy,
    onSurface = DeepNavy
)

private val DarkColorScheme = darkColorScheme(
    primary = DeepNavy,
    onPrimary = Color.White,
    secondary = GoldAmber,
    onSecondary = DeepNavy,
    background = Color(0xFF0D1B2A),
    surface = Color(0xFF1B263B),
    onBackground = Color.White,
    onSurface = Color.White
)


@Composable
fun NyaayDeskTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = NyaayDeskTypography,
        shapes = NyaayDeskShapes,
        content = content
    )
}

