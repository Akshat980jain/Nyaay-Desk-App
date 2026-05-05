package com.nyaaydesk.app.presentation.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.components.NyaayAuthScaffold
import com.nyaaydesk.app.presentation.components.NyaayButton
import com.nyaaydesk.app.presentation.components.NyaayTextField

/** Court Clerk Login Screen. Role enforced to "clerk". Session auto-expires after inactivity. */
@Composable
fun ClerkLoginScreen(
    onLoginSuccess: () -> Unit,
    onBack: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) onLoginSuccess()
    }

    NyaayAuthScaffold(
        title = "Court Clerk Login",
        subtitle = "Court operations management portal",
        onBack = onBack
    ) {
        uiState.errorMessage?.let { error ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(text = error, modifier = Modifier.padding(12.dp), color = MaterialTheme.colorScheme.onErrorContainer)
            }
            Spacer(modifier = Modifier.height(12.dp))
        }

        NyaayTextField(
            value = email,
            onValueChange = { email = it; viewModel.clearError() },
            label = "Official Email",
            leadingIcon = Icons.Default.Badge,
            keyboardType = KeyboardType.Email
        )
        Spacer(modifier = Modifier.height(12.dp))
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
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(16.dp))
                Text("Sessions auto-expire after 15 minutes of inactivity.", style = MaterialTheme.typography.labelSmall)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        NyaayButton(
            text = "Login as Clerk",
            isLoading = uiState.isLoading,
            onClick = { viewModel.login(email, password, "clerk") },
            modifier = Modifier.fillMaxWidth()
        )
    }
}
