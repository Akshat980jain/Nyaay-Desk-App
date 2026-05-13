package com.nyaaydesk.app.presentation.advocate

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.presentation.components.CaseCard
import com.nyaaydesk.app.presentation.components.CaseStatusBadge
import com.nyaaydesk.app.presentation.litigant.NyaayTopBar
import com.nyaaydesk.app.presentation.theme.*

/**
 * AdvocateDashboardScreen — Redesigned to match Stitch advocate_dashboard_1/2/3.
 *
 * Layout:
 * - Dark navy top bar: "Nyaay Desk" + Logout
 * - "Overview" heading + subtitle
 * - "+ NEW CASE" gold button
 * - 3 stat cards: Total Cases, Pending Cases, Active Cases (dark navy card)
 * - Search bar + Filters button
 * - "My Cases" list with action buttons per card
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdvocateDashboardScreen(
    viewModel: AdvocateViewModel = hiltViewModel(),
    onCaseClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val pullRefreshState = rememberPullToRefreshState()
    var searchQuery by remember { mutableStateOf("") }

    if (pullRefreshState.isRefreshing) {
        LaunchedEffect(true) { viewModel.refresh() }
    }

    Box(modifier = Modifier.fillMaxSize().background(LightGrayBackground)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 80.dp)
        ) {
            // ── TOP NAV ──────────────────────────────────────────────────
            item { NyaayTopBar(onLogout = { viewModel.signOut() }) }

            // ── OVERVIEW HEADER ──────────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(16.dp, 20.dp, 16.dp, 0.dp)) {
                    Text("Overview", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = DeepNavy)
                    Text("Manage your active dockets and hearings.", style = MaterialTheme.typography.bodyMedium, color = DeepNavy.copy(0.6f))
                }
            }

            // ── NEW CASE BUTTON ───────────────────────────────────────────
            item {
                Button(
                    onClick = { /* navigate to new case */ },
                    modifier = Modifier.padding(16.dp).height(44.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = GoldAmber, contentColor = DeepNavy),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Add, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("NEW CASE", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelLarge)
                }
            }

            // ── STAT CARDS ────────────────────────────────────────────────
            item {
                AdvocateStatCard(
                    label = "Total Cases",
                    value = "${uiState.summary?.totalCases ?: 15}",
                    icon = Icons.Default.FolderOpen,
                    isAccent = false
                )
            }
            item {
                AdvocateStatCard(
                    label = "Pending Cases",
                    value = "${uiState.summary?.pendingCases ?: 4}",
                    icon = Icons.Default.Pending,
                    isAccent = false
                )
            }
            item {
                // Active Cases — dark navy background card
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = DeepNavy),
                    elevation = CardDefaults.cardElevation(0.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Gavel, null, Modifier.size(18.dp), tint = GoldAmber)
                                Text("Active Cases", style = MaterialTheme.typography.labelLarge, color = GoldAmber)
                            }
                            Text(
                                "${uiState.summary?.totalCases ?: 11}",
                                style = MaterialTheme.typography.displaySmall,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )
                        }
                        Icon(Icons.Default.Gavel, null, Modifier.size(56.dp), tint = PureWhite.copy(0.08f))
                    }
                }
            }

            // ── SEARCH & FILTER ────────────────────────────────────────────
            item { Spacer(Modifier.height(8.dp)) }
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    placeholder = { Text("Search cases by number or client...", color = DeepNavy.copy(0.4f)) },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = DeepNavy.copy(0.5f)) },
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color(0xFFDEE2E6),
                        focusedBorderColor = GoldAmber,
                        unfocusedContainerColor = PureWhite,
                        focusedContainerColor = PureWhite
                    ),
                    singleLine = true
                )
            }
            item {
                OutlinedButton(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = PureWhite)
                ) {
                    Icon(Icons.Default.FilterList, null, Modifier.size(18.dp), tint = DeepNavy)
                    Spacer(Modifier.width(8.dp))
                    Text("Filters", color = DeepNavy, fontWeight = FontWeight.Medium)
                }
            }

            // ── MY CASES HEADER ────────────────────────────────────────────
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp, 16.dp, 16.dp, 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("My Cases", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = DeepNavy)
                    TextButton(onClick = {}) {
                        Text("View All", color = GoldAmber, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            if (uiState.isLoading && uiState.allCases.isEmpty()) {
                items(3) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).height(120.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = LightGrayBackground)
                    ) {}
                }
            } else if (uiState.allCases.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text("No cases found.", color = DeepNavy.copy(0.4f))
                    }
                }
            } else {
                items(uiState.allCases, key = { it.id }) { case ->
                    CaseCard(case = case, onClick = { onCaseClick(case.id) })
                }
            }
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
private fun AdvocateStatCard(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isAccent: Boolean = false
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
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(icon, null, Modifier.size(16.dp), tint = if (isAccent) GoldAmber else DeepNavy.copy(0.5f))
                    Text(label, style = MaterialTheme.typography.labelMedium, color = DeepNavy.copy(0.6f))
                }
                Text(value, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold, color = DeepNavy)
            }
            Icon(icon, null, Modifier.size(48.dp), tint = Color(0xFFDEE2E6))
        }
    }
}
