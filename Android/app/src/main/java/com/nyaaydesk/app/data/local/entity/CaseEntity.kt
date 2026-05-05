package com.nyaaydesk.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Local Room entity mirroring the `cases` table in the Supabase PostgreSQL database.
 * All columns match the snake_case schema used by the web application.
 */
@Entity(tableName = "cases")
data class CaseEntity(
    @PrimaryKey val id: String,
    val caseNumber: String,
    val cnrNumber: String?,
    val caseTitle: String,
    val status: String,         // e.g. "pending", "disposed", "stayed"
    val litigantId: String,
    val advocateId: String?,
    val courtId: String?,
    val judgeName: String?,
    val filingDate: String?,
    val nextHearingDate: String?,
    val caseType: String?,
    val description: String?,
    val documentUrls: List<String> = emptyList(),
    val lastSyncedAt: Long = System.currentTimeMillis()
)
