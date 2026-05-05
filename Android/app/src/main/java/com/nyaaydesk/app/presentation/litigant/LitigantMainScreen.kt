package com.nyaaydesk.app.presentation.litigant

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import com.nyaaydesk.app.presentation.theme.NavyBlue

sealed class LitigantTab(val route: String, val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Dashboard : LitigantTab("lit_dashboard", "Dashboard", Icons.Default.Dashboard)
    object Cases : LitigantTab("lit_cases", "My Cases", Icons.Default.Folder)
    object Calendar : LitigantTab("lit_calendar", "Calendar", Icons.Default.CalendarMonth)
    object Profile : LitigantTab("lit_profile", "Profile", Icons.Default.Person)
}

/**
 * Fully wired Litigant Main Screen with nested NavHost for tab navigation.
 * Each tab gets its own back stack via `rememberNavController`.
 */
@Composable
fun LitigantMainScreen(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val tabs = listOf(LitigantTab.Dashboard, LitigantTab.Cases, LitigantTab.Calendar, LitigantTab.Profile)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                        selected = currentRoute == tab.route,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.startDestinationId) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = NavyBlue,
                            indicatorColor = NavyBlue.copy(alpha = 0.1f)
                        )
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = LitigantTab.Dashboard.route,
            modifier = Modifier
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
        }
    }
}
