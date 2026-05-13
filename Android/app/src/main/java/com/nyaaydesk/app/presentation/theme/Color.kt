package com.nyaaydesk.app.presentation.theme

import androidx.compose.ui.graphics.Color

// Nyaay Desk System Design Tokens (Imported from Stitch)
val DeepNavy = Color(0xFF0D1B2A) // Institutional Navy
val GoldAmber = Color(0xFFF5A623) // High-contrast Accent
val LightGrayBackground = Color(0xFFF8F9FA) // Cool background
val PureWhite = Color(0xFFFFFFFF)

// Legacy Aliases for compatibility
val GovNavyBlue = DeepNavy
val NavyBlue = DeepNavy
val AccentGold = GoldAmber
val NavyBlueDark = Color(0xFF060D14) // Darker variant of DeepNavy

// Light Theme Colors
val BackgroundLight = LightGrayBackground
val OffWhite = Color(0xFFF0F1F2)
val SurfaceLight = PureWhite
val OnBackgroundLight = Color(0xFF191C1D)
val OnSurfaceLight = Color(0xFF191C1D)

// Dark Theme Colors
val BackgroundDark = Color(0xFF191C1D)
val SurfaceDark = Color(0xFF2E3132)
val OnBackgroundDark = Color(0xFFF0F1F2)
val OnSurfaceDark = Color(0xFFF0F1F2)

// Semantic Status Colors (Indian Administrative Standard)
val StatusApproved = Color(0xFF2E7D32) // Green for finality
val StatusPending = Color(0xFFF5A623) // Amber for waiting
val StatusUrgent = Color(0xFFBA1A1A) // Red for alert/rejections
val StatusActive = Color(0xFF0D1B2A)
val StatusDisposed = Color(0xFF74777D) // Gray for closed matters
val StatusStayed = Color(0xFF525F71) // Navy Gray for stayed cases

