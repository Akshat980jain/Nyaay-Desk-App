package com.nyaaydesk.app.presentation.advocate

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.navigation.compose.*
import com.nyaaydesk.app.presentation.litigant.CaseDetailScreen
import com.nyaaydesk.app.presentation.theme.NavyBlue

sealed class AdvocateTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    object Dashboard : AdvocateTab("adv_dashboard", "Dashboard", Icons.Default.Dashboard)
    object Cases     : AdvocateTab("adv_cases", "Cases", Icons.Default.Folder)
    object Noc       : AdvocateTab("adv_noc", "NOC", Icons.Default.SwapHoriz)
    object Profile   : AdvocateTab("adv_profile", "Profile", Icons.Default.Person)
}

@Composable
fun AdvocateMainScreen(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val tabs = listOf(AdvocateTab.Dashboard, AdvocateTab.Cases, AdvocateTab.Noc, AdvocateTab.Profile)
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
                    containerColor = NavyBlue,
                    contentColor = androidx.compose.ui.graphics.Color(0xFFDAC0A3)
                )
            }
        },
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
    ) { _ ->
        NavHost(navController = navController, startDestination = AdvocateTab.Dashboard.route) {
            composable(AdvocateTab.Dashboard.route) {
                AdvocateDashboardScreen(onCaseClick = { navController.navigate("adv_case_detail/$it") })
            }
            composable(AdvocateTab.Cases.route) {
                AdvocateCaseListScreen(onCaseClick = { navController.navigate("adv_case_detail/$it") })
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
