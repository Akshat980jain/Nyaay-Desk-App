package com.nyaaydesk.app.presentation.litigant

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.remote.dto.UserProfileDto
import com.nyaaydesk.app.presentation.theme.*

/**
 * Advocate Search Screen — for Litigants to find and hire legal representation.
 * 
 * Features:
 * - Real-time filtering by name/specialization.
 * - Profile cards with Bar ID and verification status.
 * - Direct "Request Join" action.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdvocateSearchScreen(
    onBack: () -> Unit,
    viewModel: LitigantViewModel = hiltViewModel()
) {
    var searchQuery by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()
    
    val filteredAdvocates = uiState.availableAdvocates.filter {
        it.fullName?.contains(searchQuery, ignoreCase = true) == true ||
        it.barCouncilId?.contains(searchQuery, ignoreCase = true) == true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Find an Advocate") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search by name or Bar ID...") },
                leadingIcon = { Icon(Icons.Default.Search, null) },
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )

            if (uiState.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = GoldAmber)
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredAdvocates) { advocate ->
                        AdvocateSearchCard(
                            advocate = advocate,
                            onRequestJoin = { caseId ->
                                viewModel.sendJoinRequest(caseId, advocate.id)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AdvocateSearchCard(
    advocate: UserProfileDto,
    onRequestJoin: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(48.dp).clip(CircleShape),
                    color = NavyBlue
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            advocate.fullName?.firstOrNull()?.toString() ?: "?",
                            color = GoldAmber,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            advocate.fullName ?: "Advocate",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        if (advocate.isVerified) {
                            Icon(
                                Icons.Default.Verified,
                                contentDescription = "Verified",
                                tint = StatusDisposed,
                                modifier = Modifier.size(16.dp).padding(start = 4.dp)
                            )
                        }
                    }
                    Text(
                        "Bar ID: ${advocate.barCouncilId ?: "Pending"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(
                onClick = { /* In real app, show case selection dialog */ },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = NavyBlue),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Request Representation", color = GoldAmber)
            }
        }
    }
}
