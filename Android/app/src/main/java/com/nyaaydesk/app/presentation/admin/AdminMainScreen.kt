package com.nyaaydesk.app.presentation.admin

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.nyaaydesk.app.presentation.clerk.ScreenPlaceholder
import com.nyaaydesk.app.presentation.theme.NavyBlue

sealed class AdminTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Overview : AdminTab("admin_overview", "Overview", Icons.Default.BarChart)
    object Users    : AdminTab("admin_users", "Users", Icons.Default.Group)
    object Audit    : AdminTab("admin_audit", "Audit", Icons.Default.Security)
    object Settings : AdminTab("admin_settings", "Settings", Icons.Default.Settings)
}

@Composable
fun AdminMainScreen(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val tabs = listOf(AdminTab.Overview, AdminTab.Users, AdminTab.Audit, AdminTab.Settings)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, tab.label) },
                        label = { Text(tab.label) },
                        selected = currentRoute == tab.route,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true; restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = NavyBlue, indicatorColor = NavyBlue.copy(alpha = 0.1f)
                        )
                    )
                }
            }
        }
    ) { _ ->
        NavHost(navController = navController, startDestination = AdminTab.Overview.route) {
            composable(AdminTab.Overview.route) { AdminDashboardScreen() }
            composable(AdminTab.Users.route) { AdminUserListScreen() }
            composable(AdminTab.Audit.route) { AdminAuditScreen() }
            composable(AdminTab.Settings.route) { AdminSettingsScreen(onLogout = onLogout) }
        }
    }
}

@Composable fun AdminUserListScreen() {
    ScreenPlaceholder("👥", "User Management", "All user accounts are managed here.")
}
@Composable fun AdminAuditScreen() {
    ScreenPlaceholder("🔐", "Audit Logs", "Blockchain-verified audit trail of all critical actions.")
}
@Composable fun AdminSettingsScreen(onLogout: () -> Unit) {
    androidx.compose.foundation.layout.Column(
        modifier = androidx.compose.ui.Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(16.dp)
    ) {
        Text("Admin Settings", style = MaterialTheme.typography.headlineMedium)
        OutlinedButton(onClick = onLogout, modifier = androidx.compose.ui.Modifier.fillMaxWidth()) { Text("Logout") }
    }
}
