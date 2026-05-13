package com.nyaaydesk.app.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.presentation.theme.*

/**
 * CaseCard — Redesigned to match Stitch design.
 * - White card, 8dp radius, 1px gray border
 * - Case number in JetBrains Mono (monospace) at top-left
 * - Status badge at top-right
 * - Type and Court below
 * - Action buttons at bottom
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseCard(
    case: CaseEntity,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(containerColor = PureWhite)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Top row: Case number + Status badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = case.cnrNumber ?: case.caseNumber,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    letterSpacing = 0.05.sp,
                    color = DeepNavy
                )
                CaseStatusBadge(status = case.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Type and Court
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Person, null, Modifier.size(14.dp), tint = DeepNavy.copy(0.5f))
                    Text(
                        "Type: ${case.caseType ?: "Civil"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = DeepNavy.copy(alpha = 0.7f)
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.AccountBalance, null, Modifier.size(14.dp), tint = DeepNavy.copy(0.5f))
                    Text(
                        text = "Court: ${case.courtId ?: "Main District Court"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = DeepNavy.copy(alpha = 0.6f)
                    )
                }
            }

            if (!case.status.equals("disposed", ignoreCase = true)) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color(0xFFF0F0F0))
                Spacer(modifier = Modifier.height(12.dp))

                // Action row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onClick,
                        modifier = Modifier.weight(1f).height(36.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, DeepNavy.copy(alpha = 0.3f)),
                        contentPadding = PaddingValues(horizontal = 8.dp)
                    ) {
                        Icon(Icons.Default.CalendarMonth, null, Modifier.size(14.dp), tint = DeepNavy)
                        Spacer(Modifier.width(4.dp))
                        Text("View Hearings", style = MaterialTheme.typography.labelSmall, color = DeepNavy)
                    }
                    OutlinedButton(
                        onClick = onClick,
                        modifier = Modifier.weight(1f).height(36.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, DeepNavy.copy(alpha = 0.3f)),
                        contentPadding = PaddingValues(horizontal = 8.dp)
                    ) {
                        Icon(Icons.Default.FolderOpen, null, Modifier.size(14.dp), tint = DeepNavy)
                        Spacer(Modifier.width(4.dp))
                        Text("Documents", style = MaterialTheme.typography.labelSmall, color = DeepNavy)
                    }
                }
            } else {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color(0xFFF0F0F0))
                Spacer(modifier = Modifier.height(8.dp))
                TextButton(
                    onClick = onClick,
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Icon(Icons.Default.Visibility, null, Modifier.size(14.dp), tint = DeepNavy.copy(0.5f))
                    Spacer(Modifier.width(4.dp))
                    Text("View Archive", style = MaterialTheme.typography.bodySmall, color = DeepNavy.copy(0.5f))
                }
            }
        }
    }
}

/**
 * CaseStatusBadge — Redesigned pill to match Stitch design exactly.
 * - Gold pill for HEARING/SCHEDULED
 * - Red for URGENT
 * - Gray outlined for DISPOSED
 * - Navy for FILED/ACTIVE
 */
@Composable
fun CaseStatusBadge(status: String) {
    val (bgColor, textColor, label) = when (status.lowercase()) {
        "hearing", "scheduled", "hearing scheduled" -> Triple(GoldAmber, DeepNavy, "HEARING")
        "filed" -> Triple(DeepNavy.copy(alpha = 0.1f), DeepNavy, "FILED")
        "disposed" -> Triple(Color(0xFFF0F1F2), StatusDisposed, "DISPOSED")
        "urgent" -> Triple(StatusUrgent.copy(alpha = 0.12f), StatusUrgent, "URGENT")
        "pending" -> Triple(Color.Transparent, StatusDisposed, "PENDING")
        "active" -> Triple(StatusApproved.copy(alpha = 0.1f), StatusApproved, "ACTIVE")
        "stayed" -> Triple(Color(0xFFEDE7F6), Color(0xFF7B1FA2), "STAYED")
        else -> Triple(DeepNavy.copy(alpha = 0.08f), DeepNavy, status.uppercase())
    }

    val shape = RoundedCornerShape(50)
    val hasBorder = status.lowercase() == "pending"

    Surface(
        color = bgColor,
        shape = shape,
        border = if (hasBorder) BorderStroke(1.dp, StatusDisposed.copy(0.4f)) else null
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = textColor,
            letterSpacing = 0.05.sp
        )
    }
}
