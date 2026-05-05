package com.nyaaydesk.app.presentation.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.components.NyaayAuthScaffold
import com.nyaaydesk.app.presentation.components.NyaayButton
import com.nyaaydesk.app.presentation.components.NyaayTextField

/**
 * Litigant (Citizen) Login Screen.
 * Connects to Supabase Auth, validates the user's role is "litigant",
 * and navigates to the Litigant Dashboard on success.
 */
@Composable
fun LitigantLoginScreen(
    onLoginSuccess: () -> Unit,
    onBack: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var showForgotPassword by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) onLoginSuccess()
    }

    NyaayAuthScaffold(
        title = "Litigant Login",
        subtitle = "Access your case information",
        onBack = onBack
    ) {
        // Error Banner
        uiState.errorMessage?.let { error ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = error,
                    modifier = Modifier.padding(12.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        // Email Field
        NyaayTextField(
            value = email,
            onValueChange = { email = it; viewModel.clearError() },
            label = "Email Address",
            leadingIcon = Icons.Default.Email,
            keyboardType = KeyboardType.Email
        )
        Spacer(modifier = Modifier.height(12.dp))

        // Password Field
        NyaayTextField(
            value = password,
            onValueChange = { password = it; viewModel.clearError() },
            label = "Password",
            leadingIcon = Icons.Default.Lock,
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
            onTrailingIconClick = { passwordVisible = !passwordVisible },
            keyboardType = KeyboardType.Password
        )
        Spacer(modifier = Modifier.height(8.dp))

        // Forgot Password
        TextButton(
            onClick = { showForgotPassword = true },
            modifier = Modifier.align(Alignment.End)
        ) {
            Text("Forgot Password?", style = MaterialTheme.typography.bodyMedium)
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Login Button
        NyaayButton(
            text = "Login to my Account",
            isLoading = uiState.isLoading,
            onClick = { viewModel.login(email, password, "litigant") },
            modifier = Modifier.fillMaxWidth()
        )
    }

    // Forgot Password Dialog
    if (showForgotPassword) {
        var resetEmail by remember { mutableStateOf(email) }
        AlertDialog(
            onDismissRequest = { showForgotPassword = false },
            title = { Text("Reset Password", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Enter your email to receive a reset link.")
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = resetEmail,
                        onValueChange = { resetEmail = it },
                        label = { Text("Email") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.resetPassword(resetEmail)
                    showForgotPassword = false
                }) { Text("Send Link") }
            },
            dismissButton = {
                TextButton(onClick = { showForgotPassword = false }) { Text("Cancel") }
            }
        )
    }
}
