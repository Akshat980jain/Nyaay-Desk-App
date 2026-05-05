package com.nyaaydesk.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.nyaaydesk.app.MainActivity
import com.nyaaydesk.app.R
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Firebase Cloud Messaging Service.
 *
 * Handles two responsibilities:
 * 1. onNewToken: When FCM assigns a new device token, upload it to Supabase `user_fcm_tokens` table.
 * 2. onMessageReceived: Display a native notification when a hearing update is received.
 *
 * The Supabase Edge Function `send-push-notification` sends FCM messages when
 * a hearing is updated in the database (via PostgreSQL trigger).
 */
@AndroidEntryPoint
class NyaayDeskMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var supabase: SupabaseClient

    companion object {
        const val CHANNEL_ID = "nyaaydesk_hearings"
        const val CHANNEL_NAME = "Hearing Updates"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Upload FCM token to Supabase whenever it refreshes
        CoroutineScope(Dispatchers.IO).launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch
            runCatching {
                supabase.postgrest["user_fcm_tokens"].upsert(
                    mapOf(
                        "user_id" to userId,
                        "token" to token,
                        "platform" to "android"
                    )
                )
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val title = message.notification?.title ?: message.data["title"] ?: "NyaayDesk"
        val body = message.notification?.body ?: message.data["body"] ?: "You have a new update."

        createNotificationChannel()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            // Pass case ID for deep linking if present
            message.data["case_id"]?.let { putExtra("case_id", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_notification_clear_all)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for hearing date changes and case updates."
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}
