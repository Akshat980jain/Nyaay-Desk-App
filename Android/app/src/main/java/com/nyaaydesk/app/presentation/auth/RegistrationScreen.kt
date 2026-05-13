package com.nyaaydesk.app.presentation.auth

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.nyaaydesk.app.presentation.theme.*

/**
 * RegistrationScreen — Implemented to match Stitch registration_structured_sections.
 */
@Composable
fun RegistrationScreen(
    onBack: () -> Unit,
    onRegistrationComplete: () -> Unit
) {
    var selectedRole by remember { mutableStateOf("Litigant") }
    var expandedSection by remember { mutableStateOf(1) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightGrayBackground)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(DeepNavy)
                .statusBarsPadding()
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = GoldAmber)
                }
                Text(
                    "Nyaay Desk",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = GoldAmber
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Main Canvas Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF101B30))
                    .padding(vertical = 32.dp, horizontal = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Registration",
                        style = MaterialTheme.typography.displaySmall,
                        color = PureWhite,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Please complete the form below to create your account.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = PureWhite.copy(0.6f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp)
                    )

                    // Role Selection Toggle
                    Surface(
                        modifier = Modifier.padding(top = 24.dp),
                        shape = RoundedCornerShape(8.dp),
                        color = PureWhite.copy(0.1f)
                    ) {
                        Row(modifier = Modifier.padding(4.dp)) {
                            RoleToggleButton("Litigant", selectedRole == "Litigant") { selectedRole = "Litigant" }
                            RoleToggleButton("Advocate", selectedRole == "Advocate") { selectedRole = "Advocate" }
                            RoleToggleButton("Court Clerk", selectedRole == "Court Clerk") { selectedRole = "Court Clerk" }
                        }
                    }
                }
            }

            // Accordion Sections
            Spacer(modifier = Modifier.height(16.dp))

            RegistrationSection(
                index = 1,
                title = "Personal Details",
                isExpanded = expandedSection == 1,
                onToggle = { expandedSection = if (expandedSection == 1) 0 else 1 }
            ) {
                PersonalDetailsForm()
            }

            RegistrationSection(
                index = 2,
                title = "Address Details",
                isExpanded = expandedSection == 2,
                onToggle = { expandedSection = if (expandedSection == 2) 0 else 2 }
            ) {
                AddressDetailsForm()
            }

            RegistrationSection(
                index = 3,
                title = "Secure Account",
                isExpanded = expandedSection == 3,
                onToggle = { expandedSection = if (expandedSection == 3) 0 else 3 }
            ) {
                SecureAccountForm()
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Form Actions
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = PureWhite,
                shadowElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.padding(24.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    OutlinedButton(
                        onClick = onBack,
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, DeepNavy)
                    ) {
                        Text("Cancel", color = DeepNavy, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = onRegistrationComplete,
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = GoldAmber)
                    ) {
                        Text("Complete Registration", fontWeight = FontWeight.Bold, color = DeepNavy)
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp), tint = DeepNavy)
                    }
                }
            }
        }
    }
}

@Composable
private fun RoleToggleButton(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(6.dp),
        color = if (isSelected) GoldAmber else Color.Transparent
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = if (isSelected) DeepNavy else PureWhite.copy(0.6f)
        )
    }
}

@Composable
private fun RegistrationSection(
    index: Int,
    title: String,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        border = BorderStroke(1.dp, Color(0xFFDEE2E6))
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onToggle)
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier.size(32.dp),
                    shape = CircleShape,
                    color = if (isExpanded) GoldAmber else LightGrayBackground
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            index.toString(),
                            fontWeight = FontWeight.Bold,
                            color = if (isExpanded) DeepNavy else DeepNavy.copy(0.6f)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    title,
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF101B30)
                )
                Icon(
                    if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = DeepNavy.copy(0.4f)
                )
            }

            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    content()
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun PersonalDetailsForm() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        NyaayInputLabel("Party Type")
        NyaayRegistrationDropdown(listOf("Individual", "Organization"), "Select Party Type")
        
        NyaayInputLabel("Full Name")
        NyaayRegistrationTextField(placeholder = "Enter your full name")
        
        NyaayInputLabel("Parent's Name")
        NyaayRegistrationTextField(placeholder = "Enter parent's full name")
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(modifier = Modifier.weight(1f)) {
                NyaayInputLabel("Gender")
                NyaayRegistrationDropdown(listOf("Male", "Female", "Other"), "Select Gender")
            }
            Column(modifier = Modifier.weight(1f)) {
                NyaayInputLabel("Date of Birth")
                NyaayRegistrationTextField(placeholder = "DD/MM/YYYY")
            }
        }
    }
}

