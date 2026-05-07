package com.nyaaydesk.app.presentation.theme

import androidx.compose.ui.graphics.Color

// Professional Government & Frontend Theme Colors
val GovNavyBlue = Color(0xFF0F2C59)
val GovNavyBlueLight = Color(0xFF1A3F7A)
val AccentBronze = Color(0xFF9B6B43) // Claude.ai inspired accent from frontend

// Light Theme Colors
val BackgroundLight = Color(0xFFFFFFFF)
val SurfaceLight = Color(0xFFF9FAFB)
val OnBackgroundLight = Color(0xFF1F2937)
val OnSurfaceLight = Color(0xFF1F2937)

// Dark Theme Colors
val BackgroundDark = Color(0xFF111827)
val SurfaceDarkFrontend = Color(0xFF1F2937)
val OnBackgroundDark = Color(0xFFF9FAFB)
val OnSurfaceDark = Color(0xFFF9FAFB)

// Legacy Aliases mapped to new clean theme
val NavyBlue = GovNavyBlue
val NavyBlueLight = GovNavyBlueLight
val NavyBlueDark = Color(0xFF081D3B)
val GoldAmber = AccentBronze
val GoldAmberDark = Color(0xFF795333)
val OffWhite = Color(0xFFFFFFFF)
val DeepCharcoal = BackgroundDark
val SurfaceDark = SurfaceDarkFrontend

// Semantic Status Colors
val StatusPending = Color(0xFFFFC107)
val StatusDisposed = Color(0xFF059669) // Green from frontend
val StatusStayed = Color(0xFFDC2626) // Red from frontend
val StatusActive = Color(0xFF2196F3)
