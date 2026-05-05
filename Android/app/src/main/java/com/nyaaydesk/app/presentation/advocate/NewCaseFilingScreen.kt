package com.nyaaydesk.app.presentation.advocate

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nyaaydesk.app.data.remote.dto.CaseDto
import com.nyaaydesk.app.presentation.components.NyaayButton
import com.nyaaydesk.app.presentation.components.NyaayTextField
import com.nyaaydesk.app.presentation.theme.NavyBlue
import java.util.UUID

/**
 * New Case Filing Screen — Multi-step stepper wizard (3 steps).
 * Step 1: Party Details  |  Step 2: Case Info  |  Step 3: Documents
 * On submit: inserts into Supabase `cases` table.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewCaseFilingScreen(
    onSuccess: () -> Unit,
    onBack: () -> Unit,
    viewModel: AdvocateViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var currentStep by remember { mutableIntStateOf(0) }

    // Form fields
    var caseTitle by remember { mutableStateOf("") }
    var caseType by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var litigantName by remember { mutableStateOf("") }
    var litigantPhone by remember { mutableStateOf("") }
    var caseNumber by remember { mutableStateOf("") }
    var cnrNumber by remember { mutableStateOf("") }

    LaunchedEffect(uiState.filingSuccess) {
        if (uiState.filingSuccess) { viewModel.resetFilingState(); onSuccess() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("File New Case", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Step Indicator
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Party", "Case Info", "Submit").forEachIndexed { index, label ->
                    val isActive = index == currentStep
                    val isDone = index < currentStep
                    Surface(
                        modifier = Modifier.weight(1f),
                        color = when { isDone -> NavyBlue; isActive -> NavyBlue.copy(alpha = 0.2f); else -> MaterialTheme.colorScheme.surfaceVariant },
                        shape = MaterialTheme.shapes.small
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (isDone) Icon(Icons.Default.Check, null, tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(14.dp))
                            Text(
                                label,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isDone) androidx.compose.ui.graphics.Color.White else MaterialTheme.colorScheme.onSurface,
                                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }

            // Step Content
            when (currentStep) {
                0 -> {
                    // Step 1: Party Details
                    Text("Party Details", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    NyaayTextField(value = litigantName, onValueChange = { litigantName = it },
                        label = "Litigant Full Name", leadingIcon = Icons.Default.Person)
                    NyaayTextField(value = litigantPhone, onValueChange = { litigantPhone = it },
                        label = "Litigant Phone", leadingIcon = Icons.Default.Phone,
                        keyboardType = KeyboardType.Phone)
                }
                1 -> {
                    // Step 2: Case Information
                    Text("Case Information", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    NyaayTextField(value = caseTitle, onValueChange = { caseTitle = it },
                        label = "Case Title", leadingIcon = Icons.Default.Gavel)
                    NyaayTextField(value = caseType, onValueChange = { caseType = it },
                        label = "Case Type (e.g. Civil, Criminal)", leadingIcon = Icons.Default.Category)
                    NyaayTextField(value = caseNumber, onValueChange = { caseNumber = it },
                        label = "Case Number", leadingIcon = Icons.Default.Numbers)
                    NyaayTextField(value = cnrNumber, onValueChange = { cnrNumber = it },
                        label = "CNR Number (optional)", leadingIcon = Icons.Default.Tag)
                    NyaayTextField(value = description, onValueChange = { description = it },
                        label = "Case Description", leadingIcon = Icons.Default.Description,
                        singleLine = false, maxLines = 4)
                }
                2 -> {
                    // Step 3: Review & Submit
                    Text("Review & File", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            ReviewRow("Case Title", caseTitle)
                            ReviewRow("Case Type", caseType)
                            ReviewRow("Case Number", caseNumber)
                            ReviewRow("CNR Number", cnrNumber.ifBlank { "Not provided" })
                            ReviewRow("Litigant", litigantName)
                        }
                    }
                    uiState.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Navigation Buttons
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (currentStep > 0) {
                    OutlinedButton(onClick = { currentStep-- }, modifier = Modifier.weight(1f)) {
                        Text("Back")
                    }
                }
                NyaayButton(
                    text = if (currentStep < 2) "Next" else "File Case",
                    isLoading = uiState.isLoading,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        if (currentStep < 2) {
                            currentStep++
                        } else {
                            // Submit
                            viewModel.fileNewCase(
                                CaseDto(
                                    id = UUID.randomUUID().toString(),
                                    caseNumber = caseNumber,
                                    cnrNumber = cnrNumber.ifBlank { null },
                                    caseTitle = caseTitle,
                                    status = "pending",
                                    litigantId = "",
                                    advocateId = null,
                                    caseType = caseType,
                                    description = description
                                )
                            )
                        }
                    }
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ReviewRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
    }
}
