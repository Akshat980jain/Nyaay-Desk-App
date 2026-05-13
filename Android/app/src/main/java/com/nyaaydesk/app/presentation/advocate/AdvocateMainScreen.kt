package com.nyaaydesk.app.presentation.advocate

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import com.nyaaydesk.app.presentation.litigant.CaseDetailScreen
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.nyaaydesk.app.presentation.theme.*

sealed class AdvocateTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Dashboard : AdvocateTab("adv_dashboard", "Home", Icons.Default.Home)
    object Cases     : AdvocateTab("adv_cases", "Cases", Icons.Default.Folder)
    object Calendar  : AdvocateTab("adv_calendar", "Hearings", Icons.Default.CalendarMonth)
    object Noc       : AdvocateTab("adv_noc", "NOC", Icons.AutoMirrored.Filled.CompareArrows)
    object Profile   : AdvocateTab("adv_profile", "Alerts", Icons.Default.NotificationsNone)
}


@Composable
fun AdvocateMainScreen(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val tabs = listOf(AdvocateTab.Dashboard, AdvocateTab.Cases, AdvocateTab.Calendar, AdvocateTab.Noc, AdvocateTab.Profile)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showFab = currentRoute in listOf(AdvocateTab.Dashboard.route, AdvocateTab.Cases.route)

    Scaffold(
        floatingActionButton = {
            if (showFab) {
                ExtendedFloatingActionButton(
                    text = { Text("File Case") },
                    icon = { Icon(Icons.Default.Add, null) },
                    onClick = { navController.navigate("adv_new_case") },
                    containerColor = DeepNavy,
                    contentColor = androidx.compose.ui.graphics.Color.White
                )
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = DeepNavy,
                tonalElevation = 0.dp
            ) {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, tab.label) },
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
            startDestination = AdvocateTab.Dashboard.route,
            modifier = Modifier.padding(padding)
        ) {
            composable(AdvocateTab.Dashboard.route) {
                AdvocateDashboardScreen(onCaseClick = { navController.navigate("adv_case_detail/$it") })
            }
            composable(AdvocateTab.Cases.route) {
                AdvocateCaseListScreen(onCaseClick = { navController.navigate("adv_case_detail/$it") })
            }
            composable(AdvocateTab.Calendar.route) {
                AdvocateCalendarScreen()
            }
            composable(AdvocateTab.Noc.route) {
                NocManagementScreen()
            }
            composable(AdvocateTab.Profile.route) {
                AdvocateProfileScreen(onLogout = onLogout)
            }
            composable("adv_case_detail/{caseId}") { backStack ->
                val caseId = backStack.arguments?.getString("caseId") ?: return@composable
                CaseDetailScreen(caseId = caseId, onBack = { navController.popBackStack() })
            }
            composable("adv_new_case") {
                NewCaseFilingScreen(
                    onSuccess = { navController.popBackStack() },
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}