@Composable
private fun AddressDetailsForm() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        NyaayInputLabel("Street/House/Village")
        NyaayRegistrationTextField(placeholder = "Enter complete address", singleLine = false, modifier = Modifier.height(80.dp))
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(modifier = Modifier.weight(1f)) {
                NyaayInputLabel("City")
                NyaayRegistrationTextField(placeholder = "Enter city")
            }
            Column(modifier = Modifier.weight(1f)) {
                NyaayInputLabel("District")
                NyaayRegistrationTextField(placeholder = "Enter district")
            }
        }
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(modifier = Modifier.weight(1f)) {
                NyaayInputLabel("State")
                NyaayRegistrationDropdown(listOf("Delhi", "Maharashtra", "Uttar Pradesh"), "Select State")
            }
            Column(modifier = Modifier.weight(1f)) {
                NyaayInputLabel("Pincode")
                NyaayRegistrationTextField(placeholder = "6-digit pincode")
            }
        }
    }
}

@Composable
private fun SecureAccountForm() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        NyaayInputLabel("Email Address")
        NyaayRegistrationTextField(placeholder = "Enter valid email")
        
        NyaayInputLabel("Mobile Number")
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                modifier = Modifier.height(48.dp),
                shape = RoundedCornerShape(8.dp, 0.dp, 0.dp, 8.dp),
                color = Color(0xFFF3F4F5),
                border = BorderStroke(1.dp, Color(0xFFC4C6CC))
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(horizontal = 12.dp)) {
                    Text("+91", style = MaterialTheme.typography.bodyMedium, color = DeepNavy.copy(0.6f))
                }
            }
            NyaayRegistrationTextField(
                placeholder = "10-digit mobile number",
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(0.dp, 8.dp, 8.dp, 0.dp)
            )
        }
        
        NyaayInputLabel("Password")
        NyaayRegistrationTextField(placeholder = "Create password", isPassword = true)
        
        NyaayInputLabel("Confirm Password")
        NyaayRegistrationTextField(placeholder = "Confirm password", isPassword = true)
    }
}

@Composable
private fun NyaayInputLabel(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.labelSmall,
        color = DeepNavy.copy(0.6f),
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(bottom = 4.dp)
    )
}

@Composable
private fun NyaayRegistrationTextField(
    placeholder: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = true,
    isPassword: Boolean = false,
    shape: RoundedCornerShape = RoundedCornerShape(8.dp)
) {
    OutlinedTextField(
        value = "",
        onValueChange = {},
        modifier = modifier.fillMaxWidth(),
        placeholder = { Text(placeholder, color = DeepNavy.copy(0.4f)) },
        shape = shape,
        singleLine = singleLine,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = DeepNavy,
            unfocusedTextColor = DeepNavy,
            unfocusedBorderColor = Color(0xFFC4C6CC),
            focusedBorderColor = GoldAmber,
            unfocusedContainerColor = PureWhite,
            focusedContainerColor = PureWhite
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NyaayRegistrationDropdown(options: List<String>, placeholder: String) {
    var expanded by remember { mutableStateOf(false) }
    var selectedOption by remember { mutableStateOf("") }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = selectedOption,
            onValueChange = {},
            readOnly = true,
            placeholder = { Text(placeholder, color = DeepNavy.copy(0.4f)) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            shape = RoundedCornerShape(8.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = DeepNavy,
                unfocusedTextColor = DeepNavy,
                unfocusedBorderColor = Color(0xFFC4C6CC),
                focusedBorderColor = GoldAmber
            )
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        selectedOption = option
                        expanded = false
                    }
                )
            }
        }
    }
}
