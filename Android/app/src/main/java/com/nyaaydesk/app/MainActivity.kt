package com.nyaaydesk.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nyaaydesk.app.presentation.NyaayDeskNavGraph
import com.nyaaydesk.app.presentation.Screen
import com.nyaaydesk.app.presentation.theme.NyaayDeskTheme
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var supabase: SupabaseClient

    override fun onCreate(savedInstanceState: Bundle?) {
        // 1. Check for saved crashes BEFORE Hilt injection (super.onCreate)
        val prefs = getSharedPreferences("nyaaydesk_crashes", android.content.Context.MODE_PRIVATE)
        val lastCrash = prefs.getString("last_crash", null)
        
        if (lastCrash != null) {
            prefs.edit().remove("last_crash").apply()
            super.onCreate(null) 
            showCrashScreen(lastCrash)
            return
        }

        // 2. Try normal Hilt-managed initialization
        try {
            super.onCreate(savedInstanceState)
        } catch (e: Exception) {
            super.onCreate(null)
            showCrashScreen(android.util.Log.getStackTraceString(e))
            return
        }
        
        enableEdgeToEdge()

        try {
            setContent {
                NyaayDeskTheme {
                    var startDestination by remember { mutableStateOf(Screen.RoleSelect.route) }
                    var isChecking by remember { mutableStateOf(true) }

                    LaunchedEffect(Unit) {
                        try {
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
                        } catch (e: Exception) {
                            e.printStackTrace()
                            startDestination = Screen.RoleSelect.route
                        }
                        isChecking = false
                    }

                    if (!isChecking) {
                        NyaayDeskNavGraph(startDestination = startDestination)
                    }
                }
            }
        } catch (e: Exception) {
            showCrashScreen(android.util.Log.getStackTraceString(e))
        }
    }

    private fun showCrashScreen(error: String) {
        setContent {
            NyaayDeskTheme {
                Scaffold { padding ->
                    Column(
                        modifier = Modifier
                            .padding(padding)
                            .fillMaxSize()
                            .padding(24.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Error, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(64.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("Oops! NyaayDesk Crashed", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        Text("This is likely a startup error. Please share this:", style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(16.dp))
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                        ) {
                            Text(
                                text = error,
                                modifier = Modifier.padding(16.dp),
                                style = MaterialTheme.typography.labelSmall,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        }
                        Spacer(Modifier.height(24.dp))
                        Button(onClick = { recreate() }) {
                            Text("Retry Application")
                        }
                    }
                }
            }
        }
    }
}
