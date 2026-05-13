package com.nyaaydesk.app.presentation.components

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nyaaydesk.app.presentation.theme.DeepNavy
import com.nyaaydesk.app.presentation.theme.GoldAmber

/**
 * NyaayDesk primary button — Gold/Amber background, Deep Navy text.
 * Matches Stitch design system "Primary: Amber background, dark navy text."
 */
@Composable
fun NyaayButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    enabled: Boolean = true
) {
    Button(
        onClick = { if (!isLoading) onClick() },
        modifier = modifier.height(52.dp),
        enabled = enabled && !isLoading,
        colors = ButtonDefaults.buttonColors(
            containerColor = GoldAmber,
            contentColor = DeepNavy,
            disabledContainerColor = GoldAmber.copy(alpha = 0.4f),
            disabledContentColor = DeepNavy.copy(alpha = 0.4f)
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = DeepNavy
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * NyaayDesk secondary button — Outlined, navy border and text.
 * Matches Stitch design system "Secondary: Transparent bg, dark navy border (1px), navy text."
 */
@Composable
fun NyaaySecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(52.dp),
        enabled = enabled,
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = DeepNavy,
        ),
        border = androidx.compose.foundation.BorderStroke(1.dp, DeepNavy),
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium
        )
    }
}
