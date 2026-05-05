package com.nyaaydesk.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.datastore.preferences.core.stringPreferencesKey
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import com.nyaaydesk.app.presentation.NyaayDeskNavGraph
import com.nyaaydesk.app.presentation.Screen
import com.nyaaydesk.app.presentation.theme.NyaayDeskTheme
import javax.inject.Inject

/**
 * MainActivity — The single Activity of the app (Single-Activity Architecture).
 *
 * On launch:
 * 1. Checks if a valid Supabase session exists (via supabase.auth.currentSessionOrNull).
 * 2. If session exists, determines the user's role and routes directly to the correct dashboard.
 * 3. If no session, shows the RoleSelectScreen (Auth flow).
 *
 * @AndroidEntryPoint enables Hilt injection into this Activity.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var supabase: SupabaseClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            NyaayDeskTheme {
                var startDestination by remember { mutableStateOf(Screen.RoleSelect.route) }
                var isChecking by remember { mutableStateOf(true) }

                // Check for existing valid session on launch
                LaunchedEffect(Unit) {
                    val session = supabase.auth.currentSessionOrNull()
                    if (session != null) {
                        val userType = session.user?.userMetadata?.get("user_type")
                            ?.toString()?.trim('"')?.lowercase()

                        startDestination = when (userType) {
                            "litigant" -> Screen.LitigantMain.route
                            "advocate" -> Screen.AdvocateMain.route
                            "clerk" -> Screen.ClerkMain.route
                            "admin" -> Screen.AdminMain.route
                            else -> Screen.RoleSelect.route
                        }
                    }
                    isChecking = false
                }

                if (!isChecking) {
                    NyaayDeskNavGraph(startDestination = startDestination)
                }
            }
        }
    }
}
