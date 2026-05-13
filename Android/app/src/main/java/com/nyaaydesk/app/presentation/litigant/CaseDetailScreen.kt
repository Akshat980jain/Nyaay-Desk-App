package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
                title = { Text("Case Details", fontWeight = FontWeight.Bold, color = GovNavyBlue) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = GovNavyBlue)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundLight)
            )
        },
        containerColor = BackgroundLight
    ) { padding ->
        if (case == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = GovNavyBlue)
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // ── PREMIUM CASE HEADER ──────────────────────────────────────────
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = GovNavyBlue),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Column {
                            Text(case.caseTitle, style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold, color = AccentGold)
                            Text(case.cnrNumber ?: case.caseNumber, style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.6f))
                        }
                        
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CaseStatusBadge(status = case.status)
                            if (!case.caseType.isNullOrBlank()) {
                                Surface(color = Color.White.copy(alpha = 0.1f), shape = RoundedCornerShape(50)) {
                                    Text(case.caseType, Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall, color = Color.White)
                                }
                            }
                        }
                        
                        HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                        
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            DetailRow(Icons.Default.Person, "Judge", case.judgeName ?: "Hon'ble Court", Color.White)
                            DetailRow(Icons.Default.CalendarToday, "Next Hearing", case.nextHearingDate ?: "TBD", AccentGold)
                        }
                    }
                }
            }

            // ── TIMELINE / DESCRIPTION ───────────────────────────────────────
            item {
                Text("Case Summary", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = GovNavyBlue)
            }

            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(case.description ?: "No detailed description provided.", 
                            style = MaterialTheme.typography.bodyMedium,
                            color = GovNavyBlue.copy(alpha = 0.7f))
                    }
                }
            }

            // ── ATTACHED DOCUMENTS ───────────────────────────────────────────
            if (case.documentUrls.isNotEmpty()) {
                item {
                    Text("Case Files", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = GovNavyBlue)
                }
                items(case.documentUrls) { url ->
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                        onClick = { /* Open PDF viewer */ }
                    ) {
                        Row(modifier = Modifier.padding(20.dp).fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Surface(
                                modifier = Modifier.size(44.dp),
                                color = GovNavyBlue.copy(alpha = 0.05f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.PictureAsPdf, null, tint = Color.Red.copy(alpha = 0.6f))
                                }
                            }
                            Text(url.substringAfterLast("/"), style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold, color = GovNavyBlue,
                                modifier = Modifier.weight(1f), maxLines = 1)
                            Icon(Icons.Default.Download, null, tint = GovNavyBlue)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String, valueColor: Color) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(18.dp))
        Text("$label: ", style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.5f))
        Text(value, style = MaterialTheme.typography.bodySmall, color = valueColor, fontWeight = FontWeight.Bold)
    }
}

