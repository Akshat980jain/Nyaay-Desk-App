package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.nyaaydesk.app.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LitigantCalendarScreen() {
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
            // Simplified Calendar View
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
                "Upcoming Events",
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
                    Icon(Icons.Default.Event, null, tint = GovNavyBlue)
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Evidence Submission", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = GovNavyBlue)
                        Text("Case DL-1002 • 10:30 AM", style = MaterialTheme.typography.labelSmall, color = GovNavyBlue.copy(alpha = 0.5f))
                    }
                }
            }
        }
    }
}

@Composable
fun LitigantProfileScreen(onLogout: () -> Unit) {
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
                Text("L", style = MaterialTheme.typography.displaySmall, color = GovNavyBlue, fontWeight = FontWeight.Bold)
            }
        }
        
        Spacer(Modifier.height(16.dp))
        Text("Litigant Account", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = GovNavyBlue)
        Text("Verified User", style = MaterialTheme.typography.bodySmall, color = Color.Green.copy(alpha = 0.7f))
        
        Spacer(Modifier.height(32.dp))
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceLight),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                ProfileInfoRow(Icons.Default.Email, "Email", "user@example.com")
                ProfileInfoRow(Icons.Default.Phone, "Phone", "+91 98765 43210")
                ProfileInfoRow(Icons.Default.LocationOn, "State", "Delhi NCR")
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
            Text("Sign Out", fontWeight = FontWeight.Bold)
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

