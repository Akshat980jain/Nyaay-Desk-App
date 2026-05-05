package com.nyaaydesk.app.presentation.advocate

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.presentation.components.CaseCard
import com.nyaaydesk.app.presentation.components.CaseStatusBadge
import com.nyaaydesk.app.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdvocateDashboardScreen(
    viewModel: AdvocateViewModel = hiltViewModel(),
    onCaseClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val pullRefreshState = rememberPullToRefreshState()
    if (pullRefreshState.isRefreshing) {
        LaunchedEffect(true) { viewModel.refresh() }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(contentPadding = PaddingValues(bottom = 80.dp)) {

            // ── HEADER ────────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(NavyBlueDark, NavyBlue)))
                        .padding(20.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Good morning,", style = MaterialTheme.typography.bodyLarge,
                            color = OffWhite.copy(alpha = 0.7f))
                        Text("Adv. ${uiState.user?.fullName ?: "Advocate"}",
                            style = MaterialTheme.typography.headlineMedium,
                            color = GoldAmber, fontWeight = FontWeight.Bold)

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatCard("Total Cases", "${uiState.summary?.totalCases ?: 0}")
                            StatCard("Pending", "${uiState.summary?.pendingCases ?: 0}")
                            StatCard("Today", "${uiState.todaysCases.size}")
                            StatCard("NOC", "${uiState.summary?.pendingNocRequests ?: 0}")
                        }
                    }
                }
            }

            // ── TODAY'S CAUSE LIST ─────────────────────────────────────────
            item {
                SectionHeader(
                    title = "Today's Cause List",
                    count = uiState.todaysCases.size,
                    icon = Icons.Default.Today
                )
            }

            if (uiState.todaysCases.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = StatusDisposed.copy(alpha = 0.08f)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TrendingUp, null, modifier = Modifier.size(20.dp), tint = NavyBlue)
                            Text("No hearings scheduled for today.",
                                style = MaterialTheme.typography.bodyMedium, color = StatusDisposed)
                        }
                    }
                }
            } else {
                items(uiState.todaysCases, key = { it.id }) { case ->
                    TodayCauseListItem(case = case, onClick = { onCaseClick(case.id) })
                }
            }

            // ── ALL CASES ─────────────────────────────────────────────────
            item {
                SectionHeader(title = "All My Cases", count = uiState.allCases.size, icon = Icons.Default.Folder)
            }

            if (uiState.isLoading && uiState.allCases.isEmpty()) {
                items(3) { CaseCardSkeleton() }
            } else {
                items(uiState.allCases, key = { it.id }) { case ->
                    CaseCard(case = case, onClick = { onCaseClick(case.id) })
                }
            }
        }

        PullToRefreshContainer(state = pullRefreshState, modifier = Modifier.align(Alignment.TopCenter))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TodayCauseListItem(case: CaseEntity, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = NavyBlue.copy(alpha = 0.06f))
    ) {
        Row(modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(Icons.Default.Gavel, null, tint = NavyBlue, Modifier.size(24.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(case.caseTitle, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(case.cnrNumber ?: case.caseNumber, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }
            CaseStatusBadge(status = case.status)
        }
    }
}

@Composable
private fun StatCard(label: String, value: String) {
    Surface(color = OffWhite.copy(alpha = 0.15f), shape = RoundedCornerShape(12.dp)) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, style = MaterialTheme.typography.titleLarge, color = OffWhite, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelSmall, color = OffWhite.copy(alpha = 0.7f))
        }
    }
}

@Composable
private fun SectionHeader(title: String, count: Int, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = NavyBlue, modifier = Modifier.size(20.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
        Badge { Text("$count") }
    }
}

@Composable
fun CaseCardSkeleton() {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).height(90.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
    ) {}
}
