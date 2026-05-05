package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.components.CaseCard
import com.nyaaydesk.app.presentation.components.CaseStatusBadge

/** Litigant Case List Screen — searchable, filterable list of all their cases. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LitigantCaseListScreen(
    viewModel: LitigantViewModel = hiltViewModel(),
    onCaseClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("All") }
    val filters = listOf("All", "Pending", "Active", "Disposed", "Stayed")

    val filteredCases = uiState.activeCases.filter { case ->
        val matchesSearch = searchQuery.isBlank() ||
            case.caseTitle.contains(searchQuery, ignoreCase = true) ||
            case.caseNumber.contains(searchQuery, ignoreCase = true) ||
            (case.cnrNumber?.contains(searchQuery, ignoreCase = true) == true)
        val matchesFilter = selectedFilter == "All" ||
            case.status.equals(selectedFilter, ignoreCase = true)
        matchesSearch && matchesFilter
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by case title, CNR...") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            trailingIcon = if (searchQuery.isNotBlank()) {
                { IconButton(onClick = { searchQuery = "" }) { Icon(Icons.Default.Clear, null) } }
            } else null,
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            shape = MaterialTheme.shapes.extraLarge
        )

        // Filter Chips
        ScrollableTabRow(
            selectedTabIndex = filters.indexOf(selectedFilter),
            edgePadding = 16.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            filters.forEach { filter ->
                Tab(
                    selected = selectedFilter == filter,
                    onClick = { selectedFilter = filter },
                    text = { Text(filter) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Results count
        Text(
            text = "${filteredCases.size} case${if (filteredCases.size != 1) "s" else ""} found",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
            modifier = Modifier.padding(horizontal = 20.dp)
        )

        LazyColumn(contentPadding = PaddingValues(bottom = 16.dp)) {
            items(filteredCases, key = { it.id }) { case ->
                CaseCard(case = case, onClick = { onCaseClick(case.id) })
            }
        }
    }
}
