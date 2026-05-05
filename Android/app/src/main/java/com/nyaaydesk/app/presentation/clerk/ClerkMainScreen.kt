package com.nyaaydesk.app.presentation.clerk

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.nyaaydesk.app.presentation.theme.NavyBlue

sealed class ClerkTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object CauseList : ClerkTab("clerk_cause", "Cause List", Icons.Default.List)
    object Verify    : ClerkTab("clerk_verify", "Verify", Icons.Default.CheckCircle)
    object Hearings  : ClerkTab("clerk_hearings", "Hearings", Icons.Default.Gavel)
    object Profile   : ClerkTab("clerk_profile", "Profile", Icons.Default.Person)
}

@Composable
fun ClerkMainScreen(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val tabs = listOf(ClerkTab.CauseList, ClerkTab.Verify, ClerkTab.Hearings, ClerkTab.Profile)
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
        NavHost(navController = navController, startDestination = ClerkTab.CauseList.route) {
            composable(ClerkTab.CauseList.route) { ClerkCauseListScreen() }
            composable(ClerkTab.Verify.route) { ClerkVerifyScreen() }
            composable(ClerkTab.Hearings.route) { ClerkHearingsScreen() }
            composable(ClerkTab.Profile.route) { ClerkProfileScreen(onLogout = onLogout) }
        }
    }
}

@Composable fun ClerkVerifyScreen() {
    ScreenPlaceholder("⚖️", "Verification Queue", "Pending advocate and case verifications appear here.")
}

@Composable fun ClerkHearingsScreen() {
    ScreenPlaceholder("📋", "Hearing Records", "Search and review all past hearing orders.")
}

@Composable fun ClerkProfileScreen(onLogout: () -> Unit) {
    androidx.compose.foundation.layout.Column(
        modifier = androidx.compose.ui.Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(16.dp)
    ) {
        Text("Clerk Profile", style = MaterialTheme.typography.headlineMedium)
        OutlinedButton(onClick = onLogout, modifier = androidx.compose.ui.Modifier.fillMaxWidth()) { Text("Logout") }
    }
}

@Composable
fun ScreenPlaceholder(emoji: String, title: String, subtitle: String) {
    androidx.compose.foundation.layout.Box(
        modifier = androidx.compose.ui.Modifier.fillMaxSize(),
        contentAlignment = androidx.compose.ui.Alignment.Center
    ) {
        androidx.compose.foundation.layout.Column(
            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)
        ) {
            Text(emoji, style = MaterialTheme.typography.displaySmall)
            Text(title, style = MaterialTheme.typography.titleLarge)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}
