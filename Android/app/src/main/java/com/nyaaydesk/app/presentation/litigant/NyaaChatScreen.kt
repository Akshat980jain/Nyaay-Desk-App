package com.nyaaydesk.app.presentation.litigant

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nyaaydesk.app.presentation.theme.*

/**
 * NyaaChatScreen — Redesigned to match Stitch nyaay_saathi_ai_chatbot.
 *
 * Layout:
 * - Dark navy top bar: "Nyaay Desk" logo + Logout (no back button on this Stitch version)
 * - Chat area on light gray background
 * - AI messages: gray bubble on left with robot avatar circle
 * - User messages: dark navy bubble on right
 * - Quick suggestion chips below last AI message
 * - Bottom: scrollable quick action chips + text input field + gold send FAB
 * - Bottom nav bar visible at bottom
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NyaaChatScreen(onBack: () -> Unit) {
    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val chatMessages = remember {
        mutableStateListOf(
            ChatMessage("Hello! I am Nyaay-Saathi, your AI legal assistant. How can I help you with your case today?", false),
            ChatMessage("I need to check the status of my civil suit regarding property dispute.", true),
            ChatMessage("Certainly. To help you with the specific status, I will need your Case Number or CNR Number. Do you have that information available?", false, listOf("Yes, I have it", "Search by Name instead"))
        )
    }

    Column(modifier = Modifier.fillMaxSize().background(LightGrayBackground)) {
        // ── TOP NAV ──────────────────────────────────────────────────────
        NyaayTopBar(onLogout = onBack)

        // ── CHAT AREA ────────────────────────────────────────────────────
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Date chip
            item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Surface(
                        color = Color(0xFFDEE2E6),
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            "Today, 10:00 AM",
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = DeepNavy.copy(0.6f)
                        )
                    }
                }
            }

            items(chatMessages) { message ->
                NyaaChatBubble(message)
            }
        }

        // ── QUICK ACTION CHIPS ───────────────────────────────────────────
        Surface(color = PureWhite, shadowElevation = 2.dp) {
            Column {
                LazyRow(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val quickActions = listOf(
                        Pair(Icons.Default.Search, "Check case status"),
                        Pair(Icons.Default.Person, "Find an advocate"),
                        Pair(Icons.AutoMirrored.Filled.Help, "How to file")
                    )
                    items(quickActions) { (icon, label) ->
                        Surface(
                            color = LightGrayBackground,
                            shape = RoundedCornerShape(50),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFDEE2E6))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(icon, null, Modifier.size(14.dp), tint = DeepNavy.copy(0.6f))
                                Text(label, style = MaterialTheme.typography.labelSmall, color = DeepNavy.copy(0.7f))
                            }
                        }
                    }
                }

                // ── TEXT INPUT BAR ────────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        placeholder = {
                            Text(
                                "Type your message to Nyaay-Saathi...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = DeepNavy.copy(0.4f)
                            )
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(50),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color(0xFFDEE2E6),
                            focusedBorderColor = GoldAmber,
                            unfocusedContainerColor = LightGrayBackground,
                            focusedContainerColor = LightGrayBackground
                        ),
                        singleLine = true
                    )
                    FloatingActionButton(
                        onClick = {
                            if (messageText.isNotBlank()) {
                                chatMessages.add(ChatMessage(messageText, true))
                                messageText = ""
                            }
                        },
                        modifier = Modifier.size(48.dp),
                        containerColor = GoldAmber,
                        contentColor = DeepNavy,
                        elevation = FloatingActionButtonDefaults.elevation(0.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, "Send", Modifier.size(20.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun NyaaChatBubble(message: ChatMessage) {
    if (message.isUser) {
        // User message — right-aligned, dark navy bubble
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
            Surface(
                color = DeepNavy,
                shape = RoundedCornerShape(20.dp, 20.dp, 4.dp, 20.dp)
            ) {
                Text(
                    text = message.text,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        .widthIn(max = 280.dp),
                    color = PureWhite,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    } else {
        // AI message — left-aligned, gray bubble with robot avatar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(modifier = Modifier.size(36.dp), shape = CircleShape, color = Color(0xFFDEE2E6)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.SmartToy, null, Modifier.size(20.dp), tint = DeepNavy)
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(
                    color = Color(0xFFE9ECEF),
                    shape = RoundedCornerShape(20.dp, 20.dp, 20.dp, 4.dp)
                ) {
                    Text(
                        text = message.text,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                            .widthIn(max = 280.dp),
                        color = DeepNavy,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                // Quick reply chips if present
                if (!message.quickReplies.isNullOrEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        message.quickReplies.forEach { reply ->
                            Surface(
                                color = PureWhite,
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFDEE2E6))
                            ) {
                                Text(
                                    reply,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = DeepNavy
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val quickReplies: List<String>? = null
)
