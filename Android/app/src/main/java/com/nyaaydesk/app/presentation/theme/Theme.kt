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
    primary = GovNavyBlue,
    onPrimary = Color.White,
    primaryContainer = GovNavyBlueLight,
    onPrimaryContainer = Color.White,
    secondary = AccentBronze,
    onSecondary = Color.White,
    background = BackgroundLight,
    surface = SurfaceLight,
    onBackground = OnBackgroundLight,
    onSurface = OnSurfaceLight
)

private val DarkColorScheme = darkColorScheme(
    primary = GovNavyBlueLight,
    onPrimary = Color.White,
    secondary = AccentBronze,
    onSecondary = Color.White,
    background = BackgroundDark,
    surface = SurfaceDarkFrontend,
    onBackground = OnBackgroundDark,
    onSurface = OnSurfaceDark
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
        content = content
    )
}
