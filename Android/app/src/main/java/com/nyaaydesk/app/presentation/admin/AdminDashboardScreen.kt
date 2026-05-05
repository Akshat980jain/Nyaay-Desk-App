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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(viewModel: AdminViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    LazyColumn(contentPadding = PaddingValues(bottom = 80.dp)) {
        // ── ADMIN HEADER ──────────────────────────────────────────────────
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.verticalGradient(listOf(NavyBlueDark, NavyBlue)))
                    .padding(20.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.AdminPanelSettings, null, tint = GoldAmber, modifier = Modifier.size(28.dp))
                        Column {
                            Text("Admin Overview", style = MaterialTheme.typography.headlineSmall,
                                color = GoldAmber, fontWeight = FontWeight.Bold)
                            Text("System metrics & management",
                                style = MaterialTheme.typography.bodySmall, color = OffWhite.copy(alpha = 0.7f))
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))

                    // 2x2 Stats Grid
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AdminStatCard("Total Cases", "${uiState.summary?.totalCases ?: 0}",
                                Icons.Default.Folder, modifier = Modifier.weight(1f))
                            AdminStatCard("Pending", "${uiState.summary?.pendingCases ?: 0}",
                                Icons.Default.Pending, modifier = Modifier.weight(1f))
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AdminStatCard("Disposed", "${uiState.summary?.disposedCases ?: 0}",
                                Icons.Default.CheckCircle, modifier = Modifier.weight(1f))
                            AdminStatCard("Pending NOC", "${uiState.summary?.pendingNocRequests ?: 0}",
                                Icons.Default.SwapHoriz, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // ── ADVOCATE APPROVAL QUEUE ───────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Advocate Approval Queue", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Badge { Text("${uiState.pendingAdvocates.size}") }
            }
        }

        if (uiState.pendingAdvocates.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = StatusDisposed.copy(alpha = 0.08f))
                ) {
                    Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, null, tint = StatusDisposed, Modifier.size(24.dp))
                        Text("All advocate verifications up to date!", style = MaterialTheme.typography.bodyMedium, color = StatusDisposed)
                    }
                }
            }
        } else {
            items(uiState.pendingAdvocates, key = { it.id }) { advocate ->
                AdvocateApprovalCard(
                    advocate = advocate,
                    onApprove = { viewModel.approveAdvocate(advocate.id) },
                    onReject = { viewModel.rejectAdvocate(advocate.id) }
                )
            }
        }
    }
}

@Composable
private fun AdminStatCard(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier) {
    Surface(color = OffWhite.copy(alpha = 0.15f), shape = RoundedCornerShape(12.dp), modifier = modifier) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(icon, null, tint = GoldAmber, modifier = Modifier.size(20.dp))
            Column {
                Text(value, style = MaterialTheme.typography.titleLarge, color = OffWhite, fontWeight = FontWeight.Bold)
                Text(label, style = MaterialTheme.typography.labelSmall, color = OffWhite.copy(alpha = 0.7f))
            }
        }
    }
}

@Composable
private fun AdvocateApprovalCard(
    advocate: com.nyaaydesk.app.data.remote.dto.UserProfileDto,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Avatar Placeholder
                Surface(shape = CircleShape, color = NavyBlue, modifier = Modifier.size(44.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            (advocate.fullName?.firstOrNull()?.uppercase() ?: "A"),
                            style = MaterialTheme.typography.titleMedium, color = GoldAmber
                        )
                    }
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(advocate.fullName ?: "Unknown Advocate", style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold)
                    Text(advocate.email, style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    if (!advocate.barCouncilId.isNullOrBlank()) {
                        Text("Bar ID: ${advocate.barCouncilId}", style = MaterialTheme.typography.labelSmall,
                            color = NavyBlue)
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = onReject,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusStayed)
                ) {
                    Icon(Icons.Default.Close, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Reject")
                }
                Button(
                    onClick = onApprove,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusDisposed)
                ) {
                    Icon(Icons.Default.Check, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Approve")
                }
            }
        }
    }
}
