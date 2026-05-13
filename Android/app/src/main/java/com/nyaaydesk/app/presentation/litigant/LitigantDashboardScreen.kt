package com.nyaaydesk.app.presentation.litigant

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.presentation.components.CaseCard
import com.nyaaydesk.app.presentation.theme.*

/**
 * LitigantDashboardScreen — Redesigned to match Stitch design.
 * Based on: litigant_dashboard/screen.png
 *
 * Layout:
 * - Dark navy top bar: "Nyaay Desk" logo + Logout
 * - "Welcome back, [Name]" + litigant ID
 * - Advocate Change Status section
 * - NOC cards (gold-bordered for signed, gray for pending)
 * - Stat cards: Active Cases, Upcoming Hearings
 * - FAB for AI assistant
 * - Bottom nav bar: Dashboard, Cases, Hearings, Profile
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LitigantDashboardScreen(
    viewModel: LitigantViewModel = hiltViewModel(),
    onCaseClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val pullRefreshState = rememberPullToRefreshState()

    if (pullRefreshState.isRefreshing) {
        LaunchedEffect(true) { viewModel.refresh() }
    }

    Box(modifier = Modifier.fillMaxSize().background(LightGrayBackground)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            // ── TOP NAVIGATION BAR ──────────────────────────────────────────
            item {
                NyaayTopBar(onLogout = { viewModel.signOut() })
            }

            // ── WELCOME HEADER ──────────────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(start = 16.dp, top = 20.dp, end = 16.dp, bottom = 8.dp)) {
                    Text(
                        text = "Welcome back, ${uiState.user?.fullName?.split(" ")?.firstOrNull() ?: "Rahul"}",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = DeepNavy
                    )
                    Text(
                        text = uiState.user?.id ?: "L-2024-089",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 13.sp,
                        color = DeepNavy.copy(alpha = 0.5f)
                    )
                }
            }

            // ── ADVOCATE CHANGE STATUS SECTION ──────────────────────────────
            item {
                Row(
                    modifier = Modifier.padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.SwapHoriz, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(20.dp))
                    Text(
                        "Advocate Change Status",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = DeepNavy
                    )
                }
            }

            // NOC Cards from state
            if (uiState.nocRequests.isNullOrEmpty()) {
                // Placeholder NOC cards matching the Stitch design
                item { NocSignedCard(caseNumber = "CL2026M874", lawyer = "ADV-GZB-001", date = "05/08/2026") }
                item { NocPendingCard(caseNumber = "CL2025K112", lawyer = "ADV-DEL-402", date = "12/08/2026") }
            } else {
                items(uiState.nocRequests) { noc ->
                    if (noc.status.equals("signed", ignoreCase = true) || noc.status.equals("accepted", ignoreCase = true)) {
                        NocSignedCard(caseNumber = noc.caseTitle ?: "Case ${noc.caseId.take(8)}", lawyer = noc.advocateId.take(8), date = noc.createdAt?.take(10) ?: "Pending")
                    } else {
                        NocPendingCard(caseNumber = noc.caseTitle ?: "Case ${noc.caseId.take(8)}", lawyer = noc.advocateId.take(8), date = noc.createdAt?.take(10) ?: "Pending")
                    }
                }
            }

            // ── STAT CARDS ────────────────────────────────────────────────
            item {
                DashboardStatCard(
                    label = "Active Cases",
                    value = "${uiState.dashboardSummary?.totalCases ?: 3}",
                    icon = Icons.Default.FolderOpen
                )
            }
            item {
                DashboardStatCard(
                    label = "Upcoming Hearings",
                    value = "${uiState.dashboardSummary?.todayHearings ?: 1}",
                    icon = Icons.Default.CalendarMonth
                )
            }
        }

        // FAB for AI Assistant
        FloatingActionButton(
            onClick = { /* navigate to AI chat */ },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 80.dp),
            containerColor = DeepNavy,
            contentColor = GoldAmber
        ) {
            Icon(Icons.Default.SmartToy, contentDescription = "Nyaay-Saathi AI")
        }

        PullToRefreshContainer(
            state = pullRefreshState,
            modifier = Modifier.align(Alignment.TopCenter),
            containerColor = PureWhite,
            contentColor = GoldAmber
        )
    }
}

@Composable
private fun NocSignedCard(caseNumber: String, lawyer: String, date: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, GoldAmber.copy(alpha = 0.5f)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = caseNumber,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = DeepNavy
                )
                Surface(
                    color = DeepNavy,
                    shape = RoundedCornerShape(50)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, null, Modifier.size(12.dp), tint = PureWhite)
                        Text("NOC SIGNED", style = MaterialTheme.typography.labelSmall, color = PureWhite, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(32.dp)) {
                Column {
                    Text("Current Lawyer", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f))
                    Text(lawyer, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                }
                Column {
                    Text("Request Date", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f))
                    Text(date, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                }
            }
            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = Color(0xFFF0F0F0))
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = {},
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GoldAmber, contentColor = DeepNavy),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Submit to Court", fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(8.dp))
                Icon(Icons.AutoMirrored.Filled.Send, null, Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun NocPendingCard(caseNumber: String, lawyer: String, date: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = caseNumber,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = DeepNavy
                )
                Surface(
                    color = Color.Transparent,
                    shape = RoundedCornerShape(50),
                    border = BorderStroke(1.dp, StatusDisposed.copy(0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.Schedule, null, Modifier.size(12.dp), tint = StatusDisposed)
                        Text("PENDING NOC", style = MaterialTheme.typography.labelSmall, color = StatusDisposed, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(32.dp)) {
                Column {
                    Text("Current Lawyer", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f))
                    Text(lawyer, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                }
                Column {
                    Text("Request Date", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f))
                    Text(date, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                }
            }
            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = Color(0xFFF0F0F0))
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = {},
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, DeepNavy.copy(0.3f))
            ) {
                Text("Remind", color = DeepNavy, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun DashboardStatCard(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                shape = CircleShape,
                color = DeepNavy
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(22.dp))
                }
            }
            Column {
                Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = DeepNavy)
            }
        }
    }
}

/** Stitch-matching top navigation bar: Deep Navy bg, Gold logo text, white logout. */
@Composable
fun NyaayTopBar(onLogout: () -> Unit = {}) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = DeepNavy
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Gavel, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(20.dp))
                Text(
                    "Nyaay Desk",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = GoldAmber
                )
            }
            TextButton(onClick = onLogout) {
                Text("Logout", color = PureWhite.copy(alpha = 0.8f), style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
fun EmptyState(icon: androidx.compose.ui.graphics.vector.ImageVector, message: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(64.dp),
            tint = DeepNavy.copy(alpha = 0.3f))
        Text(message, style = MaterialTheme.typography.titleMedium,
            color = DeepNavy.copy(alpha = 0.5f))
        Text(subtitle, style = MaterialTheme.typography.bodySmall,
            color = DeepNavy.copy(alpha = 0.4f))
    }
}

@Composable
fun CaseCardSkeleton() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .height(100.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = LightGrayBackground)
    ) {}
}
