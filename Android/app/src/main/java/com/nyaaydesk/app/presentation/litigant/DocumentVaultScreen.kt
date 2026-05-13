package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.nyaaydesk.app.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentVaultScreen(
    onBack: () -> Unit
) {
    var selectedCategory by remember { mutableStateOf("All") }
    val categories = listOf("All", "IDs", "Evidence", "Orders", "Affidavits")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Document Vault", fontWeight = FontWeight.Bold, color = GovNavyBlue) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = GovNavyBlue)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundLight)
            )
        },
        containerColor = BackgroundLight
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            // Category Selector
            LazyRow(
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { category ->
                    FilterChip(
                        selected = selectedCategory == category,
                        onClick = { selectedCategory = category },
                        label = { Text(category) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = GovNavyBlue,
                            selectedLabelColor = Color.White
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = selectedCategory == category,
                            borderColor = GovNavyBlue.copy(alpha = 0.1f),
                            selectedBorderColor = GovNavyBlue
                        )
                    )
                }
            }

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                val dummyDocs = listOf(
                    DocumentItem("Final Judgment.pdf", "Orders"),
                    DocumentItem("Aadhar Card.pdf", "IDs"),
                    DocumentItem("Property Deed.pdf", "Evidence"),
                    DocumentItem("Case Summary.pdf", "Evidence"),
                    DocumentItem("Affidavit_Signed.pdf", "Affidavits"),
                    DocumentItem("PAN Card.pdf", "IDs")
                ).filter { selectedCategory == "All" || it.category == selectedCategory }

                items(dummyDocs) { doc ->
                    DocumentCard(doc)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DocumentCard(doc: DocumentItem) {
    Card(
        onClick = { /* Open PDF */ },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier.size(72.dp),
                color = GovNavyBlue.copy(alpha = 0.05f),
                shape = RoundedCornerShape(20.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = when(doc.category) {
                            "IDs" -> Icons.Default.Badge
                            "Orders" -> Icons.Default.Gavel
                            else -> Icons.Default.Description
                        },
                        contentDescription = null,
                        tint = GovNavyBlue,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = doc.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = GovNavyBlue,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            Text(
                text = doc.category,
                style = MaterialTheme.typography.labelSmall,
                color = GovNavyBlue.copy(alpha = 0.4f)
            )
        }
    }
}

data class DocumentItem(val name: String, val category: String)

