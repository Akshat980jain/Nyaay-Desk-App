package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import com.nyaaydesk.app.presentation.profile.ProfileScreen
import com.nyaaydesk.app.presentation.theme.*

sealed class LitigantTab(val route: String, val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Dashboard : LitigantTab("lit_dashboard", "Home", Icons.Default.Home)
    object Cases : LitigantTab("lit_cases", "Cases", Icons.Default.Folder)
    object Calendar : LitigantTab("lit_calendar", "Hearings", Icons.Default.CalendarMonth)
    object Profile : LitigantTab("lit_profile", "Alerts", Icons.Default.NotificationsNone)
}

/**
 * LitigantMainScreen — Stitch-redesigned with Dark Navy bottom navigation bar.
 * Gold active icon/label, white inactive icons on navy background.
 */
@Composable
fun LitigantMainScreen(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val tabs = listOf(LitigantTab.Dashboard, LitigantTab.Cases, LitigantTab.Calendar, LitigantTab.Profile)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = DeepNavy,
                tonalElevation = 0.dp
            ) {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label, style = MaterialTheme.typography.labelSmall) },
                        selected = currentRoute == tab.route,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = GoldAmber,
                            selectedTextColor = GoldAmber,
                            unselectedIconColor = PureWhite.copy(alpha = 0.5f),
                            unselectedTextColor = PureWhite.copy(alpha = 0.5f),
                            indicatorColor = Color.Transparent
                        )
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = LitigantTab.Dashboard.route,
            modifier = Modifier.padding(bottom = padding.calculateBottomPadding())
        ) {
            composable(LitigantTab.Dashboard.route) {
                LitigantDashboardScreen(onCaseClick = { caseId ->
                    navController.navigate("lit_case_detail/$caseId")
                })
            }
            composable(LitigantTab.Cases.route) {
                LitigantCaseListScreen(onCaseClick = { caseId ->
                    navController.navigate("lit_case_detail/$caseId")
                })
            }
            composable(LitigantTab.Calendar.route) {
                LitigantCalendarScreen()
            }
            composable(LitigantTab.Profile.route) {
                LitigantProfileScreen(onLogout = onLogout)
            }
            composable("lit_case_detail/{caseId}") { backStackEntry ->
                val caseId = backStackEntry.arguments?.getString("caseId") ?: return@composable
                CaseDetailScreen(
                    caseId = caseId,
                    onBack = { navController.popBackStack() }
                )
            }
            composable("nyaa_ai_chat") {
                NyaaChatScreen(onBack = { navController.popBackStack() })
            }
            composable("doc_vault") {
                DocumentVaultScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}
