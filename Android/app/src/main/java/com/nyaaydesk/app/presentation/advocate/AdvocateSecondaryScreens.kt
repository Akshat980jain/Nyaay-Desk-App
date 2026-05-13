package com.nyaaydesk.app.presentation.advocate

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.components.CaseCard
import com.nyaaydesk.app.presentation.theme.*

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

    Column(modifier = Modifier.fillMaxSize().background(BackgroundLight)) {
        OutlinedTextField(
            value = searchQuery, 
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by Title, CNR or Case No.") },
            leadingIcon = { Icon(Icons.Default.Search, null, tint = GovNavyBlue) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = GovNavyBlue,
                unfocusedBorderColor = GovNavyBlue.copy(alpha = 0.1f),
                unfocusedContainerColor = SurfaceLight,
                focusedContainerColor = SurfaceLight
            )
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
    Column(modifier = Modifier.fillMaxSize().background(BackgroundLight).padding(24.dp)) {
        Text("NOC Requests", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = GovNavyBlue)
        Spacer(modifier = Modifier.height(12.dp))
        
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceLight),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Info, null, tint = GovNavyBlue.copy(alpha = 0.4f))
                Text("Pending Change-of-Advocate requests from your clients will appear here.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = GovNavyBlue.copy(alpha = 0.6f))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdvocateCalendarScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Hearing Calendar", fontWeight = FontWeight.Bold, color = GovNavyBlue) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundLight)
            )
        },
        containerColor = BackgroundLight
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            DatePicker(
                state = rememberDatePickerState(),
                modifier = Modifier.padding(8.dp),
                colors = DatePickerDefaults.colors(
                    containerColor = Color.Transparent,
                    selectedDayContainerColor = GovNavyBlue,
                    todayContentColor = GovNavyBlue,
                    todayDateBorderColor = GovNavyBlue
                ),
                showModeToggle = false,
                title = null,
                headline = null
            )
            
            Text(
                "My Schedule",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = GovNavyBlue,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)
            )
            
            Card(
                modifier = Modifier.padding(horizontal = 24.dp).fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Schedule, null, tint = GovNavyBlue)
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Cross Examination", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = GovNavyBlue)
                        Text("Session Court Room 4 • 11:00 AM", style = MaterialTheme.typography.labelSmall, color = GovNavyBlue.copy(alpha = 0.5f))
                    }
                }
            }
        }
    }
}

@Composable
fun AdvocateProfileScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(BackgroundLight).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(40.dp))
        Surface(
            modifier = Modifier.size(100.dp),
            shape = CircleShape,
            color = GovNavyBlue.copy(alpha = 0.1f)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text("A", style = MaterialTheme.typography.displaySmall, color = GovNavyBlue, fontWeight = FontWeight.Bold)
            }
        }
        
        Spacer(Modifier.height(16.dp))
        Text("Advocate Portal", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = GovNavyBlue)
        Text("Bar Council Verified", style = MaterialTheme.typography.bodySmall, color = Color.Green.copy(alpha = 0.7f))
        
        Spacer(Modifier.height(32.dp))
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceLight),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                ProfileInfoRow(Icons.Default.Badge, "Bar ID", "D/1234/2023")
                ProfileInfoRow(Icons.Default.Email, "Official Email", "counsel@nyaaydesk.gov.in")
                ProfileInfoRow(Icons.Default.LocationOn, "Jurisdiction", "Supreme Court of India")
            }
        }
        
        Spacer(Modifier.weight(1f))
        
        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.1f), contentColor = Color.Red)
        ) {
            Icon(Icons.AutoMirrored.Filled.Logout, null)
            Spacer(Modifier.width(8.dp))
            Text("Logout Session", fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun ProfileInfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = GovNavyBlue.copy(alpha = 0.3f), modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(16.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelSmall, color = GovNavyBlue.copy(alpha = 0.4f))
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = GovNavyBlue)
        }
    }
}
