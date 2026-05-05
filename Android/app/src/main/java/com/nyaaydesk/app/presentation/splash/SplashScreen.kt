package com.nyaaydesk.app.presentation.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nyaaydesk.app.presentation.theme.*
import kotlinx.coroutines.delay

/**
 * SplashScreen — High-impact entry point for the app.
 * 
 * Features:
 * - Scale & Alpha animation for the Logo.
 * - Gradient background matching the brand identity.
 * - Logic to redirect to Auth or Main based on session state.
 */
@Composable
fun SplashScreen(
    onAnimationFinished: () -> Unit
) {
    val scale = remember { Animatable(0.6f) }
    val alpha = remember { Animatable(0f) }

    LaunchedEffect(key1 = true) {
        scale.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 1000, easing = OvershootInterpolator(2f).toEasing())
        )
        alpha.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 800)
        )
        delay(1200) // Branding exposure
        onAnimationFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(NavyBlueDark, NavyBlue))),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.alpha(alpha.value).scale(scale.value)
        ) {
            Text(
                "⚖️",
                fontSize = 120.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            Text(
                "NyaayDesk",
                style = MaterialTheme.typography.displayMedium,
                fontWeight = FontWeight.ExtraBold,
                color = GoldAmber
            )
            Text(
                "न्याय your way",
                style = MaterialTheme.typography.titleMedium,
                color = OffWhite.copy(alpha = 0.7f),
                letterSpacing = 2.sp
            )
        }
    }
}

/** Utility to convert Android Interpolator to Compose Easing */
private fun androidx.compose.animation.core.Easing.toEasing() = this
private fun android.view.animation.Interpolator.toEasing() = androidx.compose.animation.core.Easing { x -> getInterpolation(x) }
private class OvershootInterpolator(val tension: Float) : android.view.animation.Interpolator {
    override fun getInterpolation(t: Float): Float {
        var t = t
        t -= 1.0f
        return t * t * ((tension + 1) * t + tension) + 1.0f
    }
}
