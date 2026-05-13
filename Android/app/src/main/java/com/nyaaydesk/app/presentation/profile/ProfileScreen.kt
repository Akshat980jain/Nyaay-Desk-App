package com.nyaaydesk.app.presentation.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.auth.AuthViewModel
import com.nyaaydesk.app.presentation.litigant.NyaayTopBar
import com.nyaaydesk.app.presentation.theme.*

/**
 * ProfileScreen — Redesigned to match Stitch user_profile design.
 *
 * Layout:
 * - Dark navy top bar
 * - Avatar circle + name + ID in Monospace + "Verified Profile" badge
 * - Personal Information section card
 * - Identity & Verification section card (Aadhaar, Digital Sig, PAN)
 * - App Settings card (Push Notifs toggle, Language, Theme)
 * - Security & Privacy card (Change Password, 2FA toggle)
 * - Red "Sign Out Completely" button at bottom
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel = hiltViewModel()
) {
    var showDeleteDialog by remember { mutableStateOf(false) }
    var notificationsEnabled by remember { mutableStateOf(true) }
    var twoFAEnabled by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(LightGrayBackground),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // ── TOP NAV ──────────────────────────────────────────────────────
        item { NyaayTopBar(onLogout = { authViewModel.signOut() }) }

        // ── PROFILE HEADER CARD ──────────────────────────────────────────
        item {
            Card(
                modifier = Modifier.fillMaxWidth().padding(16.dp, 16.dp, 16.dp, 8.dp),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box {
                        Surface(modifier = Modifier.size(80.dp), shape = CircleShape, color = DeepNavy.copy(0.08f)) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("R", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = DeepNavy)
                            }
                        }
                        Surface(
                            modifier = Modifier.size(24.dp).align(Alignment.BottomEnd),
                            shape = CircleShape,
                            color = GoldAmber
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Verified, null, Modifier.size(14.dp), tint = DeepNavy)
                            }
                        }
                    }
                    Text("Rahul Sharma", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = DeepNavy)
                    Text("Litigant ID: L-2024-089", fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = DeepNavy.copy(0.5f))
                    Surface(color = LightGrayBackground, shape = RoundedCornerShape(50), border = BorderStroke(1.dp, Color(0xFFDEE2E6))) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.Shield, null, Modifier.size(12.dp), tint = DeepNavy.copy(0.5f))
                            Text("Verified Profile", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.6f))
                        }
                    }
                }
            }
        }

        // ── PERSONAL INFORMATION ─────────────────────────────────────────
        item {
            ProfileSectionCard(title = "Personal Information", icon = Icons.Default.Person) {
                ProfileInfoRow("Full Name", "Rahul Sharma")
                HorizontalDivider(color = Color(0xFFF5F5F5))
                ProfileInfoRow("Email Address", "rahul.sharma@email.com")
                HorizontalDivider(color = Color(0xFFF5F5F5))
                ProfileInfoRow("Phone Number", "+91 98765 43210")
                HorizontalDivider(color = Color(0xFFF5F5F5))
                ProfileInfoRow("Registered Address", "Flat 4B, Residency Towers, MG Road, Bangalore, Karnataka 560001")
                Spacer(Modifier.height(12.dp))
                OutlinedButton(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, DeepNavy.copy(0.2f))
                ) {
                    Icon(Icons.Default.Edit, null, Modifier.size(16.dp), tint = DeepNavy)
                    Spacer(Modifier.width(6.dp))
                    Text("Edit Details", color = DeepNavy, fontWeight = FontWeight.Medium)
                }
            }
        }

        // ── IDENTITY & VERIFICATION ──────────────────────────────────────
        item {
            ProfileSectionCard(title = "Identity & Verification", icon = Icons.Default.Fingerprint) {
                VerificationRow("Aadhaar Link", "Linked on 12 Mar 2024", "Verified", StatusApproved)
                HorizontalDivider(color = Color(0xFFF5F5F5))
                VerificationRow("Digital Signature", "Valid till Dec 2025", "Active", StatusApproved)
                HorizontalDivider(color = Color(0xFFF5F5F5))
                VerificationRow("PAN Status", "Pending verification", "Pending", StatusDisposed)
            }
        }

        // ── APP SETTINGS ─────────────────────────────────────────────────
        item {
            ProfileSectionCard(title = "App Settings", icon = Icons.Default.Settings) {
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Notifications, null, tint = DeepNavy.copy(0.7f))
                        Text("Push Notifications", style = MaterialTheme.typography.bodyMedium, color = DeepNavy)
                    }
                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { notificationsEnabled = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = PureWhite, checkedTrackColor = GoldAmber)
                    )
                }
                HorizontalDivider(color = Color(0xFFF5F5F5))
                SettingsArrowRow(icon = Icons.Default.Language, label = "Language", value = "English")
                HorizontalDivider(color = Color(0xFFF5F5F5))
                SettingsArrowRow(icon = Icons.Default.DarkMode, label = "Theme", value = "System Default")
            }
        }

        // ── SECURITY & PRIVACY ───────────────────────────────────────────
        item {
            ProfileSectionCard(title = "Security & Privacy", icon = Icons.Default.Security) {
                SettingsArrowRow(icon = Icons.Default.Password, label = "Change Password", value = null)
                HorizontalDivider(color = Color(0xFFF5F5F5))
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PhonelinkLock, null, tint = DeepNavy.copy(0.7f))
                        Text("Two-Factor Authentication", style = MaterialTheme.typography.bodyMedium, color = DeepNavy)
                    }
                    Switch(
                        checked = twoFAEnabled,
                        onCheckedChange = { twoFAEnabled = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = PureWhite, checkedTrackColor = GoldAmber)
                    )
                }
            }
        }

        // ── SIGN OUT BUTTON ───────────────────────────────────────────────
        item {
            Button(
                onClick = { authViewModel.signOut() },
                modifier = Modifier.fillMaxWidth().padding(16.dp).height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFEBEB), contentColor = StatusUrgent),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.AutoMirrored.Filled.Logout, null, Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Sign Out Completely", fontWeight = FontWeight.SemiBold)
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Permanently Delete Account?") },
            text = { Text("This will erase all your case history and documents. This action is irreversible.") },
            confirmButton = {
                TextButton(
                    onClick = { authViewModel.signOut() },
                    colors = ButtonDefaults.textButtonColors(contentColor = StatusUrgent)
                ) { Text("Delete Forever") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun ProfileSectionCard(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(icon, null, Modifier.size(18.dp), tint = DeepNavy)
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
            }
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF0F0F0))
            content()
        }
    }
}

@Composable
private fun ProfileInfoRow(label: String, value: String) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f))
        Text(value, style = MaterialTheme.typography.bodyMedium, color = DeepNavy)
    }
}

@Composable
private fun VerificationRow(label: String, subtitle: String, status: String, statusColor: Color) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = DeepNavy)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = DeepNavy.copy(0.5f))
        }
        Surface(color = statusColor.copy(0.1f), shape = RoundedCornerShape(50)) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(Icons.Default.CheckCircle, null, Modifier.size(12.dp), tint = statusColor)
                Text(status, style = MaterialTheme.typography.labelSmall, color = statusColor, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun SettingsArrowRow(icon: ImageVector, label: String, value: String?) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = DeepNavy.copy(0.7f))
            Column {
                Text(label, style = MaterialTheme.typography.bodyMedium, color = DeepNavy)
                if (value != null) Text(value, style = MaterialTheme.typography.bodySmall, color = DeepNavy.copy(0.5f))
            }
        }
        Icon(Icons.Default.ChevronRight, null, tint = DeepNavy.copy(0.3f))
    }
}
