package com.nyaaydesk.app.presentation.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.presentation.theme.*

/**
 * LoginRoleSelectScreen — Implemented to match Stitch login_modern_tile_selection.
 */
@Composable
fun LoginRoleSelectScreen(
    onLoginSuccess: (String) -> Unit, // Passes role
    onNavigateToRegistration: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedRole by remember { mutableStateOf("Advocate") }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onLoginSuccess(uiState.userType ?: selectedRole)
        }
    }

    val roles = listOf(
        RoleInfo("Advocate", Icons.Default.Gavel),
        RoleInfo("Litigant", Icons.Default.Person),
        RoleInfo("Clerk", Icons.Default.FolderShared),
        RoleInfo("Admin", Icons.Default.AdminPanelSettings)
    )

    Box(modifier = Modifier.fillMaxSize()) {
        // Decorative Background Split
        Column(modifier = Modifier.fillMaxSize()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth().background(DeepNavy))
            Box(modifier = Modifier.weight(2f).fillMaxWidth().background(LightGrayBackground))
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header Section
            Text(
                "Nyaay Desk",
                style = MaterialTheme.typography.displayLarge,
                fontWeight = FontWeight.Bold,
                color = PureWhite,
                fontSize = 32.sp
            )
            Text(
                "Secure Judicial Access Portal",
                style = MaterialTheme.typography.bodyLarge,
                color = PureWhite.copy(alpha = 0.7f),
                modifier = Modifier.padding(top = 8.dp, bottom = 32.dp)
            )

            // Main Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    // Error Display
                    uiState.errorMessage?.let { error ->
                        Surface(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = error,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(12.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    Text(
                        "SELECT ROLE TO CONTINUE",
                        style = MaterialTheme.typography.labelSmall,
                        color = DeepNavy.copy(alpha = 0.6f),
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                    )

                    // Role Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        roles.forEach { role ->
                            RoleTile(
                                role = role,
                                isSelected = selectedRole == role.name,
                                onClick = { 
                                    selectedRole = role.name 
                                    viewModel.clearError()
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // Login Form
                    val identifierLabel = "Email Address"
                    val identifierPlaceholder = "Enter your registered email"

                    Text(
                        identifierLabel,
                        style = MaterialTheme.typography.labelMedium,
                        color = DeepNavy,
                        fontWeight = FontWeight.SemiBold
                    )
                    OutlinedTextField(
                        value = identifier,
                        onValueChange = { 
                            identifier = it 
                            viewModel.clearError()
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        placeholder = { Text(identifierPlaceholder, color = DeepNavy.copy(0.4f)) },
                        shape = RoundedCornerShape(8.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = DeepNavy,
                            unfocusedTextColor = DeepNavy,
                            unfocusedBorderColor = Color(0xFFC4C6CC),
                            focusedBorderColor = GoldAmber
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        "Password",
                        style = MaterialTheme.typography.labelMedium,
                        color = DeepNavy,
                        fontWeight = FontWeight.SemiBold
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { 
                            password = it 
                            viewModel.clearError()
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        placeholder = { Text("Enter your password", color = DeepNavy.copy(0.4f)) },
                        shape = RoundedCornerShape(8.dp),
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = DeepNavy.copy(0.5f)
                                )
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = DeepNavy,
                            unfocusedTextColor = DeepNavy,
                            unfocusedBorderColor = Color(0xFFC4C6CC),
                            focusedBorderColor = GoldAmber
                        )
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(
                                checked = false,
                                onCheckedChange = {},
                                colors = CheckboxDefaults.colors(checkedColor = GoldAmber)
                            )
                            Text("Remember me", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.6f))
                        }
                        Text(
                            "Forgot Password?",
                            style = MaterialTheme.typography.labelSmall,
                            color = DeepNavy,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { }
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { viewModel.login(identifier, password, selectedRole.lowercase()) },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAmber),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !uiState.isLoading
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = DeepNavy)
                        } else {
                            Text("Secure Login", fontWeight = FontWeight.Bold, color = DeepNavy)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp), tint = DeepNavy)
                        }
                    }
                }

                // Footer Actions
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF3F4F5))
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { }) {
                            Icon(Icons.AutoMirrored.Filled.Help, contentDescription = null, modifier = Modifier.size(16.dp), tint = DeepNavy.copy(0.6f))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Support", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.6f))
                        }
                        Spacer(modifier = Modifier.width(24.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onNavigateToRegistration() }) {
                            Icon(Icons.Default.AppRegistration, contentDescription = null, modifier = Modifier.size(16.dp), tint = DeepNavy.copy(0.6f))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Register", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.6f))
                        }
                    }
                }
            }

            // Security Badge
            Row(
                modifier = Modifier.padding(top = 32.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp), tint = DeepNavy.copy(0.5f))
                Spacer(modifier = Modifier.width(8.dp))
                Text("End-to-End Encrypted Connection", style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.5f))
            }
        }
    }
}

@Composable
fun RoleTile(
    role: RoleInfo,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .aspectRatio(1f)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) GoldAmber.copy(alpha = 0.1f) else Color(0xFFF8F9FA),
        border = BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) GoldAmber else Color(0xFFC4C6CC)
        )
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = role.icon,
                contentDescription = null,
                tint = if (isSelected) GoldAmber else DeepNavy.copy(alpha = 0.5f),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                role.name,
                style = MaterialTheme.typography.labelSmall,
                fontSize = 10.sp,
                color = if (isSelected) DeepNavy else DeepNavy.copy(alpha = 0.6f),
                textAlign = TextAlign.Center
            )
        }
    }
}

data class RoleInfo(val name: String, val icon: ImageVector)

