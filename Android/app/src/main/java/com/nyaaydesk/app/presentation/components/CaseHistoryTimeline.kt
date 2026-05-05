package com.nyaaydesk.app.presentation.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nyaaydesk.app.data.remote.dto.HearingDto
import com.nyaaydesk.app.presentation.theme.GoldAmber
import com.nyaaydesk.app.presentation.theme.NavyBlue

/**
 * CaseHistoryTimeline — High-fidelity vertical timeline showing case progression.
 * 
 * Features:
 * - Dynamic spine drawing using Compose Canvas.
 * - Hearing cards with date, order text, and status.
 */
@Composable
fun CaseHistoryTimeline(
    hearings: List<HearingDto>,
    modifier: Modifier = Modifier
) {
    if (hearings.isEmpty()) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No hearing history available.", color = Color.Gray)
        }
        return
    }

    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(16.dp)
    ) {
        itemsIndexed(hearings) { index, hearing ->
            TimelineItem(
                hearing = hearing,
                isLast = index == hearings.size - 1,
                isFirst = index == 0
            )
        }
    }
}

@Composable
private fun TimelineItem(
    hearing: HearingDto,
    isLast: Boolean,
    isFirst: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min)
    ) {
        // Spine & Indicator Column
        Column(
            modifier = Modifier.width(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier.weight(1f),
                contentAlignment = Alignment.Center
            ) {
                // Vertical Line
                Canvas(modifier = Modifier.fillMaxHeight()) {
                    val startY = if (isFirst) size.height / 2 else 0f
                    val endY = if (isLast) size.height / 2 else size.height
                    
                    drawLine(
                        color = NavyBlue.copy(alpha = 0.2f),
                        start = Offset(size.width / 2, startY),
                        end = Offset(size.width / 2, endY),
                        strokeWidth = 2.dp.toPx()
                    )
                }

                // Dot / Indicator
                Surface(
                    shape = CircleShape,
                    color = if (isFirst) GoldAmber else NavyBlue,
                    modifier = Modifier.size(16.dp),
                    border = if (isFirst) null else androidx.compose.foundation.BorderStroke(2.dp, Color.White)
                ) {
                    if (isFirst) {
                        Icon(
                            Icons.Default.Gavel,
                            null,
                            tint = NavyBlue,
                            modifier = Modifier.padding(3.dp)
                        )
                    }
                }
            }
        }

        // Content Column
        Card(
            modifier = Modifier
                .padding(vertical = 8.dp)
                .fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = hearing.hearingDate,
                        style = MaterialTheme.typography.labelLarge,
                        color = NavyBlue,
                        fontWeight = FontWeight.Bold
                    )
                    if (hearing.attendanceMarked) {
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = CircleShape
                        ) {
                            Text(
                                "Heard",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF2E7D32)
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = hearing.orderText ?: "No order uploaded for this hearing.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                )

                if (!hearing.nextHearingDate.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Next: ${hearing.nextHearingDate}",
                        style = MaterialTheme.typography.labelSmall,
                        color = GoldAmber,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
