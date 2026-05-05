package com.nyaaydesk.app.presentation.clerk

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.presentation.components.CaseStatusBadge
import com.nyaaydesk.app.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClerkCauseListScreen(viewModel: ClerkViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val pullRefreshState = rememberPullToRefreshState()
    var selectedCase by remember { mutableStateOf<CaseEntity?>(null) }
    var showHearingDialog by remember { mutableStateOf(false) }

    if (pullRefreshState.isRefreshing) {
        LaunchedEffect(true) { viewModel.refresh() }
    }

    LaunchedEffect(uiState.hearingUpdateSuccess) {
        if (uiState.hearingUpdateSuccess) {
            showHearingDialog = false
            viewModel.resetHearingState()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(contentPadding = PaddingValues(bottom = 16.dp)) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                            listOf(NavyBlueDark, NavyBlue)
                        ))
                        .padding(20.dp)
                ) {
                    Column {
                        Text("Daily Cause List", style = MaterialTheme.typography.headlineSmall,
                            color = GoldAmber, fontWeight = FontWeight.Bold)
                        Text(java.time.LocalDate.now().toString(),
                            style = MaterialTheme.typography.bodyMedium, color = OffWhite.copy(alpha = 0.7f))
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatPill("Scheduled", "${uiState.todaysCauseList.size}")
                            StatPill("Pending", "${uiState.pendingVerifications.size}")
                        }
                    }
                }
            }

            if (uiState.isLoading && uiState.todaysCauseList.isEmpty()) {
                items(5) { CauseListSkeleton() }
            } else if (uiState.todaysCauseList.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.EventBusy, null, Modifier.size(56.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
                            Spacer(Modifier.height(8.dp))
                            Text("No hearings scheduled today",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        }
                    }
                }
            } else {
                itemsIndexed(uiState.todaysCauseList, key = { _, c -> c.id }) { index, case ->
                    CauseListItem(
                        srNo = index + 1,
                        case = case,
                        onUpdateHearing = {
                            selectedCase = case
                            showHearingDialog = true
                        }
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                }
            }
        }

        PullToRefreshContainer(state = pullRefreshState, modifier = Modifier.align(Alignment.TopCenter))
    }

    // Hearing Update Bottom Sheet
    if (showHearingDialog && selectedCase != null) {
        HearingUpdateDialog(
            caseName = selectedCase!!.caseTitle,
            isLoading = uiState.isLoading,
            onDismiss = { showHearingDialog = false; selectedCase = null },
            onSubmit = { nextDate, order ->
                viewModel.updateHearing(selectedCase!!.id, nextDate, order)
            }
        )
    }
}

@Composable
private fun CauseListItem(srNo: Int, case: CaseEntity, onUpdateHearing: () -> Unit) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 3.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        onClick = { expanded = !expanded }
    ) {
        Column {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = NavyBlue, modifier = Modifier.size(32.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("$srNo", style = MaterialTheme.typography.labelMedium,
                            color = OffWhite, fontWeight = FontWeight.Bold)
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(case.caseTitle, style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold, maxLines = 1)
                    Text(case.caseNumber, style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }

                CaseStatusBadge(status = case.status)
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
            }

            if (expanded) {
                HorizontalDivider()
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onUpdateHearing,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Edit, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Update Hearing")
                    }
                    Button(
                        onClick = onUpdateHearing,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = StatusDisposed)
                    ) {
                        Icon(Icons.Default.Check, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Heard")
                    }
                }
            }
        }
    }
}

@Composable
private fun HearingUpdateDialog(
    caseName: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (String, String) -> Unit
) {
    var nextDate by remember { mutableStateOf("") }
    var orderText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Hearing", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(caseName, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                OutlinedTextField(
                    value = nextDate, onValueChange = { nextDate = it },
                    label = { Text("Next Hearing Date (YYYY-MM-DD)") },
                    leadingIcon = { Icon(Icons.Default.CalendarToday, null) },
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = orderText, onValueChange = { orderText = it },
                    label = { Text("Short Order") },
                    leadingIcon = { Icon(Icons.Default.Description, null) },
                    minLines = 3, modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(nextDate, orderText) },
                enabled = !isLoading && nextDate.isNotBlank()
            ) {
                if (isLoading) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                else Text("Save & Notify")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun StatPill(label: String, value: String) {
    Surface(color = OffWhite.copy(alpha = 0.15f), shape = RoundedCornerShape(50)) {
        Text("$label: $value",
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium, color = OffWhite)
    }
}

@Composable
private fun CauseListSkeleton() {
    Card(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 3.dp).height(60.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))) {}
}
