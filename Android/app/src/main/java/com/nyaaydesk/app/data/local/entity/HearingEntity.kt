package com.nyaaydesk.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey

/** Local Room entity mirroring the `hearings` table in Supabase. */
@Entity(
    tableName = "hearings",
    foreignKeys = [
        ForeignKey(
            entity = CaseEntity::class,
            parentColumns = ["id"],
            childColumns = ["caseId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class HearingEntity(
    @PrimaryKey val id: String,
    val caseId: String,
    val hearingDate: String,
    val nextHearingDate: String?,
    val orderText: String?,
    val attendanceMarked: Boolean = false,
    val judgeNotes: String?,
    val createdAt: String?
)
