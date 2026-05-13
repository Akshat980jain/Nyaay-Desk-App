package com.nyaaydesk.app.presentation.admin

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.litigant.NyaayTopBar
import com.nyaaydesk.app.presentation.theme.*

/**
 * AdminDashboardScreen — Redesigned to match Stitch clerk_admin_overview.
 *
 * Layout:
 * - Dark navy top bar: center title "Nyaay Desk", left hamburger, right Logout
 * - "Overview" heading + "System statistics for today."
 * - 2×2 stats grid: Active Cases, Today's Hearings, Pending Cases (red), Disposed Cases
 * - "Action Required" section header
 * - Advocate Verifications card (with red "2 Pending" pill + Review button)
 * - NOC Review card
 * - New Case Entry + Upload Order quick action buttons
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(viewModel: AdminViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(LightGrayBackground),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // ── TOP NAV ──────────────────────────────────────────────────────
        item { NyaayTopBar(onLogout = {}) }

        // ── OVERVIEW HEADER ──────────────────────────────────────────────
        item {
            Column(modifier = Modifier.padding(16.dp, 20.dp, 16.dp, 12.dp)) {
                Text("Overview", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = DeepNavy)
                Text("System statistics for today.", style = MaterialTheme.typography.bodyMedium, color = DeepNavy.copy(0.6f))
            }
        }

        // ── 2×2 STATS GRID ───────────────────────────────────────────────
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AdminStatTile(
                        label = "ACTIVE CASES",
                        value = "${uiState.summary?.totalCases ?: 120}",
                        valueColor = DeepNavy,
                        icon = Icons.Default.Gavel,
                        modifier = Modifier.weight(1f)
                    )
                    AdminStatTile(
                        label = "TODAY'S HEARINGS",
                        value = "${uiState.summary?.todayHearings ?: 12}",
                        valueColor = GoldAmber,
                        icon = Icons.Default.CalendarMonth,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AdminStatTile(
                        label = "PENDING CASES",
                        value = "${uiState.summary?.pendingCases ?: 45}",
                        valueColor = StatusUrgent,
                        icon = Icons.Default.HourglassEmpty,
                        modifier = Modifier.weight(1f)
                    )
                    AdminStatTile(
                        label = "DISPOSED CASES",
                        value = "${uiState.summary?.disposedCases ?: 300}",
                        valueColor = DeepNavy,
                        icon = Icons.Default.CheckCircleOutline,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // ── ACTION REQUIRED ───────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.padding(16.dp, 24.dp, 16.dp, 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.Error, null, Modifier.size(22.dp), tint = StatusUrgent)
                Text("Action Required", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = DeepNavy)
            }
            HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color(0xFFDEE2E6))
        }

        // ── ADVOCATE VERIFICATIONS CARD ───────────────────────────────────
        item {
            AdminActionCard(
                icon = Icons.Default.VerifiedUser,
                iconBg = Color(0xFFE8EAF6),
                iconTint = Color(0xFF3F51B5),
                title = "Advocate Verifications",
                subtitle = "Requires review",
                pendingCount = "${uiState.pendingAdvocates.size.takeIf { it > 0 } ?: 2} Pending",
                onReview = {}
            )
        }

        // ── NOC REVIEW CARD ───────────────────────────────────────────────
        item {
            AdminActionCard(
                icon = Icons.Default.AssignmentTurnedIn,
                iconBg = Color(0xFFFFF3E0),
                iconTint = GoldAmber,
                title = "NOC Review",
                subtitle = "No Objection Certificates",
                pendingCount = "${uiState.summary?.pendingNocRequests ?: 1} Pending",
                onReview = {}
            )
        }

        // ── QUICK ACTIONS ─────────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp, 16.dp, 16.dp, 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
                    colors = CardDefaults.cardColors(containerColor = PureWhite),
                    elevation = CardDefaults.cardElevation(0.dp),
                    onClick = {}
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.AddCircleOutline, null, Modifier.size(28.dp), tint = DeepNavy)
                        Text("New Case Entry", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
                    colors = CardDefaults.cardColors(containerColor = PureWhite),
                    elevation = CardDefaults.cardElevation(0.dp),
                    onClick = {}
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Upload, null, Modifier.size(28.dp), tint = DeepNavy)
                        Text("Upload Order", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminStatTile(
    label: String,
    value: String,
    valueColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Box(modifier = Modifier.padding(16.dp)) {
            Column {
                Text(label, style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f), letterSpacing = 0.05.sp)
                Spacer(Modifier.height(8.dp))
                Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = valueColor)
            }
            Icon(icon, null, Modifier.align(Alignment.TopEnd).size(28.dp), tint = Color(0xFFDEE2E6))
        }
    }
}

@Composable
private fun AdminActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconBg: Color,
    iconTint: Color,
    title: String,
    subtitle: String,
    pendingCount: String,
    onReview: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Surface(modifier = Modifier.size(44.dp), shape = RoundedCornerShape(8.dp), color = iconBg) {
                Box(contentAlignment = Alignment.Center) { Icon(icon, null, tint = iconTint) }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = DeepNavy.copy(0.5f))
            }
            Surface(color = StatusUrgent, shape = RoundedCornerShape(50)) {
                Text(pendingCount, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall, color = PureWhite, fontWeight = FontWeight.Bold)
            }
            OutlinedButton(
                onClick = onReview,
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, DeepNavy.copy(0.3f)),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text("Review", color = DeepNavy, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}
