package com.nyaaydesk.app.presentation.litigant

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.presentation.components.CaseCard
import com.nyaaydesk.app.presentation.theme.*

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

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            // ── HEADER BANNER ──────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(NavyBlueDark, NavyBlue)))
                        .padding(20.dp)
                ) {
                    Column {
                        Text(
                            text = "Welcome back,",
                            style = MaterialTheme.typography.bodyLarge,
                            color = OffWhite.copy(alpha = 0.7f)
                        )
                        Text(
                            text = uiState.user?.fullName ?: "Litigant",
                            style = MaterialTheme.typography.headlineMedium,
                            color = GoldAmber,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        // Stats Row
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatChip("Total", "${uiState.dashboardSummary?.totalCases ?: 0}", Icons.Default.Folder)
                            StatChip("Pending", "${uiState.dashboardSummary?.pendingCases ?: 0}", Icons.Default.Pending)
                            StatChip("Today", "${uiState.dashboardSummary?.todayHearings ?: 0}", Icons.Default.Today)
                        }
                    }
                }
            }

            // ── NEXT HEARING ALERT ─────────────────────────────────────────
            uiState.activeCases.firstOrNull { it.nextHearingDate != null }?.let { nextCase ->
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusPending.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                Icons.Default.NotificationsActive,
                                contentDescription = null,
                                tint = StatusPending,
                                modifier = Modifier.size(28.dp)
                            )
                            Column {
                                Text(
                                    "Next Hearing",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                                Text(
                                    nextCase.caseTitle,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    nextCase.nextHearingDate ?: "",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = StatusPending
                                )
                            }
                        }
                    }
                }
            }

            // ── CASE LIST ──────────────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "My Cases (${uiState.activeCases.size})",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            if (uiState.isLoading && uiState.activeCases.isEmpty()) {
                items(3) { CaseCardSkeleton() }
            } else if (uiState.activeCases.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Default.FolderOff,
                        message = "No cases found",
                        subtitle = "Your filed cases will appear here."
                    )
                }
            } else {
                items(uiState.activeCases, key = { it.id }) { case ->
                    CaseCard(case = case, onClick = { onCaseClick(case.id) })
                }
            }
        }

        PullToRefreshContainer(
            state = pullRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
private fun StatChip(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Surface(
        color = OffWhite.copy(alpha = 0.15f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(20.dp))
            Text(value, style = MaterialTheme.typography.titleMedium, color = OffWhite, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelSmall, color = OffWhite.copy(alpha = 0.7f))
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
            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
        Text(message, style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
        Text(subtitle, style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
    }
}

@Composable
fun CaseCardSkeleton() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .height(100.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {}
}
