package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.components.CaseStatusBadge
import com.nyaaydesk.app.presentation.litigant.LitigantViewModel
import com.nyaaydesk.app.presentation.theme.*

/** Case Detail Screen — shows all case info plus the vertical hearing timeline. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaseDetailScreen(
    caseId: String,
    onBack: () -> Unit,
    viewModel: LitigantViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val case = uiState.activeCases.find { it.id == caseId }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Case Details", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NavyBlue,
                    titleContentColor = GoldAmber,
                    navigationIconContentColor = OffWhite
                )
            )
        }
    ) { padding ->
        if (case == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Case Header Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = NavyBlue)
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(case.caseTitle, style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold, color = GoldAmber)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CaseStatusBadge(status = case.status)
                            if (!case.caseType.isNullOrBlank()) {
                                Surface(color = OffWhite.copy(alpha = 0.15f), shape = RoundedCornerShape(50)) {
                                    Text(case.caseType, Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                        style = MaterialTheme.typography.labelSmall, color = OffWhite)
                                }
                            }
                        }
                        Divider(color = OffWhite.copy(alpha = 0.2f))
                        DetailRow(Icons.Default.Tag, "CNR Number", case.cnrNumber ?: "N/A", OffWhite)
                        DetailRow(Icons.Default.Numbers, "Case Number", case.caseNumber, OffWhite)
                        DetailRow(Icons.Default.Person, "Judge", case.judgeName ?: "Not assigned", OffWhite)
                        DetailRow(Icons.Default.CalendarToday, "Next Hearing", case.nextHearingDate ?: "TBD", GoldAmber)
                    }
                }
            }

            // Description
            if (!case.description.isNullOrBlank()) {
                item {
                    Card(shape = RoundedCornerShape(16.dp)) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Description", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(case.description, style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                        }
                    }
                }
            }

            // Documents Section
            if (case.documentUrls.isNotEmpty()) {
                item {
                    Text("Attached Documents (${case.documentUrls.size})",
                        style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                }
                items(case.documentUrls) { url ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        onClick = { /* Open PDF viewer */ }
                    ) {
                        Row(modifier = Modifier.padding(16.dp).fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(Icons.Default.PictureAsPdf, null, tint = StatusStayed, modifier = Modifier.size(28.dp))
                            Text(url.substringAfterLast("/"), style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.weight(1f), maxLines = 1)
                            Icon(Icons.Default.Download, null, tint = NavyBlue)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String, valueColor: Color = Color.Unspecified) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = OffWhite.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
        Text("$label: ", style = MaterialTheme.typography.bodySmall, color = OffWhite.copy(alpha = 0.6f))
        Text(value, style = MaterialTheme.typography.bodySmall, color = valueColor, fontWeight = FontWeight.Medium)
    }
}
