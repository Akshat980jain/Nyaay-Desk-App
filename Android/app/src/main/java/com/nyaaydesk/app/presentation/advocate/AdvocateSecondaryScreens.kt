package com.nyaaydesk.app.presentation.advocate

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.components.CaseCard

/** Advocate full case list with search */
@Composable
fun AdvocateCaseListScreen(
    viewModel: AdvocateViewModel = hiltViewModel(),
    onCaseClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    val filtered = uiState.allCases.filter {
        searchQuery.isBlank() ||
            it.caseTitle.contains(searchQuery, true) ||
            it.caseNumber.contains(searchQuery, true)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = searchQuery, onValueChange = { searchQuery = it },
            placeholder = { Text("Search cases...") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = MaterialTheme.shapes.extraLarge
        )
        LazyColumn(contentPadding = PaddingValues(bottom = 80.dp)) {
            items(filtered, key = { it.id }) { case ->
                CaseCard(case = case, onClick = { onCaseClick(case.id) })
            }
        }
    }
}

/** NOC Management Screen */
@Composable
fun NocManagementScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("NOC Requests", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Pending Change-of-Advocate requests from your clients will appear here.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
    }
}

/** Advocate Profile & Logout Screen */
@Composable
fun AdvocateProfileScreen(onLogout: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Advocate Profile", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("Logout") }
    }
}
