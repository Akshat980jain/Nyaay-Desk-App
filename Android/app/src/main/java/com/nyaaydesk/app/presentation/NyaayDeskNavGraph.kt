package com.nyaaydesk.app.presentation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.nyaaydesk.app.presentation.admin.AdminMainScreen
import com.nyaaydesk.app.presentation.advocate.AdvocateMainScreen
import com.nyaaydesk.app.presentation.auth.*
import com.nyaaydesk.app.presentation.clerk.ClerkMainScreen
import com.nyaaydesk.app.presentation.litigant.LitigantMainScreen

/**
 * Route constants for the root navigation graph.
 * Each role has its own main screen which internally manages a nested NavHost.
 */
sealed class Screen(val route: String) {
    object RoleSelect      : Screen("role_select")
    object LitigantLogin   : Screen("litigant_login")
    object AdvocateLogin   : Screen("advocate_login")
    object ClerkLogin      : Screen("clerk_login")
    object AdminLogin      : Screen("admin_login")
    object LitigantMain    : Screen("litigant_main")
    object AdvocateMain    : Screen("advocate_main")
    object ClerkMain       : Screen("clerk_main")
    object AdminMain       : Screen("admin_main")
}

/**
 * Root NavGraph — only manages the top-level auth flow + role main screens.
 * Each main screen has its own nested NavHost for inner tab navigation.
 *
 * @param startDestination: Determined by MainActivity based on existing session.
 */
@Composable
fun NyaayDeskNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.RoleSelect.route
) {
    NavHost(navController = navController, startDestination = startDestination) {

        // ── AUTH FLOW ────────────────────────────────────────────────────
        composable(Screen.RoleSelect.route) {
            LoginRoleSelectScreen(
                onLitigantSelected  = { navController.navigate(Screen.LitigantLogin.route) },
                onAdvocateSelected  = { navController.navigate(Screen.AdvocateLogin.route) },
                onClerkSelected     = { navController.navigate(Screen.ClerkLogin.route) },
                onAdminSelected     = { navController.navigate(Screen.AdminLogin.route) }
            )
        }

        composable(Screen.LitigantLogin.route) {
            LitigantLoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.LitigantMain.route) {
                        popUpTo(Screen.RoleSelect.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.AdvocateLogin.route) {
            AdvocateLoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.AdvocateMain.route) {
                        popUpTo(Screen.RoleSelect.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.ClerkLogin.route) {
            ClerkLoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.ClerkMain.route) {
                        popUpTo(Screen.RoleSelect.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.AdminLogin.route) {
            AdminLoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.AdminMain.route) {
                        popUpTo(Screen.RoleSelect.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        // ── MAIN SCREENS (each contains its own nested NavHost) ─────────
        composable(Screen.LitigantMain.route) {
            LitigantMainScreen(onLogout = {
                navController.navigate(Screen.RoleSelect.route) {
                    popUpTo(Screen.LitigantMain.route) { inclusive = true }
                }
            })
        }

        composable(Screen.AdvocateMain.route) {
            AdvocateMainScreen(onLogout = {
                navController.navigate(Screen.RoleSelect.route) {
                    popUpTo(Screen.AdvocateMain.route) { inclusive = true }
                }
            })
        }

        composable(Screen.ClerkMain.route) {
            ClerkMainScreen(onLogout = {
                navController.navigate(Screen.RoleSelect.route) {
                    popUpTo(Screen.ClerkMain.route) { inclusive = true }
                }
            })
        }

        composable(Screen.AdminMain.route) {
            AdminMainScreen(onLogout = {
                navController.navigate(Screen.RoleSelect.route) {
                    popUpTo(Screen.AdminMain.route) { inclusive = true }
                }
            })
        }
    }
}
