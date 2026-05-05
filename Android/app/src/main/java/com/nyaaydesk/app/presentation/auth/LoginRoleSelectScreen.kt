package com.nyaaydesk.app.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nyaaydesk.app.presentation.theme.*

/**
 * Role Select Screen — the first screen every user sees on fresh launch.
 * A 2x2 grid of portal cards.
 */
@Composable
fun LoginRoleSelectScreen(
    onLitigantSelected: () -> Unit,
    onAdvocateSelected: () -> Unit,
    onClerkSelected: () -> Unit,
    onAdminSelected: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(NavyBlueDark, NavyBlue)))
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Spacer(modifier = Modifier.height(48.dp))
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("⚖️", fontSize = 72.sp)
                Text("NyaayDesk", style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.ExtraBold, color = GoldAmber)
                Text("न्याय your way", style = MaterialTheme.typography.titleMedium,
                    color = OffWhite.copy(alpha = 0.7f))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("Select your portal to continue", style = MaterialTheme.typography.titleSmall, color = OffWhite)
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PortalCard("Litigant", "Citizen Portal", Icons.Default.Person, Modifier.weight(1f), onLitigantSelected)
                    PortalCard("Advocate", "Lawyer Portal", Icons.Default.Gavel, Modifier.weight(1f), onAdvocateSelected)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PortalCard("Clerk", "Court Operations", Icons.Default.Badge, Modifier.weight(1f), onClerkSelected)
                    PortalCard("Admin", "System Oversight", Icons.Default.AdminPanelSettings, Modifier.weight(1f), onAdminSelected)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PortalCard(title: String, subtitle: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(modifier = modifier, onClick = onClick, shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = OffWhite.copy(alpha = 0.12f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)) {
        Column(modifier = Modifier.fillMaxWidth().padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(icon, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(36.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = OffWhite)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = OffWhite.copy(alpha = 0.65f))
        }
    }
}
